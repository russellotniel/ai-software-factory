# Framework Integration Test Checklist

> Run before each release of the template repo.
> Automated structural tests: `npm run validate`
> This checklist covers what automation cannot — actual command execution behavior.

---

## Template Smoke Test

- [ ] Fresh clone (or `git clean -fdx` + `npm install`)
- [ ] `npm run build` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes (includes framework-validate tests)
- [ ] `npm run validate` passes (framework structure only)

---

## Command Chain: Multi-tenant + Supabase Auth

- [ ] `/foundation:init` with `multiTenant=true`, `authModel=supabase-auth`
- [ ] Verify: `.claude/project-config.json` written with correct values
- [ ] Verify: baseline migration includes `tenants`, `tenant_members`, `profiles` (with `active_tenant_id`)
- [ ] Verify: `src/app/(auth)/login/page.tsx` and `src/app/(auth)/signup/page.tsx` generated
- [ ] Verify: `src/lib/auth/server.ts` returns `tenantId` in auth context
- [ ] Verify: onboarding pages exist in `src/app/(app)/onboarding/`
- [ ] `/foundation:discover` completes, `product-mission.md` populated
- [ ] `/foundation:plan` creates `project-state.md` with backlog
- [ ] `/foundation:status` reads state correctly, suggests next feature
- [ ] `/foundation:validate` reports all green

---

## Command Chain: Single-tenant + Keycloak

- [ ] `/foundation:init` with `multiTenant=false`, `authModel=keycloak`
- [ ] Verify: baseline migration has `profiles` (without `active_tenant_id`), no `tenants` table
- [ ] Verify: `src/app/(auth)/login/page.tsx` uses Keycloak redirect (no form)
- [ ] Verify: no `src/app/(auth)/signup/` page exists
- [ ] Verify: `src/lib/auth/server.ts` does NOT return `tenantId`
- [ ] Verify: no onboarding pages
- [ ] `/foundation:validate` reports all green

---

## Cross-Config Consistency Checks

- [ ] After multi-tenant init: `grep tenant_id supabase/migrations/*.sql` — present
- [ ] After single-tenant init: `grep tenant_id supabase/migrations/*.sql` — absent
- [ ] After keycloak init: no signup page exists
- [ ] After supabase-auth init: signup page exists
- [ ] After multi-tenant init: `grep get_active_tenant_id supabase/migrations/*.sql` — present
- [ ] After single-tenant init: `grep get_active_tenant_id supabase/migrations/*.sql` — absent

---

## Full Feature Workflow (pick one config, walk through entire chain)

- [ ] `/foundation:status` — identifies next feature
- [ ] `/foundation:shape-spec` — creates spec, updates project-state.md backlog
- [ ] `/architecture:new-feature` — creates migration, updates schema snapshot in project-state.md
- [ ] `/implementation:new-feature` — scaffolds code, marks feature Done in project-state.md
- [ ] `/qa:new-tests` — generates test files
- [ ] `/qa:fix` — runs tests, fixes issues, all green
- [ ] Verify: `project-state.md` accurately reflects completed feature

---

## Command Output Markers

- [ ] Spot-check 3 commands: each ends with `COMMAND_COMPLETE:` block
- [ ] `COMMAND_COMPLETE` ID matches the command that was run
- [ ] `NEXT_COMMAND` suggests an appropriate follow-up
