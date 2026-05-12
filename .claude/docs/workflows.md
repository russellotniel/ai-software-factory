# Workflows Guide

> Part of the AI Software Factory
> Detailed step-by-step playbook for every development scenario.
> Referenced from CLAUDE.md — see there for the command table and quick reference.

---

## Starting a New Project

1. Create a new repo from the AI Software Factory template on GitHub
2. Clone it locally and run `npm install`
3. Open Claude Code in the project directory
4. Run `/foundation:init` — answer the 4 architectural questions
   - Project name
   - Multi-tenant? (yes/no)
   - AD/LDAP? (determines auth model)
   - Regulated industry? (yes/no)
   - Output: `project-config.json`, auth pages, baseline migration, dashboard shell
5. Run `/foundation:discover` — document what you're building
   - One-line description, users, use cases, environments
   - Output: completed `product-mission.md`, updated foundation docs
6. Run `/foundation:plan` — plan all features and create the backlog
   - List features, identify dependencies, prioritize
   - Output: `project-state.md` with full backlog
7. Start building features (see below)

---

## Creating a Feature (from Backlog)

Best practice: **one feature per Claude Code session** for clean context.

1. Run `/foundation:status` — see what's next in the backlog
2. Run `/foundation:shape-spec` — spec the feature
   - Acceptance criteria, data shape, UI reference
   - Output: `specs/{feature}.md`
3. Run `/architecture:new-feature` — generate schema + RPC
   - Migration file, API contract entry
   - Output: `supabase/migrations/`, updated API contracts doc
4. Run `/implementation:new-feature` — scaffold the code
   - Server Action + Zod schema + components
   - Output: files in `src/features/{domain}/`
5. Run `/qa:new-tests` then `/qa:fix` — tests until green
   - Output: test files, passing test suite
6. Commit and create PR to `dev`

`project-state.md` auto-updates after each step.

---

## Adding a Feature (Not in Backlog)

1. Run `/foundation:shape-spec` — spec the new feature
   - It auto-appends to the backlog in `project-state.md`
2. Follow steps 3–6 from "Creating a Feature" above

---

## Fixing a Bug

1. Read `project-state.md` for context on the affected area
2. Read the relevant feature spec (`specs/{feature}.md`)
3. Identify and fix the bug in the code
4. Run `/qa:fix` to verify all tests pass
5. Commit and create PR

---

## Checking Project Status

1. Run `/foundation:status`
   - Shows: completed features, pending features, current schema
   - Suggests: next feature to build based on dependency order

Or read `.claude/docs/project-state.md` directly.

---

## Reviewing Code Quality

Run any combination of review commands:

- `/architecture:review` — audit schema and RPC against standards
- `/implementation:review` — audit code patterns, naming, component structure
- `/data-fetching:review` — audit caching, server vs client data fetching

---

## Working with Designs

- `/design:import` — import a Figma file or mockup image into `design-os/screens/`
- `/design:system` — document or update design tokens

Run these any time during the project — they're optional but inform feature specs.

---

## Deploying

1. Run `/deployment:k8s-config` — generate Kubernetes manifests
2. Run `/deployment:release` — pre-release checklist and production deploy gate
3. Follow the branching model:
   - Feature branches → PR → `dev` (squash merge)
   - `dev` → PR → `main` (merge commit for semantic-release)
   - Production deploys happen via version tags from semantic-release

---

## Context Management Between Sessions

Every new Claude Code session automatically loads:
- `.claude/CLAUDE.md` — rules, standards, command table
- `.claude/project-config.json` — architectural choices (read by commands)

Commands also read:
- `.claude/docs/project-state.md` — what's built, what's next, schema snapshot
- `.claude/docs/foundation/product-mission.md` — what the project is

This means you can close a session after completing a feature and pick up
in a new session with full context. The state lives in the docs, not in
conversation history.

---

## Quick Reference

| I want to...                 | Run                          |
|------------------------------|------------------------------|
| Set up a new project         | `/foundation:init`           |
| Document the product         | `/foundation:discover`       |
| Plan all features            | `/foundation:plan`           |
| See what's next              | `/foundation:status`         |
| Spec a feature               | `/foundation:shape-spec`     |
| Build schema + RPC           | `/architecture:new-feature`  |
| Scaffold code                | `/implementation:new-feature`|
| Generate tests               | `/qa:new-tests`              |
| Fix failing tests            | `/qa:fix`                    |
| Review architecture          | `/architecture:review`       |
| Review implementation        | `/implementation:review`     |
| Review data fetching         | `/data-fetching:review`      |
| Import a design              | `/design:import`             |
| Generate K8s manifests       | `/deployment:k8s-config`     |
| Ship to production           | `/deployment:release`        |

---

## URS-First Development Workflow

Use this lane when the project starts from a finished, published URS — for
example, regulated procurements where the Software Architect receives a
signed requirements document and must derive the build plan from it.

### 1. Drop in the URS

Place the URS Markdown at `urs/main.md`. It must follow the structure in
ADR 0002 (front-matter + section headings + requirement tables). If you
do not have a Markdown URS yet, run `/foundation:urs:draft` first to
author one from a product brief.

### 2. Compile

```
/foundation:urs
```

This emits:

- `urs/main.tex` — formal LaTeX artifact (signable)
- `urs/index.json` — machine-readable contract
- `urs/applies-to.json` — NFR/UR/VR → FR cross-cutting map
- updates `.claude/docs/project-state.md` with FR-derived backlog rows

### 3. Plan from URS

```
/foundation:plan --from-urs
```

Skips the discover-derived feature derivation. Reads `urs/index.json` and
writes the FR rows directly into the backlog with risk zones and
dependencies.

### 4. Sprint plan

```
/foundation:sprint-plan
```

Computes complexity points per FR, builds the dependency DAG, groups FRs
into clusters, packs them into sprints with Sprint 0 as a walking
skeleton. Emits `urs/clusters.json` + `urs/sprint-plan.md`.

### 5. Per-FR build (lazy)

For each FR in Sprint 0, then Sprint 1, etc.:

```
/foundation:shape-spec --from-urs FR-XX
/architecture:new-feature
/implementation:new-feature
/qa:new-tests
/qa:fix
```

Each `shape-spec --from-urs` writes `urs/tasks/FR-XX.json` so downstream
commands have a deterministic task list.

### 6. Validate

```
/foundation:validate
```

Verifies every URS FR has a backlog row, every constraint references a
real FR, and `index.json`/`applies-to.json` timestamps match.

### 7. Release

```
/deployment:release
```

For regulated projects, the release gate cross-checks every shipped FR
against its URS row and flags any drift.

---

### Token-budget notes for very large URS

- `urs/index.json` may exceed 1 MB on a 1500+ FR document. Never load
  the whole file into LLM context — extract by ID via `jq` or
  programmatic Read.
- `/foundation:sprint-plan` operates on a compact projection (≤ 200 char
  per FR), bounded at ~50 KB even for 1000 FRs.
- Per-FR work uses only the relevant FR row + its constraints from
  `applies-to.json` — typically < 2 KB context.

See ADR 0003 for the full design rationale.
