# /architecture:review

Review existing schema and RPC code against AI Software Factory standards.

**Preconditions:**
- `.claude/project-config.json` must exist (run `/foundation:init`)

Read before starting:

- `.claude/project-config.json` — to determine multi-tenant vs single-tenant
- `.claude/docs/architecture-os/schema-conventions.md`
- `.claude/docs/architecture-os/rpc-standards.md`
- `.claude/docs/architecture-os/audit-trail.md`
- `.claude/docs/foundation/compliance-standards.md`

---

## Process

Ask: "What would you like to review?"

- A specific migration file
- All migrations in `supabase/migrations/`
- A specific RPC function
- All functions in `supabase/functions/`

For each file, check:

### Schema checks

- [ ] All tables have: id (UUID), created_at, updated_at, created_by, updated_by
- [ ] **When multi-tenant:** all business tables have tenant_id
- [ ] RLS enabled on every table in the same migration that creates it
- [ ] **When multi-tenant:** RLS policies use `(SELECT private.get_active_tenant_id())` pattern
- [ ] **When single-tenant:** RLS policies use `auth.uid()` for access control
- [ ] No SECURITY DEFINER functions in the `public` schema
- [ ] Audit trigger on all business-critical tables
- [ ] Table names are plural snake_case
- [ ] Foreign keys have corresponding indexes

### RPC checks

- [ ] SECURITY INVOKER by default
- [ ] SECURITY DEFINER only in `private` schema with `SET search_path = ''`
- [ ] **When multi-tenant:** tenant membership validated at start of every RPC
- [ ] **When single-tenant:** auth.uid() validated at start of every RPC
- [ ] No raw string interpolation in dynamic SQL
- [ ] Consistent return shapes

### Report format

```
❌ [table/function name]
   Issue: [what is wrong]
   Standard: [which doc and section]
   Fix: [exact SQL to resolve it]

✅ [table/function name] — [brief confirmation]
```

End with a summary count. Offer to generate fix migrations for any issues.

---

## ✅ What's Next

Tell the user:

"Review complete. Fix any issues found, then return to whatever you were working on.

- **If you were in the middle of a feature:** continue with `/implementation:new-feature`
- **If you ran this as a standalone audit:** you're done"

```
COMMAND_COMPLETE: architecture:review
STATUS: success
NEXT_COMMAND: /implementation:new-feature (if continuing a feature) OR back to current task
```
