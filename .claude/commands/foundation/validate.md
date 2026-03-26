# /foundation:validate

Check project health — verify that all expected files exist, config is valid,
and the command chain is in a consistent state.

This command is read-only — it does not modify any files.

**Preconditions:**
- `.claude/project-config.json` must exist (run `/foundation:init`)

---

## Step 1 — Read Config

Read `.claude/project-config.json`. Validate against `.claude/project-config.schema.json`:

- All required fields present
- `schemaVersion` matches expected version
- `status` is a valid value
- `authModel` is "supabase-auth" or "keycloak"

---

## Step 2 — Check Foundation Files

Verify these files exist and are non-empty:

| File | Required When | Created By |
|------|--------------|------------|
| `.claude/project-config.json` | Always | `/foundation:init` |
| `.claude/docs/foundation/product-mission.md` | Always | `/foundation:init` (stub) → `/foundation:discover` (completed) |
| `.claude/docs/project-state.md` | After planning | `/foundation:plan` |

Report status for each: ✅ exists | ⚠️ stub only | ❌ missing

---

## Step 3 — Check Baseline Generated Files

Based on `project-config.json`, verify init generated the expected files:

### Always expected:
- [ ] `src/app/(auth)/callback/route.ts`
- [ ] `src/lib/auth/server.ts`
- [ ] `supabase/migrations/` has at least one migration file

### When `authModel: "supabase-auth"`:
- [ ] `src/app/(auth)/login/page.tsx`
- [ ] `src/app/(auth)/signup/page.tsx`

### When `authModel: "keycloak"`:
- [ ] `src/app/(auth)/login/page.tsx`
- [ ] No signup page expected

### When `multiTenant: true`:
- [ ] `src/app/(app)/onboarding/` exists
- [ ] Baseline migration includes `tenants`, `tenant_members` tables

### When `multiTenant: false`:
- [ ] Baseline migration includes `profiles` table (without `active_tenant_id`)

---

## Step 4 — Check Feature Files

If `project-state.md` exists with features marked ✅ Done:

For each completed feature, verify:
- [ ] Spec exists: `.claude/docs/specs/{feature-name}.md`
- [ ] Migration exists: `supabase/migrations/*_{feature-name}.sql`
- [ ] Feature code exists: `src/features/{domain}/`
- [ ] Tests exist alongside feature code

---

## Step 5 — Check Standards Consistency

- [ ] `CLAUDE.md` references `project-config.json` in the Project Config section
- [ ] No hardcoded multi-tenancy assumptions in single-tenant projects
- [ ] No hardcoded single-tenant assumptions in multi-tenant projects

---

## Step 6 — Report

Display results:

```
Project Health: {projectName}
Config: ✅ valid | ❌ {issue}
Status: {project-config status}

Foundation:
  ✅ project-config.json
  ✅ product-mission.md (completed)
  ✅ project-state.md (3 features planned, 1 done)

Baseline:
  ✅ Auth pages (supabase-auth)
  ✅ Auth utility (single-tenant)
  ✅ Baseline migration
  ✅ Dashboard layout

Features:
  ✅ Projects — spec, migration, code, tests
  ⚠️ Tasks — spec exists, no migration yet
  🔲 Dashboard — not started

Issues found: {count}
  ❌ {description of each issue}
```

---

## ✅ Output

```
COMMAND_COMPLETE: foundation:validate
STATUS: success | warning | error
ISSUES: {count}
NEXT_COMMAND: {suggested fix command if issues found}
```
