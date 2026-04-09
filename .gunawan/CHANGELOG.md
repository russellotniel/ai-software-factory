# Gunawan — Foundation Changelog

Every change to the `.gunawan/` package must be logged here.
This is the audit trail for the foundation layer.

Format: `[YYYY-MM-DD] TYPE: description`
Types: `ADD` | `CHANGE` | `FIX` | `REMOVE` | `PROMOTE`

---

## 2026-04-09 — Initial Next.js Package (gunawan branch)

**Context:** Migrated from Expo React Native implementation to a generic Next.js package.
Previous implementation lived flat in the ai-software-factory root. Restructured into
a self-contained `.gunawan/` directory for clean project deployment.

- `ADD` `.gunawan/CLAUDE.md` — Generalized behavioral constitution (Next.js target, not Expo)
- `ADD` `.gunawan/standards-index.yml` — Topic→document index with `.gunawan/` prefixed paths
- `ADD` `.gunawan/foundation/` — All 6 foundation layers (human-intent, agent-foundation, roles, design, build, feedback)
- `ADD` `.gunawan/architecture-os/` — Schema, RPC, API contracts, audit, system design standards
- `ADD` `.gunawan/implementation-os/standards.md` — Implementation coding standards
- `ADD` `.gunawan/data-fetching-os/` — Caching strategy, server-vs-client patterns
- `ADD` `.gunawan/qa-os/strategy.md` — Testing strategy
- `ADD` `.gunawan/deployment-os/` — CI/CD, environments, release process, K8s sizing
- `ADD` `.gunawan/design-os/` — Design system, product vision, screen template
- `ADD` `.gunawan/.claude/commands/` — 16 slash commands (from mobile implementation)
- `ADD` `.gunawan/.claude/skills/newborn-gate/SKILL.md` — Gate checklist
- `ADD` `.gunawan/.claude/skills/reflect-task/SKILL.md` — Post-task reflection trigger
- `ADD` `.gunawan/.claude/hooks/verify-foundation.sh` — Foundation integrity hook
- `ADD` `.gunawan/.claude/hooks/protect-critical-files.sh` — Protected file escalation hook
- `ADD` `.gunawan/.mcp.json` — Standardized MCP config (Supabase, Playwright, GitHub, Figma, Context7, Sentry)
- `REMOVE` Root-level `foundation/`, `architecture-os/`, `data-fetching-os/`, `deployment-os/`, `design-os/`, `implementation-os/`, `qa-os/`, `standards-index.yml` — consolidated into `.gunawan/`
- `CHANGE` `CLAUDE.md` (root) — updated all path references from `foundation/` to `.gunawan/foundation/`

**Breaking change for Expo project:** `.gunawan/CLAUDE.md` paths and deployment steps are
Next.js-specific. The mobile (Expo) project retains its own `.gunawan/` copy unchanged.

---

## How to Log Changes

When you modify any file inside `.gunawan/`:

1. Add an entry here in the format above
2. Write a reflection in `docs/knowledge/reflections/REFLECTION-[date]-[slug].md`
3. If the change affects the deployment process, update the checklist in `.gunawan/CLAUDE.md`
4. If the change affects a standard that projects already use, note the migration impact

Changes to `.gunawan/` are protected operations — explicit human approval required before any edit.
