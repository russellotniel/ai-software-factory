# ADR 0001 — URS and project-state.md are separate concerns

**Status:** Accepted
**Date:** 2026-04-29

---

## Context

The factory introduces a User Requirement Specification (URS) — a formal, signed,
regulated artifact required in pharma, banking, telco, and other regulated industries.
The factory already has `project-state.md` as the engineering ledger that tracks
each feature's maturity (`spec → architecture → implementation → tested → reviewed → shipped`).

A naive design copies requirement text into both files. That guarantees drift the
moment either side is edited and forces continuous reconciliation. In regulated
settings this is unsafe — the URS is the legally signed document, and any
divergence between it and the engineering record creates audit risk.

## Decision

The URS and `project-state.md` have **different jobs** and live as **separate
files joined by URS ID** (e.g. `FR-03`).

| Artifact | Role | Owner | Edited by |
|---|---|---|---|
| `urs/main.md` | Source of requirement intent — text, rank, sign-off, change history | Business / SA / QA | Humans, with factory assistance via `/foundation:urs:draft` |
| `urs/main.tex` | Compiled, formal, signed artifact | Same as above | Compiled by `/foundation:urs`; humans may edit for final polish before signing |
| `urs/index.json` | Machine-readable mirror of the locked URS | Factory | `/foundation:urs` only — never hand-edited |
| `.claude/docs/project-state.md` | Engineering ledger — maturity state, owner, dates, links to URS IDs | Factory | factory commands (`plan`, `shape-spec`, etc.) |

### Rules

1. **`project-state.md` does not store requirement text.** It stores rows like:
   `feature_id | urs_ref | risk_zone | maturity | spec_path | last_updated`.
2. **`urs/main.md` is the only place requirement text lives.**
3. **Downstream commands read `urs/index.json`, never `urs/main.md` or `urs/main.tex` directly** —
   the JSON is the contract.
4. **Drift is detected, not silently merged.** `/foundation:urs` runs reconciliation
   on every invocation; `/foundation:validate` fails loudly if anything is out of sync.
5. **Risk Zones derive from URS rank.** C → Zone 1, I → Zone 2, D → Zone 3,
   applied to `project-config.json#riskZones` by `/foundation:urs`.

## Consequences

**Positive:**

- Single source of truth for requirement text (URS).
- Single source of truth for engineering state (`project-state.md`).
- The join is by ID, not by duplicated content — drift becomes a detectable
  condition, not a silent corruption.
- Auditors can trace any URS ID through the whole codebase via the `@urs:` tag
  stamped into specs, migrations, code, and tests.
- C/I/D rank → Risk Zone mapping is automatic — the SA's rank column drives
  test depth and review depth without a second manual step.

**Negative / accepted trade-offs:**

- Two files to look at instead of one. Mitigated by `/foundation:status` showing
  both views together.
- Reconciliation must run before release. Mitigated by making it the first step
  of `/deployment:release`.

**Out of scope (explicitly):**

- This ADR does not specify the URS source format. See ADR 0002.
- This ADR does not specify how foundation commands seed the URS source file.
  That is a future change once `/foundation:urs:draft` and `/foundation:urs`
  are stable.
