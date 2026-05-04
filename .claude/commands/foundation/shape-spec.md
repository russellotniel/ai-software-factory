# /foundation:shape-spec

Create a spec for a feature before implementation begins. A spec is a short,
precise document that defines acceptance criteria, data shape, and UI reference
for one feature. It is the contract between planning and building.

This command enhances Claude Code's plan mode: run it first to surface the
right questions, then use plan mode to work through the implementation.

**Usage:**

- `/foundation:shape-spec` — interactive, no URS reference (manual feature)
- `/foundation:shape-spec --from-urs FR-XX` — seed the spec from a URS
  requirement; pre-fills feature name, description, and risk zone from
  `urs/index.json`

**Preconditions:**
- `.claude/project-config.json` must exist (run `/foundation:init`)
- `.claude/docs/project-state.md` should exist (run `/foundation:plan`)
- If using `--from-urs`: `urs/index.json` must exist (run `/foundation:urs`)

Read before starting:

- `.claude/project-config.json` — multi-tenant, auth model, regulated status
- `.claude/docs/foundation/product-mission.md` — project context
- `.claude/docs/architecture-os/schema-conventions.md` — data shape constraints
- `.claude/docs/specs/_template.md` — output format
- `.claude/docs/design-os/screens/` — check if a screen spec exists for this feature
- If `--from-urs` provided: `urs/index.json` — locate the URS requirement

---

## Step 0 — Optional URS Lookup

If invoked with `--from-urs FR-XX`:

1. Read `urs/index.json`. If it does not exist, abort with: "URS index missing.
   Run `/foundation:urs` first to compile the URS source."
2. Find the requirement matching the supplied ID. If not found, abort with the
   list of valid IDs.
3. Pre-fill spec context from the URS row:
   - **Feature title** — from `title` field
   - **Description seed** — from `text` field
   - **Risk zone** — from `risk_zone` field (1 | 2 | 3)
   - **URS reference** — the ID itself (e.g. `FR-03`)
   - **Type and class** — for traceability
4. Read `urs/applies-to.json` (if present) and look up
   `by_fr["<FR-XX>"]`. For every constraint id (NFR/UR/VR), fetch its
   full text from `urs/index.json` and add it to the spec's
   front-matter under `constraints:` so `/architecture:new-feature` and
   `/qa:new-tests` see them without re-deriving.
5. Skip Step 1's first two questions (feature name, what problem) — they come
   from the URS. Confirm them with the user instead:
   - "From URS `FR-03`: **Approve registration** — Dealer can approve or reject
     pending registrations in their region. Risk Zone 1 (Critical). Use this
     as the spec basis? (y/N)"
6. Continue with the remaining Step 1 questions and Steps 2–5.

If `--from-urs` not provided, proceed directly to Step 1 with full Q&A.

---

## Step 1 — Feature Context

Ask (skip the first two questions if Step 0 already answered them via URS):

- What feature are we speccing? (name it clearly)
- What problem does this solve for the user?
- Which user type does this serve? (cross-reference product-mission.md)
- Is there an existing screen design? (Figma frame, design-os screen spec,
  or a mockup image in docs/designs/)

If a screen spec or Figma frame exists — read it now before continuing.
The design is the source of truth for what the feature should look like.

---

## Step 2 — Acceptance Criteria

Guide the user through writing concrete, testable acceptance criteria.
Each criterion must be:

- Observable (you can verify it in a browser or a test)
- Specific enough that "done" is unambiguous
- Phrased from the user's perspective

Ask for each use case from product-mission.md that this feature touches:
"What does success look like for [use case]?"

If `project-config.json` has `multiTenant: true`, always include:
"Tenant A cannot access Tenant B's data for this feature."

---

## Step 3 — Data Shape

Think through what the database needs:

- Does an existing table need new columns?
- Does a new table need to be created?
- What indexes are needed?
- Is there business logic that warrants an RPC, or is this a direct query?

Apply schema-conventions.md rules silently — don't ask the user about
RLS or audit triggers, those are mandatory and will be added automatically.

---

## Step 4 — Implementation Notes

Ask:

- Are there any edge cases or constraints the builder should know?
- Does this feature interact with another feature in a non-obvious way?
- Any performance concerns (e.g. this query runs on every page load)?

---

## Step 5 — Generate and Save

Generate the spec using `.claude/docs/specs/_template.md` format.
Filename: `.claude/docs/specs/{feature-name}.md`

**Stamp traceability into the spec's YAML front-matter:**

- `feature: {feature-slug}` — kebab-case derived from feature name
- `urs:` — `FR-XX` if Step 0 ran with `--from-urs`, otherwise `null`
- `risk_zone:` — number from URS, or ask the user to assign manually
  (1 = Critical, 2 = Standard, 3 = Presentational)
- `status: draft`

Also stamp the same URS reference and risk zone into the **Overview** section
fields ("URS reference" and "Risk Zone") so they're visible to humans.

If URS-driven, downstream commands (`/architecture:new-feature`,
`/implementation:new-feature`, `/qa:new-tests`) will propagate the URS ID into
generated code and tests as `// @urs: FR-XX` comments — making `grep -r "FR-XX"`
return every artifact tied to the requirement.

Show the complete spec. Ask: "Should I save this?"

On confirmation, write to `.claude/docs/specs/{feature-name}.md`.

After saving:

- If data shape requires a new table or columns, suggest running
  `/architecture:new-feature` next
- If implementation is ready to start, suggest Claude Code plan mode:
  "Open plan mode and reference .claude/docs/specs/{feature-name}.md as the source of truth"

---

## Step 6 — Update Project State

Read `.claude/docs/project-state.md`. Find this feature in the Backlog table.

- If `--from-urs` was used: locate the row by `urs_ref` (it should already exist
  from `/foundation:urs` reconciliation). Update its `spec_path` and `maturity`
  fields. Do NOT create a duplicate row.
- If no `--from-urs`: locate by feature name; if not present, append as new row.
- Update its **Spec** column to link to the spec file: `[spec](../specs/{feature-name}.md)`
- Update its **Stage** column to `spec ←`
- In the **Feature Timeline** section (collapsible), add or update the row for this feature: set the `spec` column to today's date (YYYY-MM-DD format, month-day only in the table e.g. `04-06`)

Write the updated `project-state.md`.

---

## Step 7 — Emit per-FR Task Breakdown (`--from-urs` only)

After the spec markdown is written, also emit `urs/tasks/<FR-id>.json`
to record the canonical task list for downstream commands. This is
**lazy expansion** — only the FR currently being specced gets a task
file; other FRs do not.

```json
{
  "fr_id": "FR-03",
  "spec_path": ".claude/docs/specs/<feature-slug>.md",
  "constraints": ["UR-01", "VR-01"],
  "tasks": [
    { "stage": "spec",            "status": "completed", "owner": "/foundation:shape-spec" },
    { "stage": "architecture",    "status": "pending",   "owner": "/architecture:new-feature" },
    { "stage": "implementation",  "status": "pending",   "owner": "/implementation:new-feature" },
    { "stage": "tests",           "status": "pending",   "owner": "/qa:new-tests" },
    { "stage": "review",          "status": "pending",   "owner": "/architecture:review or /implementation:review" },
    { "stage": "release",         "status": "pending",   "owner": "/deployment:release" }
  ],
  "created_at": "<ISO 8601>",
  "updated_at": "<ISO 8601>"
}
```

Create `urs/tasks/` directory if missing. The file is updated by each
downstream command as the FR progresses through the maturity pipeline.

If the file already exists (re-spec), preserve every task whose
`status` is `completed`; reset only `pending` and `in_progress` rows
to match the new spec.

If `--from-urs` was not used, skip this step entirely.

---

## ✅ What's Next

Tell the user:

"Spec saved. Choose your next step:

- **If the spec requires a new table or new columns:** run `/architecture:new-feature` to generate the migration
- **If no schema changes are needed:** run `/implementation:new-feature` to scaffold the code directly"

```
COMMAND_COMPLETE: foundation:shape-spec
STATUS: success
FILES_CREATED: .claude/docs/specs/{feature-name}.md[, urs/tasks/{FR-id}.json when --from-urs]
FILES_MODIFIED: .claude/docs/project-state.md
URS_REF: {FR-XX or none}
RISK_ZONE: {1 | 2 | 3 or none}
NEXT_COMMAND: /architecture:new-feature (if schema changes) OR /implementation:new-feature (if no schema changes)
```
