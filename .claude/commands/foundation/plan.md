# /foundation:plan

Plan all features upfront and create a prioritized backlog in `project-state.md`.
Run this after `/foundation:discover` to establish the development roadmap.

Output: `.claude/docs/project-state.md` with complete feature backlog.

**Preconditions:**
- `.claude/project-config.json` must exist (run `/foundation:init`)
- `.claude/docs/foundation/product-mission.md` must be completed (run `/foundation:discover`)
- `project-config.json` status should be `"active"`

---

## Step 1 — Read Context

Read:
- `.claude/project-config.json` — architectural choices
- `.claude/docs/foundation/product-mission.md` — use cases, users, scope
- `.claude/docs/project-state.md` — current state (if exists)

---

## Step 2 — Derive Features

From the use cases in `product-mission.md`, derive the list of features needed.

Present to the user:
"Based on your use cases, I think the project needs these features:"

List each feature with a one-line description.

Ask:
- "Is this list complete? Would you add, remove, or rename any?"
- "Are there any features not in the use cases that you want to include?"

---

## Step 3 — Identify Dependencies

For each feature, identify:
- **Depends on:** which features must be built first (e.g., tasks depends on projects)
- **Tables needed:** rough idea of what tables this feature requires
- **Shared patterns:** features that share similar CRUD patterns

Present the dependency graph to the user.

---

## Step 4 — Prioritize

Suggest a build order based on:
1. Dependencies (build dependencies first)
2. Core functionality first, nice-to-haves later
3. Features that establish patterns early (first CRUD feature sets the template for others)

Ask: "Does this order look right? Would you reprioritize anything?"

---

## Step 5 — Write Project State

Write or update `.claude/docs/project-state.md`:

```markdown
# Project State

Last updated: {today's date} — initialized by /foundation:plan

## Backlog

| # | Feature           | Status    | Depends On        | Spec |
|---|-------------------|-----------|-------------------|------|
| 1 | Auth (baseline)   | ✅ Done   | —                 | —    |
| 2 | {Feature name}    | 🔲 Pending | {dependencies}    | —    |
| 3 | {Feature name}    | 🔲 Pending | {dependencies}    | —    |
| 4 | {Feature name}    | 🔲 Pending | {dependencies}    | —    |
| 5 | {Feature name}    | 🔲 Pending | {dependencies}    | —    |

## Schema Snapshot

Tables: profiles{, tenants, tenant_members} (from baseline migration)
Key relationships: (none yet beyond baseline)

## Established Patterns

(populated after first feature is built)

## Architecture Notes

{Any cross-cutting concerns identified during planning:
- Shared table patterns
- Common RPC needs
- Reusable component patterns}
```

---

## Step 6 — Confirm

Show the complete backlog and ask the user to confirm.

On confirmation, write `project-state.md`.

---

## ✅ What's Next

Tell the user:

"Backlog created with {N} features. Start with **{first pending feature}**.
Run `/foundation:shape-spec` to spec it."

```
COMMAND_COMPLETE: foundation:plan
STATUS: success
FILES_CREATED: .claude/docs/project-state.md
NEXT_COMMAND: foundation:shape-spec
```
