# ADR 0002 — URS source is Markdown, compiled to LaTeX

**Status:** Accepted
**Date:** 2026-04-29

---

## Context

ADR 0001 separates URS authoring (`urs/main.md`) from the formal signed artifact
(`urs/main.tex`) and the machine-readable index (`urs/index.json`). This ADR
specifies the source format.

Three options were considered:

- **A.** Markdown source → compiled LaTeX. Cleanest to author programmatically;
  easy for humans; LaTeX still the legal artifact.
- **B.** Edit LaTeX directly with anchored markers (`% @@ FR-03 @@`).
  Single file; LaTeX is hard to edit programmatically; SA edits can break markers.
- **C.** Structured YAML/JSON intermediate. Most robust; two-step authoring feels
  indirect to SAs.

## Decision

**Option A.** The URS is authored in `urs/main.md` (Markdown, with structured
front-matter and tables). `/foundation:urs` compiles it to `urs/main.tex` using
`latex_template/main.tex` as the formal layout, and emits `urs/index.json` for
downstream consumption.

### `urs/main.md` structure

```markdown
---
project_name: SIM Registration Portal
project_code: SIMREG
version: 0.1
effective_date: TBA
status: draft   # draft | reviewed | signed
prepared_by: []
reviewed_by: []
approved_by: []
---

# Project Detail

(narrative — Project Overview, Objective, Project Scope, System Description)

# User Matrix

| Module          | Feature              | SuperAdmin | Admin | Dealer | Customer | Auditor |
|-----------------|----------------------|:----------:|:-----:|:------:|:--------:|:-------:|
| Registration    | Submit registration  |     v      |   v   |   v    |    v     |         |

# Functional Requirements

## General

| URS ID | Type       | Requirement                                                | Rank |
|--------|------------|------------------------------------------------------------|------|
| FR-01  | Functional | **Submit registration**: Customer can submit ...           | C    |

## Feature

| URS ID | Type       | Requirement                                                | Rank |
|--------|------------|------------------------------------------------------------|------|
| FR-03  | Functional | **Approve registration**: Dealer can approve or reject ... | C    |

# Non-Functional Requirements

| URS ID | Type        | Requirement                              | Rank |
|--------|-------------|------------------------------------------|------|
| NFR-01 | Security    | NIK encrypted at rest using AES-256      | C    |

# User Role Requirements

| URS ID | Type      | Requirement                              | Rank |
|--------|-----------|------------------------------------------|------|
| UR-01  | User Role | Customer: submit own, view own status    | C    |

# Validation & Audit Requirements

| URS ID | Type       | Requirement                                          | Rank |
|--------|------------|------------------------------------------------------|------|
| VR-01  | Validation | Every approval/rejection writes an audit log entry   | C    |

# Related Documents

| No.   | Title                         |
|-------|-------------------------------|
| 001   | Kominfo PP No. 28/2017 .docx  |

# Glossary

| Acronym | Definition                                            |
|---------|-------------------------------------------------------|
| NIK     | Nomor Induk Kependudukan (Indonesian national ID)     |
```

### Required invariants

1. Front-matter is YAML and **must** include `project_name`, `version`, `status`,
   and the three sign-off arrays.
2. Every requirement table **must** have columns: `URS ID`, `Type`, `Requirement`,
   `Rank`. Rank ∈ {`C`, `I`, `D`}.
3. URS IDs are unique across the entire document. Prefixes are by class:
   `FR-` functional, `NFR-` non-functional, `UR-` user role, `VR-` validation.
4. The `Requirement` cell **should** start with a bold short title
   (`**Submit registration**: ...`) — the bolded text becomes the URS row's
   short label in `index.json` and the traceability `grep` output.
5. Section headings (`# Project Detail`, `# User Matrix`, etc.) **must not be
   renamed**. The compiler matches by heading.

### Compiled outputs

- `urs/main.tex` — Final formal artifact, populated from `latex_template/main.tex`.
  Humans may hand-edit before signing. Signed `.tex` is the legal record.
- `urs/index.json` — Schema:
  ```json
  {
    "project": { "name": "...", "code": "...", "version": "0.1", "status": "draft" },
    "requirements": [
      {
        "id": "FR-01",
        "class": "FR",
        "type": "Functional",
        "rank": "C",
        "title": "Submit registration",
        "text": "Customer can submit ...",
        "section_anchor": "general",
        "risk_zone": 1
      }
    ],
    "user_matrix": [ ... ],
    "roles": ["SuperAdmin","Admin","Dealer","Customer","Auditor"],
    "glossary": [ ... ]
  }
  ```
- `project-state.md` — backlog rows added/updated, never duplicating requirement
  text. See ADR 0001.

## Consequences

**Positive:**

- SA can hand-edit Markdown without touching LaTeX.
- `/foundation:urs:draft` and other future seeders can write structured Markdown
  programmatically with low risk of corruption.
- LaTeX remains the formal, signable, printable artifact — no change to the
  regulated process.
- `index.json` decouples downstream commands from the LaTeX format entirely.

**Negative / accepted trade-offs:**

- The compiler must be tolerant of minor Markdown variations (extra whitespace,
  cell padding). Plan: strict on column count and headings; lenient on whitespace.
- If the SA hand-edits `main.tex` after compilation, those edits are not back-ported
  to `main.md`. Resolution: the signed `main.tex` is the legal record; `main.md`
  remains the *editable* source. We document this clearly in the command output.

**Out of scope:**

- This ADR does not define the parser implementation. See `/foundation:urs`
  command spec.
- This ADR does not require all four section types to be present. A draft URS
  may lack `Validation & Audit` early on; the compiler emits a warning, not an
  error.
