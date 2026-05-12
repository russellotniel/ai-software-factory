# /foundation:urs

Compile the URS source `urs/main.md` into the formal artifact set:

- `urs/main.tex` — formal, signable, regulated artifact (LaTeX, populated from `latex_template/main.tex`)
- `urs/index.json` — machine-readable contract consumed by every downstream command
- `.claude/docs/project-state.md` — engineering ledger, reconciled with URS

This is the **compile / lock / reconcile** step. It does not author requirements
— the SA does that in `urs/main.md` (often via `/foundation:urs:draft` first).

Output: see above. Also prints a drift report.

**Preconditions:**

- `urs/main.md` exists and is well-formed per ADR 0002
- `latex_template/main.tex` exists
- `.claude/project-config.json` exists

Read before starting:

- `urs/main.md`
- `latex_template/main.tex`
- `.claude/docs/adr/0001-urs-project-state-separation.md`
- `.claude/docs/adr/0002-urs-source-format.md`
- `.claude/project-config.json`
- `.claude/docs/project-state.md` (if exists)

---

## Step 1 — Validate Source

Read `urs/main.md`. Verify:

1. **YAML front-matter present** with at minimum: `project_name`, `version`, `status`.
2. **Section headings present and exact:** `# Project Detail`, `# User Matrix`,
   `# Functional Requirements`, `# Non-Functional Requirements`,
   `# User Role Requirements`, `# Validation & Audit Requirements`,
   `# Related Documents`, `# Glossary`. Missing optional sections (e.g.
   `Validation & Audit` early in a draft) emit a warning, not a hard error.
3. **Every requirement table** has columns `URS ID | Type | Requirement | Rank`.
4. **Every URS ID is unique** across the entire document.
5. **URS IDs match their class prefix:** `FR-` in Functional, `NFR-` in
   Non-Functional, `UR-` in User Role, `VR-` in Validation & Audit.
6. **Every Rank is in {C, I, D}.**
7. **Status is one of:** `draft`, `reviewed`, `signed`.

If any hard error: stop and report. Do NOT write outputs.
If only warnings: continue, list them in the summary.

If `status: signed`, prompt:

> "URS is marked **signed**. Regenerating `urs/main.tex` overwrites the legal
> record. Continue? (y/N)"

Default: abort. Only proceed on explicit `y`.

---

## Step 2 — Parse Source into Internal Model

Build a structured model in memory:

```
{
  project: { name, code, version, effective_date, status, prepared_by, reviewed_by, approved_by },
  project_detail: { overview, objective, scope, system_description },
  user_matrix: [ { module, feature, roles: { <role>: bool } } ],
  roles: [ <role names from User Matrix columns> ],
  requirements: [
    {
      id, class, type, title, text, rank,
      section_anchor (kebab-case of section name),
      risk_zone (1 if C, 2 if I, 3 if D)
    }
  ],
  related_documents: [ { number, title } ],
  glossary: [ { acronym, definition } ]
}
```

**Title parsing:** the bold prefix in the Requirement cell becomes `title`,
the rest becomes `text`. If no bold prefix, `title` is empty and `text` is the
full cell.

---

## Step 3 — Compile `urs/main.tex`

Read `latex_template/main.tex` as the layout template.

Generate `urs/main.tex` by substituting content from the parsed model into
the template's structure:

- **Cover page:** replace the placeholder title strings with `project_name`
  rendered as the document subject. Replace `Document No`, `Version`,
  `Effective Date` placeholders with values from front-matter (use the
  underlined blanks where TBA).
- **Change History:** keep the table; append rows derived from the
  front-matter version field (one row per known version — for now, just one
  row at version `0.1` "Create New Document" if no history is tracked).
- **Agreement table:** populate from `prepared_by`, `reviewed_by`,
  `approved_by` arrays.
- **Project Detail:** replace placeholder Lorem ipsum in `Project Overview`,
  `Objective`, `Project Scope`, `System Description` subsections.
- **User Matrix:** rebuild the table dynamically from `user_matrix` and `roles`.
  Use `\rotatebox{90}` for role headers (matches template convention).
- **Process Flow section:** if the source brief or `urs/main.md` has a
  `# Process Flow` section, render it; otherwise leave the LaTeX section
  with a single placeholder paragraph.
- **Requirements:** rebuild every `longtable` using the parsed requirements,
  grouped by class:
  - Functional → `Persyaratan Fungsional Sistem`
  - Non-Functional → `Persyaratan Non-Fungsional`
  - User Role → `Persyaratan Peran Pengguna`
  - Validation → `Persyaratan Validasi \& Audit`
- **Related Documents:** populate from parsed array.
- **Glossary:** populate from parsed array.

**LaTeX safety:** escape special characters in injected text — `&`, `%`,
`$`, `#`, `_`, `{`, `}`, `~`, `^`, `\`. Bold titles in Requirement cells
become `\textbf{Title}: text`.

Write the result to `urs/main.tex`.

---

## Step 4 — Emit `urs/index.json`

Per ADR 0002, write `urs/index.json`:

```json
{
  "project": {
    "name": "...",
    "code": "...",
    "version": "0.1",
    "status": "draft",
    "effective_date": "TBA"
  },
  "compiled_at": "<ISO 8601 timestamp>",
  "requirements": [
    {
      "id": "FR-01",
      "class": "FR",
      "type": "Functional",
      "rank": "C",
      "risk_zone": 1,
      "title": "Submit registration",
      "text": "Customer can submit ...",
      "section_anchor": "general"
    }
  ],
  "user_matrix": [ ... ],
  "roles": [ "SuperAdmin", "Admin", "Dealer", "Customer", "Auditor" ],
  "glossary": [ { "acronym": "NIK", "definition": "..." } ],
  "related_documents": [ ... ]
}
```

`risk_zone` is derived: `C → 1`, `I → 2`, `D → 3`.

This file is the **downstream contract**. Every command after URS reads
`urs/index.json` and never the LaTeX or Markdown directly.

---

## Step 4.5 — Emit `urs/applies-to.json`

Precompute the cross-cutting map from non-functional / user-role / validation
requirements to the functional requirements they constrain. Downstream
commands consume this map directly — no LLM re-derivation per call.

For every requirement with class in {NFR, UR, VR}:

1. Scan its `text` field for substrings matching the regex
   `\bFR-\d+\b` (case-sensitive, supports `FR-1` through `FR-9999`).
   Collect unique matches.
2. If at least one FR id is found, set `applies_to` to that list.
3. If no FR id is found, set `applies_to: ["*"]` and emit a warning in the
   compile report using the actual requirement id (e.g. `NFR-03`):
   `<ID> has no explicit FR scope — applied to all FRs by default.`

Also build the inverse map keyed by FR id: for each FR, list every
NFR/UR/VR id whose `applies_to` includes that FR (or `"*"`).

Write `urs/applies-to.json`:

```json
{
  "compiled_at": "<ISO 8601 timestamp — copy from urs/index.json, do not regenerate>",
  "constraints": [
    {
      "id": "NFR-01",
      "class": "NFR",
      "applies_to": ["FR-01", "FR-08"]
    },
    {
      "id": "NFR-02",
      "class": "NFR",
      "applies_to": ["*"]
    },
    {
      "id": "VR-01",
      "class": "VR",
      "applies_to": ["FR-05", "FR-06"]
    }
  ],
  "by_fr": {
    "FR-01": ["NFR-01", "NFR-02", "UR-01"],
    "FR-05": ["NFR-02", "VR-01", "UR-02"],
    "FR-06": ["NFR-02", "VR-01", "UR-02"],
    "FR-08": ["NFR-01", "NFR-02"]
  }
}
```

**Consumers:**

- `/foundation:sprint-plan` reads `by_fr["FR-XX"].length` as the `applies_to_count` input to its complexity-points formula.
- `/foundation:shape-spec --from-urs FR-XX` reads `by_fr["FR-XX"]` and injects the listed constraints into the spec front-matter.
- `/foundation:validate` cross-checks that every constraint's `applies_to` references a real FR.

---

## Step 5 — Reconcile `project-state.md`

Per ADR 0001, `project-state.md` is the engineering ledger — it stores
maturity per feature with a `urs_ref` link, but never the requirement text.

Read `.claude/docs/project-state.md` (create it from the standard template
if it does not exist).

For each requirement in the URS:

1. **If a backlog row with `urs_ref: <ID>` exists:** keep its current `maturity`
   and timeline; update `risk_zone` only if the rank in URS changed.
2. **If no row exists:** append a new row with:
   - `feature_id` — derived from `<id-as-slug>` if the URS title has one, else `<id>` (e.g. `fr-03-approve-registration` or `fr-03`)
   - `urs_ref` — the URS ID
   - `risk_zone` — from URS rank
   - `maturity` — `🔲 Pending`
   - `spec_path` — empty
   - `last_updated` — today's date
3. **If a backlog row references a `urs_ref` not present in the URS:** flag
   it as **orphaned** in the drift report. Do not delete it — the SA decides
   whether to remove the feature or restore the URS row.

Use the existing project-state.md table format. If the file does not have
the columns required (`urs_ref`, `risk_zone`), add them; preserve all other
content.

If `project-config.json` has `multiTenant: true`, add a "Tenant isolation
test" row reference per feature with auto-generated test ID — handled
downstream by `/qa:new-tests`. URS only records the requirement; tests are
generated separately.

Write the updated `project-state.md`.

---

## Step 6 — Drift Report

Print a structured report:

```
URS Compile — <project_name> v<version>
Status: draft | reviewed | signed
Compiled: <timestamp>

Requirements:
  Functional:      N (C: a, I: b, D: c)
  Non-Functional:  N (C: a, I: b, D: c)
  User Role:       N (C: a, I: b, D: c)
  Validation:      N (C: a, I: b, D: c)
  TOTAL:           N

Risk Zones (from rank):
  Zone 1 (Critical):       N requirements — IDs: ...
  Zone 2 (Standard):       N requirements — IDs: ...
  Zone 3 (Presentational): N requirements — IDs: ...

Reconciliation:
  + Added to backlog:      N rows (IDs: ...)
  ~ Updated in backlog:    N rows (IDs: ...)
  ! Orphaned in backlog:   N rows (IDs: ...) — review and resolve
  = Unchanged:             N rows

Files written:
  urs/main.tex
  urs/index.json
  urs/applies-to.json
  .claude/docs/project-state.md (modified)

Warnings (if any):
  - <warning text>
```

---

## Step 7 — Stamping `@urs:` Tags (Forward Reference)

This command does not stamp tags itself — it produces `urs/index.json`, which
downstream commands consume. Stamping is the responsibility of:

- `/foundation:shape-spec --from-urs FR-XX` — adds `@urs: FR-XX` to spec front-matter
- `/architecture:new-feature` — propagates `@urs:` from the spec into migration headers and API contracts
- `/implementation:new-feature` — propagates `@urs:` into Server Actions, Zod schemas, and components
- `/qa:new-tests` — propagates `@urs:` into test descriptions

After this command runs, the SA can grep `urs/index.json` for any URS ID;
once features ship, `grep -r "FR-03"` traces the requirement through the
entire codebase.

---

## ✅ What's Next

Tell the user:

"URS compiled. Review `urs/main.tex` for the formal artifact, and
`urs/index.json` is now the downstream contract. Next:

- If the URS has any requirements not yet specced, run
  `/foundation:shape-spec --from-urs <FR-XX>` for each.
- If the URS is ready for sign-off, edit the front-matter `status` from
  `draft` → `reviewed` → `signed` and re-run this command to update the
  formal artifact."

```
COMMAND_COMPLETE: foundation:urs
STATUS: success
FILES_CREATED: urs/main.tex, urs/index.json, urs/applies-to.json
FILES_MODIFIED: .claude/docs/project-state.md
NEXT_COMMAND: /foundation:shape-spec --from-urs <FR-XX>
```
