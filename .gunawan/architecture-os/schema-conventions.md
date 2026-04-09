# Schema Conventions

> Part of the AI Software Factory — Architecture OS
> This document defines the standard database schema conventions for all projects.
> Every AI agent, every developer, and every migration must follow these conventions.

---

## 1. Table Naming

- **Always plural** — `users`, `projects`, `tenants`, `tenant_members`
- **Snake case** — `project_tasks`, `audit_logs`, `tenant_members`
- **No prefixes** — never `tbl_users` or `t_projects`
- **Be descriptive** — prefer `project_attachments` over `attachments` when context matters
- **Bridge / join tables** — named by combining both table names: `tenant_members`, `project_tags`

```sql
-- ✅ Correct
CREATE TABLE public.projects (...);
CREATE TABLE public.project_tasks (...);
CREATE TABLE public.tenant_members (...);

-- ❌ Wrong
CREATE TABLE public.Project (...);
CREATE TABLE public.tbl_projects (...);
CREATE TABLE public.projectTask (...);
```

---

## 2. Column Naming

- **Always snake case** — `first_name`, `tenant_id`, `created_at`
- **Boolean columns** — prefix with `is_` or `has_` — `is_active`, `has_verified_email`
- **Timestamp columns** — suffix with `_at` — `created_at`, `deleted_at`, `published_at`
- **Foreign key columns** — suffix with `_id` — `tenant_id`, `created_by`, `project_id`
- **No abbreviations** — prefer `description` over `desc`, `quantity` over `qty`

```sql
-- ✅ Correct
tenant_id, created_by, is_active, deleted_at, first_name

-- ❌ Wrong
tenantId, CreatedBy, active, deletedAt, fname
```

---

## 3. Standard Columns

Every table in the `public` schema must include these columns unless explicitly justified otherwise.

```sql
CREATE TABLE public.example_table (
  -- Identity
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Tenancy (omit only for global/config tables like tenants, plans)
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ownership
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Soft delete (for business-critical tables — see Section 5)
  deleted_at      TIMESTAMPTZ DEFAULT NULL
);
```

### Column rules

| Column       | Required                    | Notes                                                        |
| ------------ | --------------------------- | ------------------------------------------------------------ |
| `id`         | ✅ Always                   | UUID, never serial/integer                                   |
| `tenant_id`  | ✅ Most tables              | Omit only for global tables: `tenants`, `subscription_plans` |
| `created_at` | ✅ Always                   | Auto-set, never manually assigned                            |
| `updated_at` | ✅ Always                   | Auto-maintained by trigger (see Section 7)                   |
| `created_by` | ✅ Always                   | Nullable — system operations may not have a user             |
| `updated_by` | ✅ Always                   | Nullable — same reason                                       |
| `deleted_at` | ⚠️ Business-critical tables | See Section 5 for rules                                      |

### Why UUID over serial/integer for `id`?

- Safe to generate client-side before insert
- No sequential guessing in URLs
- Works across distributed systems and migrations
- Supabase default

---

## 4. Schema Structure

Projects use multiple PostgreSQL schemas with clear separation of concerns.

```
public/      → All application tables. Exposed via PostgREST API.
audit/       → Audit trail tables. NOT exposed via PostgREST.
private/     → Internal functions, sensitive helpers. NOT exposed.
extensions/  → Third-party extensions (pgcrypto, etc.)
```

### Rules

- **Never expose `audit` or `private` schemas via PostgREST**
- **All application tables live in `public`**
- **All audit tables live in `audit`** — keeps `public` clean and audit data access-controlled
- **SECURITY DEFINER helper functions live in `private`** — `public` is API-exposed, so SECURITY DEFINER functions there are callable by anyone via `supabase.rpc()`. Exception: trigger functions (`set_updated_at`, `audit.log_changes`) must be in `public` or `audit` for PostgreSQL trigger attachment

---

## 5. Soft Deletes

Not all tables need soft deletes. The rule is:

### Use soft delete (`deleted_at`) for:

- User-generated content — `projects`, `tasks`, `documents`, `comments`
- Business entities — `tenants`, `users` (profiles), `invoices`, `orders`
- Anything with compliance / audit implications
- Anything a user might want to "restore"

### Use hard delete for:

- Join / bridge tables — `tenant_members`, `project_tags`
- Config / lookup tables — `subscription_plans`, `categories`
- Session or ephemeral data — `notifications`, `tokens`

### Implementation

```sql
-- Soft delete column (already in standard columns)
deleted_at TIMESTAMPTZ DEFAULT NULL

-- Standard view that excludes soft-deleted records
-- Create this for every soft-deletable table
CREATE VIEW public.active_projects AS
  SELECT * FROM public.projects
  WHERE deleted_at IS NULL;

-- Never do this manually everywhere:
-- ❌ SELECT * FROM projects WHERE deleted_at IS NULL
-- ✅ SELECT * FROM active_projects
```

### Performing a soft delete

```sql
UPDATE public.projects
SET
  deleted_at = NOW(),
  updated_by = auth.uid()
WHERE id = '[record_id]';
```

### RLS and soft deletes

RLS policies on soft-deletable tables must always include the `deleted_at IS NULL` check:

```sql
CREATE POLICY "tenant_isolation" ON public.projects
FOR SELECT USING (
  tenant_id = (SELECT private.get_active_tenant_id())
  AND deleted_at IS NULL
);
```

---

## 6. Indexing Standards

Indexes are not optional. Every table must follow these indexing rules.

### Mandatory indexes

```sql
-- 1. tenant_id — always indexed, used in every RLS policy
CREATE INDEX idx_{table}_tenant_id ON public.{table}(tenant_id);

-- 2. Foreign key columns — always indexed
CREATE INDEX idx_{table}_{fk_column} ON public.{table}({fk_column});

-- 3. Soft delete — always indexed on soft-deletable tables
CREATE INDEX idx_{table}_deleted_at ON public.{table}(deleted_at)
  WHERE deleted_at IS NULL; -- partial index, more efficient

-- 4. Timestamps — index created_at on high-volume tables
CREATE INDEX idx_{table}_created_at ON public.{table}(created_at);
```

### Composite indexes — for common query patterns

```sql
-- Tenant + soft delete (most common query pattern)
CREATE INDEX idx_{table}_tenant_active
  ON public.{table}(tenant_id)
  WHERE deleted_at IS NULL;

-- Tenant + sort (for paginated lists)
CREATE INDEX idx_{table}_tenant_created
  ON public.{table}(tenant_id, created_at DESC);
```

### Index naming convention

```
idx_{table_name}_{column_or_purpose}

-- Examples
idx_projects_tenant_id
idx_projects_created_by
idx_projects_deleted_at
idx_projects_tenant_active    -- composite / partial
idx_projects_tenant_created   -- composite
```

### Rules

- **Never skip indexing `tenant_id`** — RLS policies filter on this for every single query
- **Index all FK columns** — PostgreSQL does not auto-index foreign keys
- **Use partial indexes** for `deleted_at IS NULL` — smaller, faster than full column index
- **Don't over-index** — each index slows down writes. Only index columns used in WHERE, JOIN, or ORDER BY
- **Review with EXPLAIN ANALYZE** before deploying to production

---

## 7. Auto-updating `updated_at`

Never rely on the application layer to set `updated_at`. Use a trigger.

```sql
-- Generic function (create once, reuse everywhere)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to any table with one line
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.{table_name}
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

This is mandatory on every table that has an `updated_at` column — which is every table.

---

## 8. Foreign Key Conventions

- **Always enforce FK constraints at the database level** — never rely on the application layer
- **Always specify ON DELETE behavior** — never leave it as default

### ON DELETE rules

| Relationship              | ON DELETE  | Example                    |
| ------------------------- | ---------- | -------------------------- |
| Child owned by parent     | `CASCADE`  | `project_tasks → projects` |
| Reference to a user       | `SET NULL` | `created_by → auth.users`  |
| Reference to a tenant     | `CASCADE`  | `projects → tenants`       |
| Lookup / config reference | `RESTRICT` | `projects → categories`    |

```sql
-- ✅ Always explicit
tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,

-- ❌ Never implicit
tenant_id UUID REFERENCES public.tenants(id),
```

---

## 9. Migration Conventions

### File naming

```
{timestamp}_{action}_{subject}.sql

-- Timestamp format: YYYYMMDDHHMMSS
-- Action: create, add, remove, alter, drop, rename
-- Subject: the table or column being changed

-- Examples
20240315120000_create_projects_table.sql
20240315130000_add_soft_delete_to_projects.sql
20240315140000_create_audit_log_trigger.sql
20240316090000_add_index_projects_tenant_id.sql
```

### Rules

- **One concern per migration** — never combine unrelated changes
- **Never modify an existing migration** — always create a new one
- **Always include a rollback comment** — document how to undo the change
- **Test in staging first** — never run untested migrations directly in production
- **Include RLS policies in the same migration as the table** — never create a table without RLS

### Migration structure

```sql
-- Migration: 20240315120000_create_projects_table.sql
-- Description: Creates the projects table with standard columns, RLS, indexes
-- Rollback: DROP TABLE public.projects;

-- 1. Create table
CREATE TABLE public.projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at  TIMESTAMPTZ DEFAULT NULL
);

-- 2. Enable RLS immediately
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
CREATE POLICY "tenant_isolation_select" ON public.projects
  FOR SELECT USING (
    tenant_id = (SELECT private.get_active_tenant_id())
    AND deleted_at IS NULL
  );

CREATE POLICY "tenant_isolation_insert" ON public.projects
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT private.get_active_tenant_id())
  );

CREATE POLICY "tenant_isolation_update" ON public.projects
  FOR UPDATE USING (
    tenant_id = (SELECT private.get_active_tenant_id())
    AND deleted_at IS NULL
  );

-- 4. Indexes
CREATE INDEX idx_projects_tenant_id ON public.projects(tenant_id);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_projects_deleted_at ON public.projects(deleted_at)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_tenant_active ON public.projects(tenant_id)
  WHERE deleted_at IS NULL;

-- 5. updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Audit trigger
CREATE TRIGGER audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
```

This migration structure is the **template for every new table**. No exceptions.

---

## 10. Global / System Tables

Some tables are global by nature and do not have a `tenant_id`.

| Table                       | Reason                                                    |
| --------------------------- | --------------------------------------------------------- |
| `public.tenants`            | Is the tenant — can't reference itself                    |
| `public.profiles`           | Bridges auth.users — user exists before tenant assignment |
| `public.subscription_plans` | Platform-wide config                                      |
| `audit.audit_logs`          | Cross-tenant by design                                    |

These tables still follow all other conventions — standard columns, indexes, RLS, migrations — but their RLS policies are role-based rather than tenant-based.

```sql
-- Example: tenants table RLS
CREATE POLICY "superadmin_all" ON public.tenants
  FOR ALL USING ((SELECT private.get_user_role()) = 'superadmin');

CREATE POLICY "members_read_own" ON public.tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
  );
```

---

## Quick Reference Checklist

When creating any new table, verify:

- [ ] Table name is plural snake_case
- [ ] All columns are snake_case
- [ ] `id` is UUID with `gen_random_uuid()`
- [ ] `tenant_id` present (unless global table)
- [ ] `created_at`, `updated_at` present
- [ ] `created_by`, `updated_by` present
- [ ] `deleted_at` present if business-critical data
- [ ] RLS enabled immediately in same migration
- [ ] RLS policies cover SELECT, INSERT, UPDATE (and DELETE if needed)
- [ ] `idx_{table}_tenant_id` index created
- [ ] FK columns indexed
- [ ] Partial index on `deleted_at IS NULL` if soft-deletable
- [ ] `set_updated_at` trigger attached
- [ ] `audit.log_changes` trigger attached
- [ ] Migration file follows naming convention
- [ ] One concern per migration
