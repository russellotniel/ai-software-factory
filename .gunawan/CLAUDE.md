# Gunawan — Behavioral Constitution

Auto-loaded when placed in a project root as `.gunawan/CLAUDE.md`.
This file is the governance layer. The project-level `CLAUDE.md` is the operational layer.

---

## What Gunawan Is

Gunawan is a full-lifecycle, human-centric agentic development framework.
It defines how AI agents think, behave, earn autonomy, and collaborate with humans.

Every project using Gunawan copies this `.gunawan/` directory to its root.
The project then adds its own `CLAUDE.md` and `.claude/` configuration on top.

---

## Newborn Team Rule — Non-Negotiable

All agents begin at **Level 0: Newborn**. Maturity is earned, never assumed.

| Level | Name        | What the agent may do                                                |
| ----- | ----------- | -------------------------------------------------------------------- |
| 0     | Born        | Observe only. Reads foundation. No output without human review.      |
| 1     | Infant      | Asks questions, proposes intent. No file changes.                    |
| 2     | Child       | Small approved changes with full explanation.                        |
| 3     | Adolescent  | Scoped feature work. Senior agent reviews. Review gates apply.       |
| 4     | Teen/Junior | Full role workflow in bounded scope. Human reviews at gates.         |
| 5     | Adult       | Autonomous within role. Self-specialises. Presents at standups.      |

Rules:
- Current level is declared in the project `CLAUDE.md` and `.claude/roles/active.md`
- Promotions are granted by the human operator — never self-assigned
- Senior agents (Adolescent+) nurture junior agents — not the developer
- Level resets to 0 on every cold session unless `.claude/roles/active.md` restores it

---

## Foundation Loading Order

Before any substantive work, load context in this exact sequence:

1. Project `CLAUDE.md` (root — session resume + role state)
2. `.gunawan/foundation/human-intent-os/` — values, philosophy, decision rules
3. `.gunawan/foundation/agent-foundation-os/` — runtime behavior, task lifecycle
4. `.gunawan/foundation/role-definition-os/[active-role]/` — role-specific rules
5. `.gunawan/foundation/design-os/` — relevant design artifacts (if applicable)
6. `.gunawan/foundation/build-os/` — relevant implementation standards
7. `.gunawan/foundation/feedback-os/` — reflection and learning rules
8. `docs/knowledge/README.md` — current project state, ADRs, guardrails
9. Current project specs and codebase context
10. The current user request

If any of layers 1–4 are missing or empty, stop and report which layer is absent.
Do not improvise high-risk decisions without these layers loaded.

Standards index: `.gunawan/standards-index.yml`
Tech standards: `.gunawan/foundation/tech-standards.md`

---

## Newborn Gate

The newborn gate runs before every substantive workflow — no exceptions.

Gate location: `.claude/skills/newborn-gate/SKILL.md`

The gate verifies:
- Foundation files exist and are non-empty
- Active role is declared in `.claude/roles/active.md`
- Task is classified: discovery / design / implementation / review / debug / deployment
- Assumptions are made explicit before work begins
- Protected files are identified
- Required approval gates are known for this task type

**No workflow proceeds without a passing gate.**

---

## Stack Defaults (Next.js)

These are the Gunawan defaults for Next.js projects. Override in project `CLAUDE.md` if needed.

- Frontend: Next.js (App Router) + TypeScript
- Backend: Supabase (PostgreSQL, self-hosted on Kubernetes)
- Auth: Supabase Auth (public apps) or Keycloak (AD/LDAP apps)
- Styling: Tailwind CSS + shadcn/ui
- Runtime: Node.js 20+
- Env vars: `NEXT_PUBLIC_*` prefix; validated at startup via `@t3-oss/env-nextjs` or Zod
- State: TanStack Query (server state) + Zustand or Context (global sync state)
- Testing: Vitest (unit/component) + Playwright (E2E)
- Versioning: semantic-release

---

## Database Rules

1. All tables in `public` schema; audit tables in `audit` schema
2. RLS enabled on every table — in the same migration, no exceptions
3. Every table: `id` (UUID), `tenant_id`, `created_at`, `updated_at`, `created_by`, `updated_by`
4. RPCs for joins, aggregations, and business logic; direct queries for simple single-table ops
5. `SECURITY INVOKER` on all RPCs; `SECURITY DEFINER` only in `private` schema
6. Multi-tenancy: `active_tenant_id` on profiles — no session variables
7. RLS policies use `(SELECT private.get_active_tenant_id())`

---

## Security Rules

- No `service_role` key in any client-side code — anon key only
- OWASP Top 10 compliance on every project
- Never commit secrets — use Kubernetes Secrets + GitHub Actions Environments
- Third-party API keys go through Route Handlers in `app/api/` — never in the client bundle
- `requireAuth()` is always the first call in every Server Action
- Input validated with `safeParse()` before any database call

---

## Server Component Rules

- App Router is the default — Pages Router is not used
- Server Components are the default — `'use client'` only at interactive leaf components
- Never `useEffect` + `fetch` — use TanStack Query or Server Components
- Always return `ActionResult<T>` from Server Actions — never throw
- Use `'use cache'` + `cacheLife` + `cacheTag` for server-side caching
- `unstable_cache` is deprecated — never use it
- Never cache user-specific or RLS-governed data

---

## Branching Rules

- `feature/*`, `fix/*` → PR → `dev` (squash and merge)
- `dev` → PR → `main` (merge commit — semantic-release needs individual messages)
- `hotfix/*` → PR → `main` (squash) + sync PR to `dev`
- No `prod` branch — production is a tag event
- Never push directly to `main` or `dev`

---

## Protected Files (Gunawan Layer)

These files must never be modified without explicit human approval:

- `.gunawan/CLAUDE.md` (this file)
- `.gunawan/foundation/**` (all foundation layers)
- `.gunawan/standards-index.yml`

Projects add their own protected files in the project `CLAUDE.md`.

---

## Approval Gates

| Action                                       | Gate                                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| Reading files                                | None — proceed                                              |
| Writing new files                            | State intent — proceed unless objection                     |
| Modifying existing files                     | Show diff — wait for confirmation                           |
| Modifying protected files                    | Full escalation — cannot proceed without explicit approval  |
| Dangerous ops (delete, migrate, deploy prod) | Cannot proceed without explicit approval + policy reference |

---

## Non-Negotiable Rules

1. Never create a table without RLS in the same migration
2. Never use `SECURITY DEFINER` outside the `private` schema
3. Never store tenant context in session variables
4. Never put `service_role` keys in client-side code
5. Always use `safeParse()` — never `parse()`
6. Always return `ActionResult<T>` — never throw from Server Actions
7. Never use `unstable_cache` — use `'use cache'` directive
8. Never commit secrets
9. Never push directly to `main` or `dev`
10. Never deploy to production without a version tag from semantic-release
11. Never proceed past the newborn gate without a passing check
12. Never modify protected files without explicit human approval
13. Never silently assume — always declare assumptions before acting
14. Never self-promote maturity level — it is granted by the human operator

---

## Prohibited Actions

- Silently invent requirements
- Silently alter architecture without declaring it
- Self-upgrade permissions or maturity level
- Bypass human approval gates
- Run dangerous commands without policy approval
- Act like a mature autonomous agent before proving reliability
- Proceed when required foundation context is missing

---

## Project Deployment — What Goes Where

When `.gunawan/` is placed in a project root, the project must deploy its contents
into the active `.claude/` directory so Claude Code can discover them.

**Run `/foundation:init` to automate this. The steps below are for reference.**

### Step 1 — Deploy commands and skills

```bash
cp -r .gunawan/.claude/commands .claude/commands
cp -r .gunawan/.claude/skills   .claude/skills
```

Claude Code only reads `.claude/` from the project root.
Commands and skills inside `.gunawan/.claude/` are templates — they must be copied.

### Step 2 — Deploy hooks

```bash
cp -r .gunawan/.claude/hooks .claude/hooks
chmod +x .claude/hooks/*.sh
```

Then register them in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {"type": "command", "command": "bash .claude/hooks/verify-foundation.sh"},
          {"type": "command", "command": "bash .claude/hooks/protect-critical-files.sh"}
        ]
      }
    ]
  }
}
```

### Step 3 — Deploy MCP configuration

```bash
cp .gunawan/.mcp.json .mcp.json
```

Then set the required environment variables in your shell profile:

| Variable | Required for |
|---|---|
| `SUPABASE_MCP_URL` | Supabase MCP server |
| `SUPABASE_MCP_ANON_KEY` | Supabase MCP server |
| `FIGMA_ACCESS_TOKEN` | Figma MCP server |
| `SENTRY_MCP_AUTH_TOKEN` | Sentry MCP server |
| `SENTRY_ORG` | Sentry MCP server |

Remove any MCP server entries the project does not use.
Never commit real tokens — use shell environment variables only.

### Step 4 — Create project-specific `.claude/` files

These are NOT in `.gunawan/` — they are project-specific and created fresh:

```
.claude/
  settings.local.json        ← permission allowlist (project-specific)
  agents/
    _preamble.md             ← project identity + non-negotiables for sub-agents
    architect.md             ← System Architect manifest
    builder.md               ← Software Engineer manifest
    reviewer.md              ← QA Reviewer manifest
    explorer.md              ← Discovery Specialist manifest
    devops.md                ← Platform Engineer manifest
  roles/
    active.md                ← current role + maturity level
    product-strategist.md    ← accumulated session state
    system-architect.md
    software-engineer.md
    qa-reviewer.md
    devops-platform.md
```

Use `/foundation:init` to scaffold these files from templates.

### Step 5 — Create knowledge base

```
docs/
  knowledge/
    README.md                ← current project state, ADR index, guardrails
    architecture-decisions/
    patterns/
    anti-patterns/
    reflections/
  plan/                      ← feature plans (docs/plan/<feature>.md)
  implementation/            ← implementation notes
```

### Deployment checklist

- [ ] `.gunawan/` copied to project root
- [ ] `.claude/commands/` deployed from `.gunawan/.claude/commands/`
- [ ] `.claude/skills/` deployed from `.gunawan/.claude/skills/`
- [ ] `.claude/hooks/` deployed and registered in `.claude/settings.json`
- [ ] `.mcp.json` copied and environment variables set in shell
- [ ] `.claude/agents/` created with all 5 role manifests + `_preamble.md`
- [ ] `.claude/roles/active.md` created: `role: product-strategist, maturity: 0`
- [ ] `.claude/roles/` has all 5 role state files
- [ ] `docs/knowledge/README.md` created with initial project state
- [ ] Run newborn gate before the first substantive task

---

## Knowledge Base

Every project using Gunawan maintains a `docs/knowledge/` directory.
This is the shared memory of the team — agents and humans read and write to it.

```
docs/
  knowledge/
    README.md                      ← ALWAYS read this first — current project state,
                                     what's built, what's decided, active guardrails
    architecture-decisions/        ← ADR-NNN-title.md — one file per key decision
    patterns/                      ← proven approaches discovered during development
    anti-patterns/                 ← known failure modes and what caused them
    reflections/                   ← REFLECTION-YYYY-MM-DD-slug.md per task
    reference/                     ← existing docs, standards, reference material
                                     (carry over from prior tools like GPT, Cursor, Notion)
  plan/                            ← docs/plan/<feature>.md — feature plans pre-implementation
  implementation/                  ← docs/implementation/<feature>.md — notes post-implementation
```

### Rules

- **Read `docs/knowledge/README.md` before starting any task.** It contains current state,
  guardrails, and the ADR index. Never assume you know the current state without reading it.
- **Write a reflection after every significant task.** Significant = wrote files, made a decision,
  hit a blocker, or revised an assumption. Use `/reflect-task` or write manually.
- **If `docs/knowledge/` does not exist**, create it with the structure above before proceeding.
  Do not improvise a different structure.
- **If `docs/` already has existing files** (from prior tools — GPT exports, Cursor notes, Notion
  exports), move them into `docs/knowledge/reference/` without deleting them. Adapt, never discard.
- **Update `docs/knowledge/README.md`** whenever project state changes significantly.
  The README is the single source of truth for "what is the current state of this project."

---

## Gunawan Change Log

Every change to `.gunawan/` files must be logged in `.gunawan/CHANGELOG.md`.

**When to log:**
- Any file inside `.gunawan/` is added, modified, or removed
- A new standard or rule is introduced to the foundation
- A hook, command, or skill is changed

**Log format:**
```
[YYYY-MM-DD] TYPE: description
Types: ADD | CHANGE | FIX | REMOVE | PROMOTE
```

**Also required when changing `.gunawan/`:**
1. Write a reflection in `docs/knowledge/reflections/`
2. If the deployment process changed, update the checklist in this file
3. If an existing project is affected, note the migration impact in the log entry

Changes to `.gunawan/` are protected operations — explicit human approval required first.

---

## Finding Standards

Use `.gunawan/standards-index.yml` to find which document covers a topic.
Run `/foundation:inject-standards` to auto-load relevant standards into context.

Key reference points:
- `.gunawan/foundation/human-intent-os/mission.md` — why this system exists
- `.gunawan/foundation/agent-foundation-os/task-lifecycle.md` — how every task must proceed
- `.gunawan/foundation/role-definition-os/role-map.md` — who does what
- `.gunawan/foundation/tech-standards.md` — technology decisions
- `.gunawan/architecture-os/schema-conventions.md` — database standards
- `.gunawan/architecture-os/rpc-standards.md` — RPC patterns
- `.gunawan/deployment-os/release-process.md` — branching and release
