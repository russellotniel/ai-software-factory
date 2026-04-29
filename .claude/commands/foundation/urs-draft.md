# /foundation:urs:draft

Draft a User Requirement Specification (URS) source file from a short product
brief. Produces `urs/main.md` — structured Markdown ready for SA review,
followed by `/foundation:urs` to compile it.

This is the AI-assisted authoring step. The SA describes the product; the
factory proposes the URS skeleton (FR / NFR / UR / VR rows with C/I/D ranks,
user matrix, glossary). The SA reviews and edits the Markdown directly.

Output: `urs/main.md` (Markdown source per ADR 0002).

**Preconditions:**

- `.claude/project-config.json` exists (run `/foundation:init`)
- `.claude/docs/foundation/product-mission.md` exists OR a brief file path is
  provided by the user (e.g. `urs/brief.md`)
- `latex_template/main.tex` exists (used as layout reference for section
  fidelity, even though this command does not compile to LaTeX)

Read before starting:

- `.claude/project-config.json` — `regulated`, `multiTenant`, `authModel`
- `.claude/docs/foundation/product-mission.md` — if present
- `.claude/docs/foundation/compliance-standards.md`
- `.claude/docs/adr/0002-urs-source-format.md` — required source structure

---

## Step 1 — Locate the Brief

Ask the user:

- "Where is the product brief? (path, or paste it here, or shall we run a short
  Q&A to capture it?)"

If the brief is provided as a file: read it.
If pasted: write it first to `urs/brief.md` for traceability.
If running Q&A: collect answers in this conversation, write a synthesized brief
to `urs/brief.md` at the end.

Q&A questions (use only when no brief exists):

1. What does the product do, in one paragraph?
2. Who are the users? List every distinct role.
3. What modules / feature areas does the product have?
4. Are there regulatory drivers? (e.g. Kominfo, OJK, BPOM, GDPR, HIPAA)
   What specifically does the regulator require?
5. What sensitive data flows through this system? (PII, financial, health, etc.)
6. What non-functional concerns matter most? (performance, security,
   availability, scalability)
7. What validation, approval, or audit obligations exist?

Keep the Q&A short — 7 questions max. The SA will refine the URS afterwards.

---

## Step 2 — Read the Project Configuration

Read `.claude/project-config.json`.

If `regulated: true`, the URS will use stricter defaults:
- All compliance-related requirements default to **C** rank.
- Audit requirements (`VR-*`) are mandatory — at minimum one VR row per state
  transition or sensitive-data write.

If `multiTenant: true`, propose at least one UR row per tenant-isolation rule.

Do NOT ask the user to re-specify multi-tenancy, auth, or regulated status —
they are already in `project-config.json`.

---

## Step 3 — Propose URS Sections

From the brief, derive each URS section. Show the proposal to the user before
writing.

### Project Detail

- **Project Overview** — one paragraph from the brief.
- **Objective** — what the system aims to achieve, regulator-friendly language.
- **Project Scope** — bullet list of in-scope items.
- **System Description** — high-level system context.

### User Matrix

A table of `Module × Role`, with `v` marking which roles use which feature.

Use roles from the brief. Default columns if the brief is sparse:
`SuperAdmin | Admin | <domain roles> | EndUser | Auditor`.

### Functional Requirements (FR-XX)

For each module, propose 1–4 functional requirements. Each row:

- `URS ID` — `FR-01`, `FR-02`, ... (zero-padded, sequential, unique).
- `Type` — `Functional`.
- `Requirement` — `**<short title>**: <one-sentence description>`.
- `Rank` — propose `C` for core flows, `I` for enhancements, `D` for nice-to-haves.

### Non-Functional Requirements (NFR-XX)

Propose at least:
- **Security** — sensitive-data handling, encryption (rank usually **C** if regulated)
- **Performance** — p95 latency targets where the brief implies time-sensitivity (**I**)
- **Auditability** — append-only logs, retention (rank **C** if regulated)
- **Availability** — uptime target if relevant (**I**)

Each row uses `NFR-XX` IDs.

### User Role Requirements (UR-XX)

One row per role describing what that role can do. Pull roles from the User
Matrix. These are the seeds of RLS policies.

### Validation & Audit Requirements (VR-XX)

If `regulated: true` or the brief mentions audit, propose at least:
- **Append-only audit log** for every approval / rejection / state transition.
- **Dual approval** for sensitive-data changes after sign-off.
- **Reason required** for rejections / cancellations.

Use `VR-XX` IDs. Default rank **C** for regulated projects.

### Glossary

Detect acronyms and domain terms in the brief. Define each. Add common
regulatory terms if applicable to the domain.

### Related Documents

Empty table by default. SA will fill in regulator references during review.

---

## Step 4 — Show the Proposal

Print to the user:

- Proposed section counts (e.g. "5 FR, 3 NFR, 4 UR, 3 VR").
- Proposed rank distribution (e.g. "4 C-rank → Zone 1, 7 I-rank → Zone 2, 1 D-rank → Zone 3").
- Roles detected.
- Acronyms detected for glossary.

Ask:

- "Does the rank distribution look right? Should anything move from C↔I↔D?"
- "Any roles missing?"
- "Any modules or features missing?"

Adjust the proposal based on answers.

---

## Step 5 — Write `urs/main.md`

Generate the file at `urs/main.md` with the structure mandated by ADR 0002:

```markdown
---
project_name: <from project-config.json or brief>
project_code: <short uppercase, e.g. SIMREG>
version: 0.1
effective_date: TBA
status: draft
prepared_by: []
reviewed_by: []
approved_by: []
---

# Project Detail

## Project Overview
<one paragraph>

## Objective
<one paragraph>

## Project Scope
<bullet list>

## System Description
<one paragraph>

# User Matrix

| Module | Feature | <Role 1> | <Role 2> | ... | Auditor |
|--------|---------|:--------:|:--------:|:---:|:-------:|
| ...    | ...     |    v     |          |     |    v    |

# Functional Requirements

## General

| URS ID | Type | Requirement | Rank |
|--------|------|-------------|------|
| FR-01 | Functional | **Title**: Description. | C |

## <Module name>

| URS ID | Type | Requirement | Rank |
|--------|------|-------------|------|
| FR-XX | Functional | **Title**: Description. | <C/I/D> |

# Non-Functional Requirements

| URS ID | Type | Requirement | Rank |
|--------|------|-------------|------|
| NFR-01 | Security | **Title**: Description. | C |

# User Role Requirements

| URS ID | Type | Requirement | Rank |
|--------|------|-------------|------|
| UR-01 | User Role | **<Role>**: <what they can do>. | C |

# Validation & Audit Requirements

| URS ID | Type | Requirement | Rank |
|--------|------|-------------|------|
| VR-01 | Validation | **Title**: Description. | C |

# Related Documents

| No. | Title |
|-----|-------|
|     |       |

# Glossary

| Acronym | Definition |
|---------|------------|
| ABC     | ...        |
```

**Required invariants when writing:**

- Front-matter is YAML. `status: draft` on first generation.
- Every URS ID is unique across the document.
- Every Requirement cell starts with a bold short title (`**Title**: ...`).
- Section headings are exactly as shown above — do not rename.
- Rank ∈ {C, I, D}.

If `urs/main.md` already exists, ask:

- "`urs/main.md` already exists. Overwrite, merge, or abort?"

Default safe action: write a new file at `urs/main.md.draft-<timestamp>` and
ask the user to diff before replacing.

---

## Step 6 — Print Summary

Print:

- File written: `urs/main.md`.
- Counts: requirements by class, ranks, roles, glossary entries.
- Next step: "Review `urs/main.md` and edit anything that looks off, then run
  `/foundation:urs` to compile the LaTeX, generate `urs/index.json`, seed the
  engineering ledger, and map ranks to Risk Zones."

Remind the SA:

- The URS source `urs/main.md` is the editable file.
- The compiled `urs/main.tex` (produced by `/foundation:urs`) is the formal,
  signable artifact.
- Hand-edits to `main.tex` after signing are NOT back-ported to `main.md` —
  see ADR 0002.

---

## ✅ What's Next

Tell the user:

"URS draft created at `urs/main.md`. Review and edit, then run
`/foundation:urs` to compile and seed the engineering pipeline."

```
COMMAND_COMPLETE: foundation:urs:draft
STATUS: success
FILES_CREATED: urs/main.md, urs/brief.md (if Q&A path)
NEXT_COMMAND: foundation:urs
```
