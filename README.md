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
.claude/
  CLAUDE.md              → Auto-loaded context for every Claude Code session
  commands/              → Slash commands for each phase
  docs/
    foundation/          → Core principles and standards
    architecture-os/     → System design, schema, RPC, API contracts
    implementation-os/   → Coding standards, feature specs
    data-fetching-os/    → Caching, server vs client fetching, optimization
    qa-os/               → Test strategy, test cases, acceptance criteria
    deployment-os/       → CI/CD, environments, release process
    design-os/           → Product vision, design system, screen specs
    specs/               → Feature specs (generated per project)
    standards-index.yml  → Maps topics to document paths
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

### 1. Use this template

Click **"Use this template"** on GitHub to create your new repo, then clone it locally.

### 2. Run setup

```bash
bash setup.sh
```

### 3. Open Claude Code in your project directory

```bash
claude
```

### 4. Initialize your project

```
/foundation:init
```

This single command handles everything — new project bootstrap or wiring up an existing one. It installs all standard dependencies, generates all baseline files, and tells you what to do next.

### 5. Follow the guided sequence

Every command ends with a clear `What's Next` telling you exactly what to run next.

```
/foundation:init
    ↓
/foundation:discover
    ↓
/design:import          (optional — if you have a Figma file or mockups)
    ↓
── repeat for each feature ──────────────────────────────
/foundation:shape-spec
    ↓
/architecture:new-feature   (if schema changes needed)
    ↓
/implementation:new-feature
    ↓
/qa:new-tests
    ↓
/qa:fix
─────────────────────────────────────────────────────────
    ↓
/deployment:k8s-config
    ↓
/deployment:release
```

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
