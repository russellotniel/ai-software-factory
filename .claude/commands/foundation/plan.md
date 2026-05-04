# /foundation:plan

Plan all features upfront and create a prioritized backlog in `project-state.md`.
Run this after `/foundation:discover` to establish the development roadmap.

**Usage:**

- `/foundation:plan` — derive backlog from `product-mission.md` (default; runs after `/foundation:discover`).
- `/foundation:plan --from-urs` — treat a published URS as the canonical source. Skips discover-derived feature derivation; ingests `urs/index.json` directly. Use when the project starts from a finished URS rather than building one in parallel.

Output: `.claude/docs/project-state.md` with complete feature backlog.

**Preconditions:**

- `.claude/project-config.json` must exist (run `/foundation:init`)
- `project-config.json` status should be `"active"`
- **Default mode:** `.claude/docs/foundation/product-mission.md` must be completed (run `/foundation:discover`)
- **`--from-urs` mode:** `urs/index.json` must exist (run `/foundation:urs`). `product-mission.md` may be a stub.

---

## Step 0 — Mode Selection

Resolve the active ingest mode in this priority order:

1. **Explicit flag wins.** If invoked with `--from-urs`, force
   `mode = "urs-first"` regardless of project config.
2. **Project config default.** Otherwise, read
   `projectConfig.ingestMode` from `.claude/project-config.json`. If
   set to `"urs-first"`, treat that as default. Set by
   `/foundation:init` (see Task 7B).
3. **Fallback.** If neither flag nor config indicates URS-first,
   `mode = "discover-derived"`.

When `mode == "urs-first"`:

a. Verify `urs/index.json` exists. If not, abort: "URS index missing. Run `/foundation:urs` first to compile the URS source."
b. Skip Step 2 (Derive Features). The feature list comes from `urs/index.json` FR rows directly. Step 3 (Identify Dependencies) and onward still apply.
c. Skip the question "Are there any features not in the use cases?" — in `urs-first` mode the URS is canonical. Out-of-URS features must be added by editing `urs/main.md` and re-running `/foundation:urs` first.

When `mode == "discover-derived"`, proceed with Step 1 as written.

---

## Step 1 — Read Context

Read:
- `.claude/project-config.json` — architectural choices
- `.claude/docs/foundation/product-mission.md` — use cases, users, scope
- `.claude/docs/project-state.md` — current state (if exists)

---

## Step 2 — Derive Features

**(discover-derived mode only — skip in `--from-urs` mode.)**

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

**`--from-urs` mode:** include the `URS Ref`, `Zone`, and `Last Updated` columns shown in the existing `project-state.md` template (see ADR 0001). One backlog row per FR row in `urs/index.json`. Maturity starts at `🔲 Pending`. `Spec` column starts empty.

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

**`--from-urs` next steps:** after the backlog is written, run `/foundation:sprint-plan` to derive a delivery timeline grouped into sprints with Sprint 0 walking skeleton.
