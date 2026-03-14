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
2. Copy the `.claude/` folder into your actual project repo
3. Run Claude Code commands to populate documents for your specific project
4. Commit the populated documents alongside your code
5. Every developer and AI agent reads from the same source of truth

---

## Framework Structure

```
foundation/              → Global principles inherited by all phases
architecture-os/         → System design, schema, RPC, API contracts
implementation-os/       → Coding standards, feature specs
data-fetching-os/        → Caching, server vs client fetching, optimization
qa-os/                   → Test strategy, test cases, acceptance criteria
deployment-os/           → CI/CD, environments, release process

.claude/
  CLAUDE.md              → Auto-loaded context for every Claude Code session
  commands/              → Slash commands for each phase
```

---

## Stack

This framework is designed for:

- **Frontend:** Next.js (App Router)
- **Backend/Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth or Keycloak (AD/LDAP)
- **AI Agent:** Claude Code (primary), compatible with any AI coding tool

---

## Core Principles

1. **Performance first** — server vs client fetching is a deliberate decision
2. **Security baseline** — OWASP Top 10 compliance on every project
3. **UI/UX without compromising performance**
4. **Comprehensive testing** — unit, integration, e2e, edge cases, load
5. **Multi-tenancy by default** — organisation-based tenant model
6. **Audit trail by default** — every project gets audit logging

---

## Getting Started

### For a new project

```bash
# 1. Use this template on GitHub
# Click "Use this template" → "Create a new repository"

# 2. Clone your new project repo
git clone https://github.com/your-org/your-project
cd your-project

# 3. Start Claude Code
claude

# 4. Begin with foundation discovery
# /foundation/discover

# 5. Follow the phase sequence
# /architecture-os/auth
# /architecture-os/schema
# ...
```

### For an existing project

```bash
# 1. Clone AI Software Factory
git clone https://github.com/russellotniel/ai-software-factory

# 2. Copy .claude/ into your project
cp -r ai-software-factory/.claude your-project/

# 3. Start Claude Code inside your project
cd your-project
claude

# 4. Run discovery commands to document existing decisions
# /foundation/discover
# /architecture-os/discover
```

---

## Phase Sequence

Follow this order. Each phase builds on the previous.

| Phase             | Status | Description                     |
| ----------------- | ------ | ------------------------------- |
| Foundation        | ✅     | Core principles and standards   |
| Architecture OS   | 🔄     | System design, schema, RPC, API |
| Implementation OS | ⬜     | Coding standards, feature specs |
| Data Fetching OS  | ⬜     | Caching, optimization           |
| QA OS             | ⬜     | Testing strategy                |
| Deployment OS     | ⬜     | CI/CD, environments             |

---

## Credits

Built on top of and inspired by:

- [Design OS](https://github.com/buildermethods/design-os) by Brian Casel
- [Agent OS](https://github.com/buildermethods/agent-os) by Brian Casel

Created by [Russell](https://github.com/russellotniel)
