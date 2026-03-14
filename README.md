# AI Software Factory

> A full development lifecycle framework for Next.js + Supabase projects.
> Usable by a solo developer or a full team.

---

## What is this?

AI Software Factory is a structured framework of living documents and Claude Code commands that guides you through every phase of software development — from product vision to deployment.

It fills the gaps left by existing tools:

- **Design OS** (by Brian Casel) — covers product vision and UI design
- **Agent OS** (by Brian Casel) — covers implementation standards and feature specs
- **AI Software Factory** — covers everything in between and around them

---

## How it works

AI Software Factory is a **template repository**. For every new project:

1. Use this repo as a GitHub template → creates a fresh copy
2. Run Claude Code commands to populate documents for your specific project
3. Commit the populated documents alongside your code
4. Every developer and AI agent reads from the same source of truth

---

## Framework Structure

```
foundation/              → Global principles inherited by all phases
design-os/               → Design system, screen specs, product vision
architecture-os/         → System design, schema, RPC, API contracts
implementation-os/       → Coding standards, folder structure
data-fetching-os/        → Caching, server vs client fetching
qa-os/                   → Test strategy, Vitest + Playwright
deployment-os/           → CI/CD, environments, release, Kubernetes
specs/                   → Per-feature specs (generated per project)

.claude/
  CLAUDE.md              → Auto-loaded context for every Claude Code session
  commands/              → Slash commands for each phase
.mcp.json                → MCP server configuration (Supabase, Playwright, Figma, etc.)
standards-index.yml      → Maps topics to relevant documents
```

---

## Stack

This framework is designed for:

- **Frontend:** Next.js 16 (App Router)
- **Backend/Database:** Supabase (PostgreSQL, self-hosted on Kubernetes)
- **Auth:** Supabase Auth or Keycloak (AD/LDAP)
- **AI Agent:** Claude Code (primary), compatible with any AI coding tool

---

## Core Principles

1. **Performance first** — server vs client fetching is a deliberate decision
2. **Security baseline** — OWASP Top 10 compliance on every project
3. **UI/UX without compromising performance**
4. **Comprehensive testing** — unit, component, E2E, tenant isolation
5. **Multi-tenancy by default** — organisation-based tenant model
6. **Audit trail by default** — every project gets audit logging

---

## Getting Started

### For a new project

```bash
# 1. Use this repo as a GitHub template
# GitHub → "Use this template" → "Create a new repository"

# 2. Clone your new project repo
git clone https://github.com/your-org/your-project
cd your-project

# 3. Set up MCP environment variables (see foundation/mcp-setup.md)
export SUPABASE_MCP_URL="http://localhost:54321"
export SUPABASE_MCP_ANON_KEY="your-dev-anon-key"

# 4. Start Claude Code
claude

# 5. Begin — populates all foundation and design documents
/foundation:discover
```

### For an existing project

```bash
# 1. Clone AI Software Factory
git clone https://github.com/russellotniel/ai-software-factory

# 2. Copy everything into your project repo
cp -r ai-software-factory/. your-project/

# 3. Start Claude Code inside your project
cd your-project
claude

# 4. Run discovery to document existing decisions
/foundation:discover
```

---

## Development Workflow

```
New project:
  /foundation:discover        → document standards + product-mission.md
  /design:import              → import Figma or mockup → design-os/screens/
  /foundation:shape-spec      → spec a feature → specs/feature-name.md

Per feature:
  /architecture:new-feature   → migration SQL + RPC + API contract
  /implementation:new-feature → Server Action + Zod schema + component
  /qa:new-tests               → unit + component + E2E scaffolding
  /qa:fix                     → run tests → fix → green

Before shipping:
  /deployment:k8s-config      → generate sized Kubernetes manifests
  /deployment:release         → pre-release checklist + deploy gate

Ongoing:
  /architecture:review        → audit schema/RPC against standards
  /implementation:review      → audit code against standards
  /data-fetching:review       → audit caching patterns
  /foundation:inject-standards → load relevant standards for current task
```

---

## Phase Completion

| Phase             | Status | Description                           |
| ----------------- | ------ | ------------------------------------- |
| Foundation        | ✅     | Principles, tech standards, auth, MCP |
| Design OS         | ✅     | Design system, screen specs, vision   |
| Architecture OS   | ✅     | System design, schema, RPC, API       |
| Implementation OS | ✅     | Coding standards, folder structure    |
| Data Fetching OS  | ✅     | Caching strategy, server vs client    |
| QA OS             | ✅     | Test strategy, Vitest + Playwright    |
| Deployment OS     | ✅     | CI/CD, environments, release, K8s     |

---

## Credits

Built on top of and inspired by:

- [Design OS](https://github.com/buildermethods/design-os) by Brian Casel
- [Agent OS](https://github.com/buildermethods/agent-os) by Brian Casel

Created by [Russell](https://github.com/russellotniel)
