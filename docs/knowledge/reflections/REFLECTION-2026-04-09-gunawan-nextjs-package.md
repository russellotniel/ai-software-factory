# Reflection — Gunawan Next.js Package Setup

**Date:** 2026-04-09
**Session type:** Foundation restructure + packaging
**Role:** Product Strategist + System Architect
**Result:** Success

---

## What This Session Did

Migrated the AI Software Factory from a flat root-level structure (inherited from GPT Project +
Cursor-only development) into a clean, self-contained `.gunawan/` package that any Next.js project
can copy and use immediately.

---

## What Changed in This Repo

### Before

```
ai-software-factory/
  CLAUDE.md
  CLAUDE.md.backup          ← deleted
  README.md                 ← deleted
  setup.sh                  ← deleted
  specs/_template.md        ← deleted
  standards-index.yml       ← deleted (superseded by .gunawan/standards-index.yml)
  foundation/               ← deleted (consolidated into .gunawan/)
  architecture-os/          ← deleted
  data-fetching-os/         ← deleted
  deployment-os/            ← deleted
  design-os/                ← deleted
  implementation-os/        ← deleted
  qa-os/                    ← deleted
  docs/
    Agentic AI Foundation.pdf   ← lost (not recovered — was not in git at session start)
    Shannon Agentic AI Foundation.md
    auth-model.md
    compliance-standards.md
    mcp-setup.md
    principles.md
    product-mission.md
```

### After

```
ai-software-factory/
  CLAUDE.md                         ← updated (paths now reference .gunawan/)
  .gunawan/                         ← NEW — complete self-contained package
  docs/
    knowledge/
      README.md                     ← NEW — factory current state + ADR index
      reference/                    ← existing docs preserved here
        Shannon Agentic AI Foundation.md
        auth-model.md
        compliance-standards.md
        mcp-setup.md
        principles.md
        product-mission.md
      architecture-decisions/       ← empty, ready
      patterns/                     ← empty, ready
      anti-patterns/                ← empty, ready
      reflections/                  ← this file
    plan/                           ← empty, ready
    implementation/                 ← empty, ready
  .claude/
    commands/                       ← mirrored from .gunawan/.claude/commands/
    skills/                         ← mirrored from .gunawan/.claude/skills/
    settings.local.json             ← permission allowlist
```

---

## The .gunawan/ Package — Complete File Map

```
.gunawan/
  README.md                         ← bootstrap guide (copy this folder → deploy → init)
  CLAUDE.md                         ← behavioral constitution auto-loaded by Claude Code
  CHANGELOG.md                      ← every change to this package must be logged here
  standards-index.yml               ← topic → document index (.gunawan/ prefixed paths)
  .mcp.json                         ← MCP server config template (6 servers)

  .claude/
    commands/
      foundation/
        bootstrap-foundation.md     ← /foundation:bootstrap
        discover.md                 ← /foundation:discover
        init.md                     ← /foundation:init
        inject-standards.md         ← /foundation:inject-standards
        shape-spec.md               ← /foundation:shape-spec
      architecture-os/
        new-feature.md              ← /architecture:new-feature
        review.md                   ← /architecture:review
      implementation-os/
        new-feature.md              ← /implementation:new-feature
        review.md                   ← /implementation:review
      data-fetching-os/
        review.md                   ← /data-fetching:review
      qa-os/
        new-tests.md                ← /qa:new-tests
        fix.md                      ← /qa:fix
      deployment-os/
        release.md                  ← /deployment:release
        k8s-config.md               ← /deployment:k8s-config
      design-os/
        import.md                   ← /design:import
        system.md                   ← /design:system
    skills/
      newborn-gate/SKILL.md         ← gate checklist — runs before every workflow
      reflect-task/SKILL.md         ← post-task reflection trigger
    hooks/
      verify-foundation.sh          ← blocks tool calls if foundation files are missing
      protect-critical-files.sh     ← blocks edits to protected files, prints escalation

  foundation/
    tech-standards.md               ← Next.js stack defaults
    human-intent-os/                ← 10 files: mission, philosophy, principles, ethics...
    agent-foundation-os/            ← 12 files: task-lifecycle, escalation, orchestration...
    role-definition-os/             ← 5 roles × 7 files + role-map + collab-map + selection
    design-os/                      ← 11 files: discovery pipeline
    build-os/index.md               ← bridge to project-level build standards
    feedback-os/                    ← 8 files: reflection, learning, governance...

  architecture-os/
    schema-conventions.md
    rpc-standards.md
    api-contracts.md
    audit-trail.md
    system-design.md

  implementation-os/
    standards.md

  data-fetching-os/
    caching-strategy.md
    server-vs-client.md

  qa-os/
    strategy.md

  deployment-os/
    ci-cd.md
    environments.md
    release-process.md
    k8s-sizing.md

  design-os/
    design-system.md
    product-vision.md
    screens/_template.md
```

---

## Claude Code Configuration — Full Reference

### How Claude Code discovers files

Claude Code reads these locations automatically on session start:

| Location | What it loads |
|----------|--------------|
| `CLAUDE.md` (project root) | Primary behavioral constitution — ALWAYS loaded |
| `~/.claude/CLAUDE.md` | Global user constitution |
| `.claude/commands/**/*.md` | Slash commands (e.g. `/foundation:init`) |
| `.claude/skills/*/SKILL.md` | Skills (e.g. `newborn-gate`, `reflect-task`) |
| `.claude/agents/*.md` | Sub-agent manifests (loaded when spawning agents) |
| `.claude/settings.json` | Hooks, permissions (shared, committed) |
| `.claude/settings.local.json` | Permissions (local, not committed) |
| `.mcp.json` | MCP server connections |

**Important:** `.gunawan/CLAUDE.md` is NOT auto-loaded. Only the project root `CLAUDE.md` is.
The project `CLAUDE.md` must explicitly tell Claude to load `.gunawan/` content.

---

### settings.json — Hooks configuration

Place at `.claude/settings.json` in the project (committed, shared with team):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/verify-foundation.sh"
          },
          {
            "type": "command",
            "command": "bash .claude/hooks/protect-critical-files.sh"
          }
        ]
      }
    ]
  }
}
```

**How hooks work:**
- `PreToolUse` runs before the matched tool executes
- Claude Code passes the tool's input as JSON on stdin
- Exit code `0` = allow the tool call to proceed
- Exit code non-zero = block the tool call, print the hook's stdout as the error

**`verify-foundation.sh`** — checks that 5 required foundation files exist and are non-empty.
Blocks any Edit/Write if they are missing. Forces the developer to restore `.gunawan/` first.

**`protect-critical-files.sh`** — reads `file_path` from stdin JSON, checks it against
10 protected path patterns (CLAUDE.md, .gunawan/**, .env*, supabase/migrations/**, etc.).
Blocks the edit and prints an escalation message if matched.

---

### settings.local.json — Permission allowlist

Place at `.claude/settings.local.json` (not committed — developer-local):

```json
{
  "permissions": {
    "allow": [
      "Bash(mkdir:*)",
      "Bash(git:*)",
      "Bash(npm install:*)",
      "Bash(npm uninstall:*)",
      "Bash(npm run:*)",
      "Bash(npx:*)",
      "Bash(cp:*)",
      "Bash(mv:*)",
      "Bash(rm:*)",
      "Bash(chmod:*)",
      "Bash(find:*)",
      "Bash(ls:*)",
      "WebFetch(domain:nextjs.org)",
      "WebFetch(domain:supabase.com)",
      "WebFetch(domain:tailwindcss.com)",
      "WebFetch(domain:shadcn.com)"
    ]
  }
}
```

Add `WebFetch` entries for any documentation domain Claude regularly needs.
Remove `Bash` entries for commands you want Claude to ask permission for each time.

---

### .claude/agents/ — Sub-agent manifests

Created by `/foundation:init`. Five files + preamble:

| File | Role | Spawned when |
|------|------|-------------|
| `_preamble.md` | Injected into every sub-agent | Always — defines project identity + non-negotiables |
| `architect.md` | System Architect | Technical design, ADRs, implementation plans |
| `builder.md` | Software Engineer | Writing and modifying files |
| `reviewer.md` | QA Reviewer | Checking output against Gunawan standards |
| `explorer.md` | Discovery Specialist | Codebase reading, file search, tracing data flows |
| `devops.md` | Platform Engineer | CI/CD, builds, deployment readiness |

Every sub-agent spawn must begin with this preamble (replace `[PROJECT]` and `[PATH]`):

```
You are a deployed Gunawan agent for the [PROJECT] project.

Start by reading these files in order before doing anything else:
1. [ABSOLUTE_PATH]/.claude/agents/_preamble.md
2. [ABSOLUTE_PATH]/.claude/agents/[role-manifest].md

These define your role, scope, non-negotiables, and required output format.
After reading both files, proceed with the task below.

---
[task description]
```

---

### .claude/roles/ — Session state files

Created by `/foundation:init`. Six files:

| File | Purpose |
|------|---------|
| `active.md` | Current role + maturity level — updated on every role switch |
| `product-strategist.md` | Accumulated context for Product Strategist sessions |
| `system-architect.md` | Accumulated context for System Architect sessions |
| `software-engineer.md` | Accumulated context for Software Engineer sessions |
| `qa-reviewer.md` | Accumulated context for QA Reviewer sessions |
| `devops-platform.md` | Accumulated context for DevOps Platform sessions |

**`active.md` initial state:**
```
# Active Role

role: product-strategist
maturity: 0
last-session: [today's date]
```

**Role state file template:**
```markdown
# [Role Name] — Session State

last-session: [date]
maturity: 0

## Active Task
None

## Accumulated Context
[Facts learned about this project relevant to this role]

## Key Decisions Made
[Decisions made under this role]

## Open Questions
[Unresolved items]

## Lessons Learned
[Patterns, anti-patterns, failures]
```

Claude auto-saves to the active role file after every turn where a decision was made,
a task completed, or an assumption corrected. No command needed.

---

## MCP Configuration — Full Reference

Source: `.gunawan/.mcp.json` → deploy to project root as `.mcp.json`

### Supabase

```json
{
  "command": "npx",
  "args": ["-y", "@supabase/mcp-server-supabase@latest",
           "--supabase-url", "${SUPABASE_MCP_URL}",
           "--anon-key", "${SUPABASE_MCP_ANON_KEY}",
           "--read-only"]
}
```

- **Use for:** Querying dev database, inspecting schema, reading RLS policies
- **Always read-only** — use Supabase CLI for migrations
- **NEVER** point `SUPABASE_MCP_URL` at staging or production
- Env vars: `SUPABASE_MCP_URL`, `SUPABASE_MCP_ANON_KEY`

### Playwright

```json
{
  "command": "npx",
  "args": ["-y", "@playwright/mcp@latest"]
}
```

- **Use for:** Interactive `/qa:fix` sessions, exploratory testing, screenshot verification
- **Do not use** for CI pipelines — use `playwright test` CLI instead
- No credentials required

### GitHub

```json
{
  "type": "http",
  "url": "https://api.githubcopilot.com/mcp/"
}
```

- **Use for:** PR reviews, issue management, repo operations
- Run `/mcp` in Claude Code to authenticate on first use (browser OAuth flow)
- No env vars — uses GitHub Copilot OAuth

### Figma

```json
{
  "command": "npx",
  "args": ["-y", "figma-mcp"],
  "env": { "FIGMA_ACCESS_TOKEN": "${FIGMA_ACCESS_TOKEN}" }
}
```

- **Use for:** `/design:import` — reads Figma files, extracts design tokens + screen specs
- Only needed if the project has Figma designs
- Env var: `FIGMA_ACCESS_TOKEN` (Figma personal access token)

### Context7

```json
{
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp@latest"]
}
```

- **Use for:** Up-to-date library docs injected into context automatically
- Prevents hallucinated API signatures for Next.js, Supabase, Tailwind, shadcn
- No credentials required — always on

### Sentry

```json
{
  "command": "npx",
  "args": ["-y", "@sentry/mcp-server@latest"],
  "env": {
    "SENTRY_AUTH_TOKEN": "${SENTRY_MCP_AUTH_TOKEN}",
    "SENTRY_ORG": "${SENTRY_ORG}"
  }
}
```

- **Use for:** `/deployment:release` post-deploy checks — query production errors
- Only needed after Sentry is set up for the project
- Env vars: `SENTRY_MCP_AUTH_TOKEN`, `SENTRY_ORG`

---

## How to Start on a Root Project — Complete Sequence

### For a brand new Next.js project

```bash
# 1. Copy .gunawan/ from the factory repo
cp -r /path/to/ai-software-factory/.gunawan /path/to/your-project/

cd /path/to/your-project

# 2. Deploy Claude tooling
cp -r .gunawan/.claude/commands .claude/commands
cp -r .gunawan/.claude/skills   .claude/skills
cp -r .gunawan/.claude/hooks    .claude/hooks
chmod +x .claude/hooks/*.sh

# 3. Deploy MCP config
cp .gunawan/.mcp.json .mcp.json

# 4. Register hooks — create .claude/settings.json with the hooks block above

# 5. Set env vars (add to ~/.zshrc or ~/.bashrc)
export SUPABASE_MCP_URL="http://localhost:54321"
export SUPABASE_MCP_ANON_KEY="your-dev-anon-key"
export FIGMA_ACCESS_TOKEN="your-figma-token"
```

```
# 6. Open Claude Code in the project and run:
/foundation:init        → scaffolds Next.js + Supabase + all baseline files
/foundation:discover    → documents project standards + creates docs/knowledge/README.md
```

Claude will generate `CLAUDE.md`, `.claude/agents/`, `.claude/roles/`, and all code files.
Review and approve each step before Claude writes anything.

---

### For an existing Next.js project

Same steps 1–5, then:

```
/foundation:init        → detects existing files, installs only what's missing
/foundation:discover    → reads existing codebase, documents what's already there
```

The `init` command never overwrites existing files — it fills gaps only.

---

### First session checklist

- [ ] `.gunawan/` copied to project root
- [ ] `.claude/commands/`, `skills/`, `hooks/` deployed
- [ ] Hooks registered in `.claude/settings.json`
- [ ] `.mcp.json` copied and env vars set
- [ ] `/foundation:init` completed
- [ ] `/foundation:discover` completed — `docs/knowledge/README.md` exists
- [ ] `CLAUDE.md` at project root exists with all 10 required sections
- [ ] `.claude/agents/` has `_preamble.md` + 5 role manifests
- [ ] `.claude/roles/active.md` exists: `role: product-strategist, maturity: 0`
- [ ] Newborn gate passes before first feature task

---

## Lessons from This Session

**What went well:**
- Copying the full foundation from the mobile (Expo) implementation preserved all content
- Splitting `foundation/` project-specific files into `docs/knowledge/reference/` avoided data loss
- The `.gunawan/.claude/` structure (commands inside the package) makes the package self-contained

**What to watch for:**
- `.gunawan/CLAUDE.md` is NOT auto-loaded — the project must have its own root `CLAUDE.md`
  that tells Claude to load `.gunawan/` content. This is the most common setup error.
- `settings.local.json` accumulates one-time permissions during active work sessions.
  Clean it back to the minimal allowlist before committing or handing to another developer.
- The `/foundation:init` command scaffolds code files, not Claude agent files.
  Agent files (agents/, roles/) are documented in CLAUDE.md and created manually or via bootstrap.

**Proposed addition to foundation:**
- Add `/roles:init` command to `.gunawan/.claude/commands/roles/init.md` that specifically
  scaffolds `.claude/agents/` and `.claude/roles/` — separate concern from `/foundation:init`.
