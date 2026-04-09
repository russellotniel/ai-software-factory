# RPC Standards

> Part of the AI Software Factory — Architecture OS
> This document defines when to use RPCs, how to write them, how to secure them,
> and how to name them. Every function written for a Supabase project must follow these standards.

---

## 1. RPC vs Direct Query — The Decision Rule

The most important standard. Never guess — apply this decision tree.

```
Is this operation touching a single table with simple filters?
├── YES → Use a direct query from the server
│         supabase.from('projects').select('*').eq('tenant_id', tenantId)
│
└── NO  → Use an RPC
          supabase.rpc('get_project_dashboard', { p_tenant_id: tenantId })
```

### Use a DIRECT QUERY when:

- Single table SELECT, INSERT, UPDATE, DELETE
- Simple filters — `WHERE id = ?`, `WHERE tenant_id = ?`, `WHERE status = ?`
- Standard CRUD that RLS already protects
- Called from a Next.js server component or server action
- No business logic beyond basic data retrieval or mutation

### Use an RPC when:

- Joining 2 or more tables
- Aggregations — `COUNT`, `SUM`, `AVG`, `GROUP BY`, window functions
- Business logic that spans multiple operations atomically
- Permission-sensitive writes — validate input + insert in one transaction
- Bulk operations — insert/update many rows at once
- Complex filtering or search across multiple tables
- Any operation requiring transaction guarantees
- Anything that would otherwise require multiple sequential round trips

### The rule in plain language:

> If you would need to chain multiple `.from()` calls or do post-processing
> in JavaScript to get the data shape you need — it belongs in an RPC.

---

## 2. Security Model

### Default: SECURITY INVOKER

All RPCs use `SECURITY INVOKER` by default. This means:

- The function runs with the **caller's permissions**
- RLS policies are still enforced
- The caller cannot do anything through the function they couldn't do directly
- Safe, predictable, no search_path vulnerabilities

```sql
-- ✅ Standard RPC — SECURITY INVOKER (default, can omit)
CREATE OR REPLACE FUNCTION public.get_project_summary(
  p_tenant_id UUID
)
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  -- RLS applies here — caller can only see their data
  RETURN QUERY ...;
END;
$$;
```

### Exception: SECURITY DEFINER

Only used for helper/utility functions that must operate outside RLS context.
**Never use SECURITY DEFINER on business logic RPCs.**

When used, ALWAYS pair with `SET search_path = ''` to prevent injection attacks.

**Critical:** SECURITY DEFINER functions must **never** be placed in the `public` schema. PostgREST exposes `public` as an API — any function there is callable by anyone via `supabase.rpc()`. SECURITY DEFINER helper functions belong in the `private` schema, which is not exposed via PostgREST.

```sql
-- ❌ Wrong — public schema is API-exposed; anyone can call via supabase.rpc()
CREATE OR REPLACE FUNCTION public.get_active_tenant_id() ...

-- ✅ Correct — private schema is NOT exposed via PostgREST
CREATE OR REPLACE FUNCTION private.get_active_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''   -- MANDATORY with SECURITY DEFINER
STABLE
AS $$
  SELECT active_tenant_id
  FROM public.profiles
  WHERE id = auth.uid()
$$;

-- Grant execute to authenticated role only
GRANT EXECUTE ON FUNCTION private.get_active_tenant_id() TO authenticated;
```

RLS policies that call these functions reference the `private` schema explicitly, and wrap in `(SELECT ...)` for Postgres query plan caching:

```sql
-- ✅ Correct — wraps in SELECT for caching, references private schema
CREATE POLICY "tenant_isolation" ON public.projects
  FOR SELECT USING (
    tenant_id = (SELECT private.get_active_tenant_id())
  );
```

### SECURITY DEFINER is allowed ONLY for:

| Function                 | Schema    | Reason                                                                    |
| ------------------------ | --------- | ------------------------------------------------------------------------- |
| `get_active_tenant_id()` | `private` | Reads profiles without RLS overhead; not API-callable                     |
| `get_user_role()`        | `private` | Same pattern                                                              |
| `set_updated_at()`       | `public`  | Trigger function — PostgreSQL requires trigger functions to be accessible |
| `audit.log_changes()`    | `audit`   | Audit trigger — needs cross-schema write access                           |

Everything else: `SECURITY INVOKER` in `public`.

---

## 3. Naming Conventions

### Pattern: `{verb}_{subject}_{qualifier?}`

```
verb       → what the function does
subject    → the primary entity involved
qualifier  → optional context (summary, by_status, with_members, etc.)
```

### Approved verbs by operation type

| Verb         | Use for                                |
| ------------ | -------------------------------------- |
| `get_`       | Read — returns data                    |
| `list_`      | Read — returns a collection            |
| `search_`    | Read — filtered/searched collection    |
| `create_`    | Write — insert with validation/logic   |
| `update_`    | Write — update with validation/logic   |
| `delete_`    | Write — soft or hard delete with logic |
| `calculate_` | Compute — aggregations, metrics        |
| `process_`   | Complex multi-step operation           |
| `validate_`  | Check only — no writes                 |

### Examples

```sql
-- ✅ Good names
get_project_summary          -- single project with aggregated data
list_projects_by_tenant      -- collection filtered by tenant
search_projects              -- filtered + searched collection
create_project_with_defaults -- insert with business logic
calculate_tenant_usage       -- aggregation / metrics
process_bulk_import          -- multi-step operation

-- ❌ Bad names
projectSummary               -- not snake_case
getData                      -- too generic
sp_get_projects              -- stored proc prefix (not our convention)
fn_project                   -- function prefix (not our convention)
getProjectsForDashboard      -- camelCase
```

---

## 4. Parameter Conventions

### Always prefix parameters with `p_`

This avoids collision with column names inside the function body — a common source of subtle bugs.

```sql
-- ✅ Correct
CREATE FUNCTION get_project_summary(
  p_tenant_id  UUID,
  p_project_id UUID
)

-- ❌ Wrong — 'tenant_id' collides with column names
CREATE FUNCTION get_project_summary(
  tenant_id  UUID,
  project_id UUID
)
```

### Always include `p_tenant_id` as the first parameter

Every RPC that touches tenant-scoped data must accept `tenant_id` explicitly and validate membership internally — never trust the caller to pass a valid tenant.

```sql
CREATE OR REPLACE FUNCTION public.get_project_summary(
  p_tenant_id  UUID,
  p_project_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  -- ALWAYS validate tenant membership first
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  -- Business logic here
  ...
END;
$$;
```

### Parameter naming for common types

```sql
p_tenant_id   UUID     -- always first for tenant-scoped functions
p_user_id     UUID     -- when operating on a specific user
p_[entity]_id UUID     -- FK references
p_search      TEXT     -- search/filter text
p_limit       INT      -- pagination limit
p_offset      INT      -- pagination offset
p_from_date   DATE     -- date range start
p_to_date     DATE     -- date range end
```

---

## 5. Return Type Standards

### Read functions → return `TABLE` or `SETOF`

Typed returns are strongly preferred over raw `JSON`. They enable TypeScript type inference via Supabase's generated types.

```sql
-- ✅ Typed TABLE return
CREATE OR REPLACE FUNCTION public.list_projects(
  p_tenant_id UUID
)
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  status      TEXT,
  task_count  BIGINT,
  created_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.status,
    COUNT(t.id)::BIGINT AS task_count,
    p.created_at
  FROM public.projects p
  LEFT JOIN public.tasks t ON t.project_id = p.id
  WHERE p.tenant_id = p_tenant_id
  AND p.deleted_at IS NULL
  GROUP BY p.id;
END;
$$;
```

### When to return JSON

Only when the return shape is genuinely dynamic or you need a nested structure that doesn't map cleanly to a flat TABLE:

```sql
-- ✅ JSON for complex nested / dynamic structures
RETURNS JSON
...
RETURN json_build_object(
  'project', row_to_json(project_record),
  'members', (SELECT json_agg(m) FROM ...),
  'stats', json_build_object('tasks', task_count, 'completed', completed_count)
);
```

### Write / mutation functions → return status

```sql
-- ✅ Mutation returns status object
RETURNS JSON
...
RETURN json_build_object(
  'success', true,
  'id', new_record.id,
  'message', 'Project created successfully'
);
```

### Volatility markers

Always declare the correct volatility — PostgreSQL uses this for query optimization:

```sql
STABLE    -- reads only, same result within a transaction (most SELECT RPCs)
VOLATILE  -- modifies data or result changes between calls (all mutation RPCs)
IMMUTABLE -- same result for same inputs always (pure calculations)
```

---

## 6. Error Handling

### Always use RAISE EXCEPTION with ERRCODE

Never return `null` or a success/failure flag for error states — raise a proper exception. The Next.js layer catches this from the Supabase client error response.

```sql
-- ✅ Standard error patterns
RAISE EXCEPTION 'Access denied'
  USING ERRCODE = '42501';          -- permission denied

RAISE EXCEPTION 'Record not found: %', p_project_id
  USING ERRCODE = 'P0002';          -- no data found

RAISE EXCEPTION 'Invalid input: %', 'name cannot be empty'
  USING ERRCODE = '22023';          -- invalid parameter value

RAISE EXCEPTION 'Conflict: %', 'slug already exists'
  USING ERRCODE = '23505';          -- unique violation
```

### Standard ERRCODE reference

| Situation                    | ERRCODE | Description              |
| ---------------------------- | ------- | ------------------------ |
| Access denied / not a member | `42501` | insufficient_privilege   |
| Record not found             | `P0002` | no_data_found            |
| Invalid input                | `22023` | invalid_parameter_value  |
| Duplicate / conflict         | `23505` | unique_violation         |
| Business rule violation      | `P0001` | raise_exception (custom) |

### Catching in Next.js

```typescript
const { data, error } = await supabase.rpc("get_project_summary", {
  p_tenant_id: tenantId,
  p_project_id: projectId
});

if (error) {
  // error.code maps to ERRCODE
  // error.message contains the RAISE EXCEPTION message
  if (error.code === "42501") {
    return { error: "You do not have access to this resource" };
  }
  // handle other codes
}
```

---

## 7. Function Template

Every new RPC starts from this template. Fill in the blanks.

```sql
-- ============================================================
-- Function: public.{function_name}
-- Description: {what this function does}
-- Type: {READ | WRITE | CALCULATION}
-- Returns: {description of return shape}
-- ============================================================
CREATE OR REPLACE FUNCTION public.{function_name}(
  p_tenant_id   UUID,
  -- add other parameters here
)
RETURNS {return_type}
LANGUAGE plpgsql
SECURITY INVOKER   -- change to SECURITY DEFINER only if justified (see standards)
{STABLE|VOLATILE}  -- STABLE for reads, VOLATILE for writes
AS $$
DECLARE
  -- declare variables here if needed
BEGIN
  -- 1. Validate tenant membership
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  -- 2. Validate inputs
  -- IF p_some_param IS NULL THEN
  --   RAISE EXCEPTION 'Invalid input: param cannot be null' USING ERRCODE = '22023';
  -- END IF;

  -- 3. Business logic
  RETURN QUERY
  SELECT ...
  FROM ...
  WHERE tenant_id = p_tenant_id;

END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.{function_name} TO authenticated;
```

---

## 8. Function Organization in Migrations

Each RPC lives in its own migration file:

```
migrations/
  20240315120000_create_projects_table.sql
  20240315130000_fn_get_project_summary.sql      ← one function per file
  20240315140000_fn_list_projects_by_tenant.sql
  20240315150000_fn_create_project_with_tasks.sql
```

Migration file naming for functions:

```
{timestamp}_fn_{function_name}.sql
```

---

## 9. Quick Reference Decision Table

| Scenario                                                 | Approach                                            |
| -------------------------------------------------------- | --------------------------------------------------- |
| Get a single project by ID                               | Direct query                                        |
| List all projects for a tenant                           | Direct query                                        |
| Get project with member count + task stats               | RPC                                                 |
| Insert a new project                                     | Direct query (simple) or RPC (if validation needed) |
| Insert project + create default tasks in one transaction | RPC                                                 |
| Search projects by name across multiple fields           | RPC                                                 |
| Dashboard summary with multiple aggregations             | RPC                                                 |
| Bulk update project statuses                             | RPC                                                 |
| Delete a project (soft)                                  | Direct query                                        |
| Delete project + cascade archive its tasks               | RPC                                                 |
| Calculate tenant usage metrics                           | RPC                                                 |

---

## 10. Quick Reference Checklist

When writing any new RPC, verify:

- [ ] Follows naming convention: `{verb}_{subject}_{qualifier?}`
- [ ] Parameters prefixed with `p_`
- [ ] `p_tenant_id` is first parameter (if tenant-scoped)
- [ ] Tenant membership validated at the start
- [ ] Uses `SECURITY INVOKER` (unless justified exception)
- [ ] `SECURITY DEFINER` functions have `SET search_path = ''`
- [ ] Correct volatility declared (`STABLE` or `VOLATILE`)
- [ ] Returns typed `TABLE` (preferred) or `JSON` (if dynamic)
- [ ] Errors raised with `RAISE EXCEPTION` and proper `ERRCODE`
- [ ] `GRANT EXECUTE TO authenticated` included
- [ ] Lives in its own migration file: `{timestamp}_fn_{name}.sql`
- [ ] Justified in decision table — should this be an RPC or direct query?
