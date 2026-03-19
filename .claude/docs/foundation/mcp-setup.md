# MCP Setup

> Part of the AI Software Factory — Foundation Layer

MCP (Model Context Protocol) extends Claude Code with live connections to your
development tools — database, browser, design files, error monitoring.
This factory's `.mcp.json` defines six servers. This document explains what
each one does, how to configure it, and when to use it.

---

## Quick Start

The `.mcp.json` in the repo root is project-scoped and committed to version
control. Every developer gets the same server configuration automatically
when they open the project in Claude Code.

Each server that requires credentials reads them from environment variables.
Add these to your shell profile (`~/.zshrc`, `~/.bashrc`) or a local
`.env.local` that is sourced on shell startup:

```bash
# Supabase dev project (NEVER staging or production)
export SUPABASE_MCP_URL="http://localhost:54321"        # or your dev Supabase URL
export SUPABASE_MCP_ANON_KEY="your-dev-anon-key"

# Figma (only needed if working with Figma designs)
export FIGMA_ACCESS_TOKEN="your-figma-personal-access-token"

# Sentry (only needed for post-deploy monitoring)
export SENTRY_MCP_AUTH_TOKEN="your-sentry-auth-token"
export SENTRY_ORG="your-sentry-org-slug"
```

Verify all servers are active:

```bash
claude mcp list
```

---

## Server Reference

### Supabase MCP

**What it does:** Direct connection to your Supabase dev project. Claude Code
can run SQL, inspect schemas, apply migrations, query data, and verify RLS
policies — all without leaving the terminal.

**How it improves the factory:**

- `/architecture:new-feature` — apply the migration immediately and verify
  the table exists, RLS is active, and indexes are correct
- `/architecture:review` — query the live schema to check for missing columns
  or disabled RLS rather than reading migration files statically
- `/qa:fix` — query the dev database to understand data state during a
  failing test

**Configuration in `.mcp.json`:** Set `SUPABASE_MCP_URL` and
`SUPABASE_MCP_ANON_KEY` to your dev project values.

**Security rules — read carefully:**

- The server is configured `--read-only` by default. This prevents accidental
  writes during exploration. When you need to apply a migration, remove the
  flag temporarily or run the migration via `supabase db push` in a separate
  terminal.
- **Never point at staging or production.** The MCP server runs under your
  developer permissions. Connecting it to production exposes all your data
  to the LLM context.
- For self-hosted Supabase on Kubernetes: the MCP server runs behind the
  internal API. Access it via SSH tunnel to the Studio container or VPN only.
  Do not expose it to the internet.

```bash
# Self-hosted: open SSH tunnel before starting Claude Code
ssh -L 54321:localhost:54321 user@your-supabase-host
# Then set SUPABASE_MCP_URL=http://localhost:54321
```

---

### Playwright MCP

**What it does:** Claude Code drives a real browser. Navigate pages, click
elements, fill forms, take screenshots — all via natural language.

**How it improves the factory:**

- `/qa:fix` — when an E2E test fails, Claude can open the app in a live
  browser, reproduce the failure interactively, and observe exactly what
  the user would see
- Self-QA after implementing a feature — ask Claude to walk through the
  user flow and verify it works before writing the formal Playwright spec

**Important distinction — MCP vs CLI:**

|                  | Playwright MCP                     | Playwright CLI (`npm run test:e2e`)  |
| ---------------- | ---------------------------------- | ------------------------------------ |
| Use for          | Exploration, self-QA, `/qa:fix`    | CI/CD, repeatable regression tests   |
| Results          | Inline in conversation             | Files on disk (screenshots, reports) |
| Token cost       | Higher (accessibility tree inline) | Lower (file paths only)              |
| Persistent state | Yes                                | No (fresh per run)                   |

**Never use Playwright MCP in CI.** The CLI is faster, cheaper, and produces
the file-based output that GitHub Actions expects.

---

### GitHub MCP

**What it does:** Repository management — PRs, issues, code search — without
leaving Claude Code.

**How it improves the factory:**

- `/deployment:release` — verify CI is green on `main`, confirm E2E passed
  on the PR, check the tag was created by semantic-release
- PR review — ask Claude to summarise a PR diff and check it against
  implementation standards before you approve

**First-time setup:** Run `/mcp` inside Claude Code to authenticate via
GitHub OAuth. No token to manage manually.

---

### Figma MCP

**What it does:** Read Figma files directly — extract design tokens, component
structure, screen layouts, spacing values.

**How it improves the factory:**

- `/design:import` — read a Figma frame and populate `design-os/screens/`
  with a structured spec that implementation commands can reference
- `/implementation:new-feature` — read the Figma frame for the feature being
  built and generate components that match the actual design

**Setup:** Create a Figma personal access token at
`figma.com/settings` → Personal access tokens. Set `FIGMA_ACCESS_TOKEN`.

Only needed if your team uses Figma. If you work from static mockups
(images), Figma MCP is not required — `/design:import` handles images too.

---

### Context7 MCP

**What it does:** Injects up-to-date, version-specific library documentation
into Claude's context. Prevents hallucinated API signatures.

**Why this matters for this factory:** Next.js 16, Supabase JS v2, and
Tailwind 4 all have APIs that differ from what Claude's training data may
reflect. Context7 fetches the current docs for the version you're actually
using and injects them before Claude answers.

**No configuration required.** It activates automatically when Claude Code
detects library usage.

---

### Sentry MCP

**What it does:** Query production error data — stack traces, affected users,
regression detection.

**How it improves the factory:**

- `/deployment:release` post-deploy check — after production deploy, ask
  Claude to check Sentry for any new error spikes in the last 10 minutes

**Optional.** Only configure this if your project uses Sentry. If you use
a different error monitoring tool, this server is not needed.

---

## What MCP Does NOT Change

MCP is a developer tool for local development sessions. It does not affect:

- **CI/CD pipelines** — GitHub Actions uses CLI tools only, never MCP
- **Production** — MCP servers are never connected to production data
- **The factory's standards** — MCP helps Claude apply standards with more
  precision (live schema verification), but the standards themselves are
  unchanged
