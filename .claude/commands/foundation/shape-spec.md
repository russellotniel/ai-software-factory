# /foundation:shape-spec

Create a spec for a feature before implementation begins. A spec is a short,
precise document that defines acceptance criteria, data shape, and UI reference
for one feature. It is the contract between planning and building.

This command enhances Claude Code's plan mode: run it first to surface the
right questions, then use plan mode to work through the implementation.

Read before starting:

- `foundation/product-mission.md` — project context
- `architecture-os/schema-conventions.md` — data shape constraints
- `specs/_template.md` — output format
- `design-os/screens/` — check if a screen spec exists for this feature

---

## Step 1 — Feature Context

Ask:

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

Always include: "Tenant A cannot access Tenant B's data for this feature."

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

Generate the spec using `specs/_template.md` format.
Filename: `specs/{feature-name}.md`

Show the complete spec. Ask: "Should I save this?"

On confirmation, write to `specs/{feature-name}.md`.

After saving:

- If data shape requires a new table or columns, suggest running
  `/architecture:new-feature` next
- If implementation is ready to start, suggest Claude Code plan mode:
  "Open plan mode and reference specs/{feature-name}.md as the source of truth"

---

## ✅ What's Next

Tell the user:

"Spec saved. Choose your next step:

- **If the spec requires a new table or new columns:** run `/architecture:new-feature` to generate the migration
- **If no schema changes are needed:** run `/implementation:new-feature` to scaffold the code directly"

```
Next command: /architecture:new-feature   (if schema changes needed)
         OR: /implementation:new-feature   (if no schema changes)
```
