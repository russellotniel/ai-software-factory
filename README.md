# AI Software Factory

> A full-lifecycle, human-centric agentic software house.
> Operated under codename **Gunawan**.

---

## What is this?

AI Software Factory is a structured framework of living documents and Claude Code
commands that guides you through every phase of software development — from product
vision to deployment.

It fills the gaps left by existing tools:

- **Design OS** (by Brian Casel) — covers product vision and UI design
- **Agent OS** (by Brian Casel) — covers implementation standards and feature specs
- **AI Software Factory** — covers everything in between and around them

---

## Operation Gunawan

**Gunawan** is the codename for this operation.

Gunawan is an Indonesian name. Intentionally human. Intentionally unassuming.
The whole point is that this AI team doesn't feel like a sci-fi deployment —
it feels like a person you work with.

An agent named Gunawan who started as a newborn, learned your standards, and now
runs your software house.

### The newborn principle

Every agent begins at **Level 0: Born**. No exceptions.

Maturity is earned through repeated trustworthy behavior — never assumed, never
granted by default. An agent that proves itself moves through:

```
Born → Infant → Child → Adolescent → Teen/Junior → Adult
```

At Adult, agents self-organise, present at standups, and run the software house.
The developer sets direction. The agents execute.

This is not a deployment. It is a raising.

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
foundation/
  human-intent-os/         Values, philosophy, engineering principles
  agent-foundation-os/     Task lifecycle, memory, handoffs, escalation
  role-definition-os/      6 roles: Strategist, Architect, Engineer, QA, DevOps, Consultant
  design-os/               Design pipeline templates (discovery → implementation readiness)
  build-os/                Index to implementation, testing, and deployment standards
  feedback-os/             Reflection, learning database, governance

architecture-os/           System design, schema conventions, RPC, API contracts
implementation-os/         Coding standards, feature specs
data-fetching-os/          Caching, server vs client fetching, optimization
qa-os/                     Test strategy, test cases, acceptance criteria
deployment-os/             CI/CD, environments, release process

.claude/
  CLAUDE.md                Auto-loaded behavioral constitution for every Claude Code session
  skills/                  Reusable workflow skills (newborn-gate, reflect-task, etc.)
  agents/                  Role-based subagents
  hooks/                   Enforcement hooks (foundation integrity, protected files)
```

---

## Stack

This framework is designed for:

- **Frontend:** Next.js 16 (App Router) + TypeScript
- **Backend/Database:** Supabase (PostgreSQL, self-hosted on Kubernetes)
- **Auth:** Supabase Auth or Keycloak (AD/LDAP)
- **Styling:** Tailwind CSS 4.x + Shadcn/ui
- **Runtime:** Node.js 20.9+
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

### 4. Bootstrap the foundation (first time only)

```
/foundation:bootstrap
```

This builds all six foundation layers through a guided interview.
No workflow proceeds until this is complete.

### 5. Initialize your project

```
/foundation:init
```

### 6. Follow the guided sequence

Every command ends with a clear `What's Next` telling you exactly what to run next.

```
/foundation:bootstrap
    ↓
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

Operation Gunawan by [iannn07](https://github.com/iannn07)
