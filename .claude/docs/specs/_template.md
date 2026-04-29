---
feature: [feature-slug]
urs: [FR-XX or null]                              # primary URS requirement
urs_cross_cutting: [NFR-01, UR-02, VR-01]         # constraints applied to this feature
risk_zone: [1 | 2 | 3 or null]
status: draft
generated_by: /foundation:shape-spec
---

# Spec: [Feature Name]

> Status: Draft | Ready | In Progress | Done

---

## Overview

**Feature:** [Name]
**Domain:** [src/features/{domain}]
**Requested by:** [User story or requirement source]
**URS reference:** [FR-XX from `urs/main.md` — or "none" if not URS-driven]
**Cross-cutting URS:** [NFR-XX (what), UR-XX (what), VR-XX (what) — list every cross-cutting requirement this feature must satisfy]
**Risk Zone:** [1 (Critical) | 2 (Standard) | 3 (Presentational) — derived from URS rank of the primary requirement; floored at the highest cross-cutting rank]

One paragraph describing what this feature does and why it exists.

---

## User Stories

```
As a [user type],
I want to [action],
So that [outcome].
```

---

## Acceptance Criteria

Concrete, testable conditions. Each becomes an E2E test.

- [ ] [Criterion 1 — observable outcome]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
- [ ] Tenant A cannot access Tenant B's data for this feature

---

## Data Shape

Tables and columns needed. Reference `architecture-os/schema-conventions.md`.

```
Table: [table_name]
New columns: [column: type — reason]
New table: [yes/no — if yes, describe]
RPC needed: [yes/no — if yes, describe the operation]
```

---

## UI / Design Reference

```
Figma frame: [URL or frame name]
Screen spec: design-os/screens/[feature-name].md
Mockup: docs/designs/[feature-name].png  (if no Figma)
```

---

## Implementation Notes

Anything Claude Code should know before building:

- [Edge case or constraint]
- [Integration with another feature]
- [Performance consideration]

---

## Out of Scope for This Spec

- [What is explicitly not included]
