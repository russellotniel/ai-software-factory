# /architecture:new-feature

Guide through designing a new feature at the architecture level.
Output: migration file, optional RPC functions, and an API contract entry.

Read before starting:

- `architecture-os/schema-conventions.md`
- `architecture-os/rpc-standards.md`
- `architecture-os/api-contracts.md`
- `architecture-os/audit-trail.md`

---

## Step 1 — Feature Context

Ask:

- What is the feature name? (e.g. "project invitations")
- Describe it in one or two sentences.
- What tables will this feature need?
- Does any existing table need new columns?
- Does this involve multi-tenancy? (almost always yes — confirm)
- Does this feature need audit logging?

---

## Step 2 — Schema Design

For each new table, apply schema-conventions.md:

- Name: plural snake_case
- Required columns: id (UUID), tenant_id, created_at, updated_at, created_by, updated_by
- Appropriate indexes (foreign keys, tenant_id + status patterns)
- RLS enabled in the same migration — never as a separate step

For column additions to existing tables, confirm:

- Backward-compatible? Adding columns is safe; removing is not.
- Default value needed for existing rows?

Generate the migration file using the template from schema-conventions.md.
Migration filename: `YYYYMMDDHHMMSS_{feature_name}.sql`
Ask for confirmation before finalising.

---

## Step 3 — RPC vs Direct Query

Apply the decision rule from rpc-standards.md:

- Single-table, simple filter → direct query, no RPC
- Joins, aggregations, business logic, cross-table writes → RPC

If RPC is needed:

- Walk through the function signature
- Confirm SECURITY INVOKER (default) vs SECURITY DEFINER (rare, private schema only)
- Generate the function

---

## Step 4 — API Contract

Does this feature expose a Server Action or Route Handler?
If yes, add an entry to `architecture-os/api-contracts.md`:

- Name
- Input schema (Zod)
- Success response shape
- Error cases
- Auth requirement

---

## Step 5 — Output

Show:

1. The migration SQL (full content)
2. Any RPC function SQL
3. The API contract addition

Ask: "Should I write these files to the repo?"

On confirmation:

- Write migration to `supabase/migrations/{timestamp}_{name}.sql`
- Append to `architecture-os/api-contracts.md`

---

## ✅ What's Next

Tell the user:

"Migration generated. Run `/implementation:new-feature` to scaffold the Server Action, Zod schema, and component for this feature."

```
Next command: /implementation:new-feature
```
