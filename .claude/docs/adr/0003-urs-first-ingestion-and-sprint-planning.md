# ADR 0003 — URS-first ingestion and sprint planning

**Status:** Accepted
**Date:** 2026-05-04

---

## Context

ADR 0001 + 0002 established that the factory can compile a URS into
`urs/index.json` and reconcile it into `project-state.md`. The default
factory flow still authors the URS in parallel with discover/plan rather
than starting from a finished URS.

We want a mode where a published URS — possibly hundreds of pages — is the
canonical input, and the factory derives both the backlog and a sprint
delivery timeline from it. Two concerns drive the design:

1. **Token budget.** A 400+ page URS cannot be loaded into LLM context
   in full. Stages must operate on compact derived artifacts, not the
   markdown source.
2. **Cost of speculation.** Eagerly expanding every FR into a task list at
   plan time wastes effort on FRs that may be cut, deferred, or specced
   later. URS edits would invalidate the entire eager expansion.

## Decision

### 1. Sprint sizing — derived complexity points, not raw FR count

A sprint master would not size by FR count alone (each FR has highly
variable effort) nor by risk zone alone (zone is criticality, not effort).
Compute complexity points per FR from URS structure:

```
points = w1 * tables_touched
       + w2 * applies_to_count        (scoped NFR/UR/VR only — NOT wildcards, capped at 10)
       + w3 * risk_zone               (Z1=3, Z2=2, Z3=1)
       + w4 * dep_count               (FR depends on other FRs)
```

Default weights: `w1=2, w2=1, w3=1, w4=1`. Sprint 0 = walking skeleton
(auth + spine FRs, fixed). Subsequent sprints fill a configurable point
budget (default 13). For small URS where total points fall below
`2 × budget`, `/foundation:sprint-plan` auto-shrinks the effective budget
to keep the plan multi-sprint. For URS with fewer than 5 FRs, clustering
and bin-packing are skipped entirely — one FR per sprint in topological
order.

**Bin-packing operates on FRs, not whole clusters.** Clusters group FRs
by section/persona for reporting, but a single cluster may span multiple
sprints when its total points exceed the budget. The legacy "place
oversized cluster in one oversized sprint" rule was removed after the
2026-05-04 smoke test produced 14 oversized sprints on a 308-FR URS.

**Walking-skeleton selection is deterministic and not topo-driven.**
Sprint 0 picks a Zone-1 FR matched against a canonical priority list
(auth → registration → case/submission → fallback). Pure topo-order
selection failed when synthetic FRs lack cross-references — alphabetical
fallback put `Administration and Configuration` first, exactly inverting
the dependency reality.

### 2. Task expansion — lazy, not eager

Per-FR task lists (`spec → migration → RPC → action → component → tests`)
are generated on demand by `/foundation:shape-spec --from-urs FR-XX`.
Sprint estimation uses the complexity heuristic above; it does not
require actual task counts. A 1000-FR URS yields zero task files until
the SA enters that FR.

### 3. `urs/index.json` — full text on disk, slice-by-ID in consumers

Keep full requirement text in `index.json`. Cost is bounded
(≈ 1 MB even for 1500 FRs at ~700 bytes/req). Consumers must extract by
ID via `jq` or programmatic Read — never load the entire file into LLM
context. `applies-to.json` provides the precomputed cross-cutting map so
consumers never need to re-derive.

### 4. Subagent fan-out — deferred

Compile is a deterministic parser (no LLM, no fan-out needed). Clustering
in `/foundation:sprint-plan` is the only candidate for fan-out, and the
need is unproven without measuring on a real heavy URS. Ship single-
agent v1 with the clustering interface designed as a pure function
(`cluster(reqs[], constraints[]) → clusters[]`). Wire fan-out only when
a 200+ FR URS pegs context.

## Consequences

**Positive:**

- Token budget bounded at every stage; works for arbitrarily large URS.
- Sprint plan reflects effort variance, not just count or criticality.
- Lazy task expansion avoids waste; URS edits invalidate at most the
  affected FR's task file.
- Single-source-of-truth for cross-cutting constraints
  (`applies-to.json`).

**Negative / accepted trade-offs:**

- Sprint plan estimates without seeing actual tasks — relies on the
  complexity heuristic. Mitigated by re-running `/foundation:sprint-plan`
  as FRs ship and actual table counts firm up.
- Default weights `w1..w4` are calibrated on a small sample. Re-tune
  after running on 5+ real URS projects.
- `applies-to.json` derivation is regex-based (`\bFR-\d+\b` mention
  scan, supports `FR-1` through `FR-9999`). Misses cases where a NFR/UR
  row implicitly applies without naming an FR. Mitigated by warning when
  `applies_to` resolves to `["*"]`.

**Out of scope:**

- Per-sprint capacity calibration from historical velocity (no history
  to draw on yet — re-evaluate after 3+ projects).
- Fan-out implementation (deferred per decision 4).
