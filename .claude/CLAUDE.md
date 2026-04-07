# AI Software Factory — Claude Code Context

Auto-loaded at the start of every Claude Code session.

---

## What This Is

AI Software Factory — a full-lifecycle development framework for Next.js 16 + Supabase.
Every standard, pattern, and decision lives in this repository.
Every command enforces those standards.

---

## Core Standards (Always Apply)

### Stack

- Frontend: Next.js 16 (App Router) + TypeScript
- Backend: Supabase (PostgreSQL, self-hosted on Kubernetes)
- Auth: Supabase Auth (public apps) or Keycloak (AD/LDAP apps)
- Styling: Tailwind CSS 4.x + Shadcn/ui
- Runtime: Node.js 20.9+
- Runtime env: next-runtime-env (build-once, deploy-anywhere)

### Project Config

- Read `.claude/project-config.json` for this project's architectural choices
- Multi-tenancy, auth model, and regulated status are set during `/foundation:init`
- All commands and standards adapt based on these choices

### Database

- All tables in `public` schema (audit tables in `audit` schema)
- RLS enabled on every table — no exceptions, in the same migration
- Every table: id (UUID), created_at, updated_at, created_by, updated_by
- **When multi-tenant:** add tenant_id to every business table
- RPCs for joins/aggregations/business logic; direct queries for simple single-table ops
- SECURITY INVOKER on all RPCs; SECURITY DEFINER only in `private` schema

### Security

- No service_role keys in client code
- OWASP Top 10 compliance on every project
- Never commit secrets — Kubernetes Secrets + GitHub Actions Environments

### Governance

- **Feature maturity pipeline:** `spec → architecture → implementation → tested → reviewed → shipped` — tracked in `project-state.md` with timestamps
- **Traceability:** every generated file includes `// @spec: {feature-name}` linking back to its spec. `/foundation:validate` checks for missing links
- **Risk zones:** code classified as Critical (Zone 1), Standard (Zone 2), or Presentational (Zone 3) via `riskZones` in `project-config.json`. Test strategies and review depth scale with zone
- **Governance gates:** `/deployment:release` runs 5 automated checks (spec coverage, test coverage, review status, migration security, Zone 1 coverage) before the manual pre-release checklist. Advisory by default, blocking when `regulated: true`

### Multi-Tenancy (when enabled)

- Organisation-based; tenant_id on every business table
- active_tenant_id on profiles — no session variables
- RLS policies use `(SELECT private.get_active_tenant_id())`
- When multi-tenancy is disabled: use role-based RLS with `auth.uid()` instead

### Implementation

- `requireAuth()` is always the first call in every Server Action
- Input validated with `safeParse()` before any database call
- Always return `ActionResult<T>` — never throw from Server Actions
- `'use client'` pushed to leaf components only

### Caching

- `'use cache'` + `cacheLife` + `cacheTag` for server-side caching
- `unstable_cache` is deprecated — never use it
- Never cache user-specific or RLS-governed data

### Branching

- `feature/*`, `fix/*` → PR → `dev` (squash and merge)
- `dev` → PR → `main` (merge commit — semantic-release needs individual messages)
- `hotfix/*` → PR → `main` (squash) + sync PR to `dev`
- No `prod` branch — production is a tag event

---

## Finding the Right Standards

Use `.claude/docs/standards-index.yml` to find which document covers a topic.
Or run `/foundation:inject-standards` to auto-load relevant standards
for what you're working on.

Key documents:

- `.claude/docs/foundation/product-mission.md` — what this project is, who it's for
- `.claude/docs/foundation/tech-standards.md` — technology decisions
- `.claude/docs/foundation/auth-model.md` — auth path for this project
- `.claude/docs/foundation/mcp-setup.md` — MCP server configuration and usage
- `.claude/docs/architecture-os/schema-conventions.md` — database standards
- `.claude/docs/architecture-os/rpc-standards.md` — RPC patterns
- `.claude/docs/deployment-os/release-process.md` — branching and release
- `.claude/docs/design-os/design-system.md` — visual design tokens
- `.claude/docs/design-os/screens/` — per-feature screen specs

---

## Development Workflow

```
── Setup (run once per project) ─────────────────────────
/foundation:init        → configure project, generate auth + migration + dashboard
/foundation:discover    → document product: users, use cases, standards
/foundation:plan        → plan all features, create backlog in project-state.md
/design:import          → import Figma or mockup (optional)
/design:system          → document design tokens (optional)

── Per feature (one session each) ──────────────────────
/foundation:status      → see what's next in the backlog
/foundation:shape-spec  → spec the feature
/architecture:new-feature → schema migration + RPC + API contract
/implementation:new-feature → Server Action + Zod schema + component
/qa:new-tests           → unit + component + E2E test scaffold
/qa:fix                 → run tests, fix failures, re-run until green

── Shipping ─────────────────────────────────────────────
/deployment:k8s-config  → generate Kubernetes manifests for this project
/deployment:release     → pre-release checklist + production deploy gate
```

For detailed step-by-step workflows (new feature, bug fix, deployment),
see `.claude/docs/workflows.md`.

Quick reference: `/foundation:status` → see what's next

Start every new project with:

```
/foundation:init
```

---

## All Commands

| Command                        | Purpose                                                               |
| ------------------------------ | --------------------------------------------------------------------- |
| `/foundation:init`             | Configure project — generate auth, migration, dashboard based on choices |
| `/foundation:discover`         | Document product — users, use cases, standards confirmation           |
| `/foundation:plan`             | Plan all features, create backlog in project-state.md                 |
| `/foundation:status`           | Show project state, suggest next feature to build                     |
| `/foundation:shape-spec`       | Spec a feature — acceptance criteria, data shape, UI ref              |
| `/foundation:inject-standards` | Load relevant standards for current task                              |
| `/foundation:validate`         | Check project health — verify files, config, consistency              |
| `/design:import`               | Import Figma or image mockup into .claude/docs/design-os/screens/     |
| `/design:system`               | Document or update the design system tokens                           |
| `/architecture:new-feature`    | Schema migration, RPC, API contract                                   |
| `/architecture:review`         | Audit schema and RPC against standards                                |
| `/implementation:new-feature`  | Scaffold Server Action + Zod schema + component                       |
| `/implementation:review`       | Audit implementation code against standards                           |
| `/data-fetching:review`        | Audit caching and server/client patterns                              |
| `/qa:new-tests`                | Generate unit, component, and E2E test scaffolding                    |
| `/qa:fix`                      | Run tests → fix failures → re-run until green                         |
| `/deployment:k8s-config`       | Generate Kubernetes manifests sized for this project                  |
| `/deployment:release`          | Pre-release checklist and production deploy walkthrough               |

---

## Non-Negotiable Rules

1. Never create a table without RLS in the same migration
2. Never use SECURITY DEFINER outside the `private` schema
3. Never store tenant context in session variables (multi-tenant projects only)
4. Never put service_role keys in client-side code
5. Always use `safeParse()` — never `parse()`
6. Always return `ActionResult<T>` — never throw from Server Actions
7. Never use `unstable_cache` (use `'use cache'` directive)
8. Never commit secrets
9. Never push directly to `main` or `dev`
10. Never deploy to production without a version tag from semantic-release
