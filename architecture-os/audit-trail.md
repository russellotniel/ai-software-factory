# Audit Trail

> Part of the AI Software Factory — Architecture OS
> Defines the standard audit trail pattern for all projects.
> Every project gets audit logging — not just regulated ones.

---

## Approach: Table + Trigger

We use the **table + trigger approach** over pg_audit as the primary audit mechanism.

|                   | Table + Trigger | pg_audit           |
| ----------------- | --------------- | ------------------ |
| Storage           | Database table  | Postgres log files |
| Queryable         | ✅ Yes          | ❌ No              |
| UI-surfaceable    | ✅ Yes          | ❌ No              |
| Per-table control | ✅ Yes          | ✅ Yes (complex)   |
| Captures SELECT   | ❌ No           | ✅ Yes             |
| Captures DDL      | ❌ No           | ✅ Yes             |
| Setup complexity  | Low             | High               |

**For regulated projects:** supplement with pg_audit to capture SELECT and DDL activity.
**For all projects:** table + trigger is the primary queryable audit trail.

---

## Schema

```sql
-- Audit schema (separate from public — not exposed via PostgREST)
CREATE SCHEMA IF NOT EXISTS audit;

-- Single audit table for the entire project
CREATE TABLE audit.audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       UUID,                          -- NULL for global/system operations
  table_name      TEXT NOT NULL,
  record_id       UUID NOT NULL,                 -- PK of the changed row
  operation       TEXT NOT NULL,                 -- INSERT | UPDATE | DELETE
  old_data        JSONB,                         -- previous state (NULL for INSERT)
  new_data        JSONB,                         -- new state (NULL for DELETE)
  changed_fields  JSONB,                         -- only changed fields (UPDATE only)
  performed_by    UUID,                          -- auth.uid() — NULL for system ops
  performed_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address      TEXT,                          -- from request context if available
  user_agent      TEXT                           -- from request context if available
);

-- Indexes for query performance
CREATE INDEX idx_audit_tenant_id   ON audit.audit_logs(tenant_id);
CREATE INDEX idx_audit_table_name  ON audit.audit_logs(table_name);
CREATE INDEX idx_audit_record_id   ON audit.audit_logs(record_id);
CREATE INDEX idx_audit_performed_at ON audit.audit_logs(performed_at DESC);
CREATE INDEX idx_audit_performed_by ON audit.audit_logs(performed_by);

-- Immutable for regulated projects — prevent tampering
-- ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "insert_only" ON audit.audit_logs FOR INSERT WITH CHECK (true);
-- (no SELECT, UPDATE, DELETE policies for non-admin roles)
```

---

## Generic Trigger Function

Create once. Attach to any table with one line.

```sql
CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit.audit_logs (
    tenant_id,
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_fields,
    performed_by
  )
  VALUES (
    -- tenant_id: try new row first, then old row, then null
    COALESCE(
      (NEW.tenant_id)::UUID,
      (OLD.tenant_id)::UUID
    ),
    TG_TABLE_NAME,
    -- record_id: use new for INSERT/UPDATE, old for DELETE
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    -- old_data: only for UPDATE and DELETE
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    -- new_data: only for INSERT and UPDATE
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    -- changed_fields: only for UPDATE — captures only what changed
    CASE WHEN TG_OP = 'UPDATE' THEN (
      SELECT jsonb_object_agg(key, value)
      FROM jsonb_each(to_jsonb(NEW))
      WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key
    ) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
```

---

## Enabling on a Table

One line to enable audit logging on any table:

```sql
CREATE TRIGGER audit_{table_name}
  AFTER INSERT OR UPDATE OR DELETE ON public.{table_name}
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
```

This is included in every new table migration by default.
See `architecture-os/schema-conventions.md` — migration template.

---

## Which Tables Get Audit Triggers

### Always (business-critical)

- `public.profiles`
- `public.tenants`
- `public.tenant_members`
- Any user-generated content table (projects, tasks, documents, etc.)
- Any financial or transactional table

### Optional (lower risk)

- Config / lookup tables — decide per project
- Session or ephemeral tables — usually not needed

### Never

- `audit.audit_logs` itself
- Auth schema tables (managed by Supabase)

---

## Querying the Audit Log

```sql
-- Full history of a specific record
SELECT *
FROM audit.audit_logs
WHERE record_id = '[record_uuid]'
ORDER BY performed_at DESC;

-- All changes by a specific user
SELECT *
FROM audit.audit_logs
WHERE performed_by = '[user_uuid]'
ORDER BY performed_at DESC;

-- All changes in a tenant today
SELECT *
FROM audit.audit_logs
WHERE tenant_id = '[tenant_uuid]'
AND performed_at >= CURRENT_DATE
ORDER BY performed_at DESC;

-- Only updates, showing what changed
SELECT
  table_name,
  record_id,
  changed_fields,
  performed_by,
  performed_at
FROM audit.audit_logs
WHERE operation = 'UPDATE'
AND tenant_id = '[tenant_uuid]'
ORDER BY performed_at DESC;
```

---

## Regulated Projects — pg_audit Supplement

For projects requiring SELECT and DDL tracking:

```sql
-- Enable pg_audit extension
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure in Supabase dashboard or via SQL:
-- Track DDL changes (CREATE, ALTER, DROP)
ALTER ROLE postgres SET pgaudit.log = 'ddl';

-- Track specific sensitive tables (object-level logging)
CREATE ROLE auditor NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN;
SET pgaudit.role = 'auditor';

-- Grant auditor access to sensitive tables only
GRANT SELECT ON public.sensitive_table TO auditor;
-- pg_audit will now log all SELECT on sensitive_table
```

pg_audit logs go to Postgres log files — export and retain per compliance requirements.

---

## Retention Policy

| Project Type                   | Retention                  |
| ------------------------------ | -------------------------- |
| Standard                       | Minimum 1 year             |
| Regulated (healthcare, pharma) | Minimum 7 years            |
| Financial                      | Per regulatory requirement |

Implement retention via a scheduled function or pg_cron job that archives old records.
