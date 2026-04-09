# AI Software Factory — Knowledge Base

Read this before starting any task. Update it after every significant session.

---

## What This Project Is

**AI Software Factory** (codename: Gunawan) is the agentic development framework and foundation layer
used across all Shannon projects. It is not a product — it is the system that builds products.

Every Next.js or Expo project in the Shannon organisation copies `.gunawan/` from this repo
and uses it as the behavioral and technical foundation for Claude Code sessions.

---

## Current State (updated 2026-04-09)

| Area | Status | Notes |
|------|--------|-------|
| `.gunawan/` package | ✅ Complete | Self-contained — ready to copy to projects |
| Foundation layers 1–6 | ✅ Complete | human-intent, agent-foundation, roles, design, build, feedback |
| OS layers | ✅ Complete | architecture, implementation, data-fetching, qa, deployment, design |
| Commands | ✅ Complete | 16 commands in `.gunawan/.claude/commands/` |
| Skills | ✅ Complete | newborn-gate, reflect-task in `.gunawan/.claude/skills/` |
| Hooks | ✅ Complete | verify-foundation.sh, protect-critical-files.sh |
| MCP config | ✅ Complete | `.gunawan/.mcp.json` with 6 servers |
| Docs structure | ✅ Complete | knowledge/, plan/, implementation/ established |
| Project history | ⚠️ In progress | Previous GPT/Cursor work documented in reference/ |

---

## What Was Built Before This Session

This project evolved through three phases without a unified agentic standard:

1. **GPT Project phase** — Initial architecture and principles drafted in a GPT project context.
   Documents captured: auth model, compliance standards, engineering principles, product mission template.
   These are preserved in `docs/knowledge/reference/`.

2. **Cursor only phase** — Implementation work done directly in Cursor without structured agent roles
   or newborn gate protocol. No session state files, no reflection logs.

3. **Gunawan (current)** — Full agentic framework established. `.gunawan/` package created and
   standardised for deployment to all Shannon projects (Next.js and Expo).

---

## Guardrails (Quick Reference)

| Rule | Detail |
|------|--------|
| Never modify `.gunawan/**` | Protected — escalate first |
| Never modify `CLAUDE.md` | Protected — escalate first |
| Never self-promote maturity | Human grants promotions only |
| Always run newborn gate | Before every substantive workflow |
| Always write a reflection | After every significant task |
| Always log changes to `.gunawan/` | Entry in `docs/knowledge/reflections/` + update this README |

---

## ADR Index

| ID | Title | Status |
|----|-------|--------|
| — | No ADRs recorded yet — start with `/architecture:review` | — |

Add ADRs to `docs/knowledge/architecture-decisions/ADR-NNN-title.md` as decisions are made.

---

## Patterns

See `docs/knowledge/patterns/` — empty until first pattern is logged via `/qa:fix` or reflection.

## Anti-Patterns

See `docs/knowledge/anti-patterns/` — empty until first failure is captured.

## Reflections

| Date | File | Summary |
|------|------|---------|
| 2026-04-09 | [REFLECTION-2026-04-09-gunawan-nextjs-package.md](reflections/REFLECTION-2026-04-09-gunawan-nextjs-package.md) | Gunawan packaged into `.gunawan/`, full Claude + MCP config documented |

---

## Reference Documents

Existing standards carried over from the GPT/Cursor era — reviewed and preserved:

| File | What It Is |
|------|-----------|
| `reference/principles.md` | Core engineering principles (Performance, Security, UX, Testing, Multi-tenancy, Audit) |
| `reference/auth-model.md` | Authentication model — Keycloak vs Supabase Auth decision fork |
| `reference/compliance-standards.md` | OWASP, GDPR, audit requirements |
| `reference/mcp-setup.md` | MCP server setup guide — detailed per-server configuration |
| `reference/product-mission.md` | Template for project product-mission.md (fill per project) |
| `reference/Shannon Agentic AI Foundation.md` | The foundational philosophy document |

---

## What's Next

- [ ] Run `/foundation:discover` to populate project-specific foundation documents
- [ ] Run newborn gate on first substantive task
- [ ] Start a Next.js project and validate the `.gunawan/` deployment process end-to-end
- [ ] Write ADR-001 for the decision to move from GPT/Cursor to Gunawan framework
