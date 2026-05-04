# /foundation:sprint-plan

Derive a sprint delivery timeline from a compiled URS. Reads
`urs/index.json` + `urs/applies-to.json`, computes complexity points per
FR, builds the dependency DAG, groups FRs into delivery waves, and emits
`urs/clusters.json` + `urs/sprint-plan.md`.

This is **not authoring** — the URS already declared the requirements.
This is **scheduling** — given the requirements, what should ship first
and in what order.

**Usage:**

- `/foundation:sprint-plan` — generate the timeline using the default
  point budget (13 per sprint after Sprint 0).
- `/foundation:sprint-plan --budget N` — override the per-sprint
  point budget.

**Preconditions:**

- `urs/index.json` must exist (run `/foundation:urs`).
- `urs/applies-to.json` must exist (emitted alongside `index.json` —
  re-run `/foundation:urs` if missing).
- `.claude/docs/project-state.md` should already have the URS-derived
  backlog rows (run `/foundation:plan --from-urs` first).

Read before starting:

- `urs/index.json` — slice by ID; do **not** load the whole file into
  LLM context if the FR count exceeds 100. Use `jq` or programmatic
  Read with offset/limit.
- `urs/applies-to.json` — full file (always small).
- `.claude/project-config.json` — multi-tenant flag affects walking
  skeleton.
- `.claude/docs/project-state.md` — current backlog state.
- `.claude/docs/adr/0003-urs-first-ingestion-and-sprint-planning.md` —
  binding design decisions for this command.

---

## Step 1 — Load Compact Inputs

1. Read `urs/applies-to.json` in full.
2. Read `urs/index.json` and extract a **compact projection** with only
   these fields per FR row:
   - `id`, `title`, `risk_zone`, `section_anchor`
   - `text` truncated to 200 chars (full text not needed for planning)
3. Build an in-memory list `frs[]` of compact rows. NFR/UR/VR rows are
   not needed here — `applies-to.json` already summarized them.

If the URS has more than 200 FRs and the compact projection still
exceeds 50 KB after truncation, dispatch a subagent per
`section_anchor` to compute clusters in parallel and merge the results.
(Single-agent v1 path is the default; the fan-out hook is described in
ADR 0003 and is out of scope for this command's first implementation —
emit a `// TODO: fan-out` marker if the threshold is hit.)

---

## Step 2 — Derive Complexity Points

For each FR, compute:

```
tables_touched   ≈ 1 + (count of FR-id co-references in this FR's text)
applies_to_count = applies_to.by_fr[FR.id].length
risk_weight      = 4 - risk_zone     (Z1=3, Z2=2, Z3=1)
dep_count        = number of other FRs this FR depends on (see Step 3)

points = 2 * tables_touched
       + 1 * applies_to_count
       + 1 * risk_weight
       + 1 * dep_count
```

If a project-config.json override exists at
`projectConfig.sprintPlan.weights = { w1, w2, w3, w4 }`, use those
instead of the defaults.

Round to the nearest integer. Minimum points per FR = 1.

---

## Step 3 — Build the Dependency DAG

Two FRs are dependent if **either**:

1. FR-A's text mentions FR-B's id (regex `\bFR-\d+\b`, supports
   `FR-1` through `FR-9999`). Example: `FR-04` named in FR-05's text.
2. FR-A's `section_anchor` is a strict superset path of FR-B's anchor
   (e.g. `approval/decide` depends on `approval/queue`). Use the URS
   author's section ordering as a soft hint — same section + earlier id
   → likely dependency.

Output a `dependencies` map `{ FR-id → [other FR-ids] }`.

If the resulting graph has a cycle, abort with a clear message naming
the cycle members and ask the SA to resolve in `urs/main.md` before
re-running.

---

## Step 4 — Cluster

A cluster is a set of FRs that share enough surface area to ship
together (shared schema, shared persona, shared UI surface). Heuristic:

- Group by `section_anchor` first.
- Within a section, split if the dependency depth between two FRs > 1.
- A cluster's risk zone = max risk zone of its members.
- A cluster's points = sum of member points.

Emit clusters in topological order (no cluster depends on a later one).

---

## Step 5 — Sprint 0: Walking Skeleton

Sprint 0 is fixed and never sized by points. It contains:

- Auth scaffolding (covered by `/foundation:init` baseline — no FR
  needed unless the URS specifies extra auth requirements).
- Tenant onboarding if `multiTenant: true`.
- The single highest-priority FR from the first cluster (by risk zone,
  tiebreaker = lowest id), specced to walking-skeleton depth: happy-
  path only, no edge cases. This proves the schema spine end-to-end.

Sprint 0 has no point budget. Estimated 1 sprint of work regardless.

---

## Step 6 — Pack Sprints

### 6.0 — Tiny-URS short-circuit (FR count < 5)

If the URS has fewer than 5 FRs total, skip clustering and bin-packing.
Place each FR in its own sprint in topological order (Sprint 0 still
takes the walking-skeleton FR; remaining FRs are Sprint 1, Sprint 2,
…). The complexity-points formula still runs and is reported, but does
not drive packing. Skip to Step 7 with this trivial layout.

### 6.1 — Auto-shrink budget for small URS

Before bin-packing, compute total points across all non-Sprint-0 FRs.
If `total_points < 2 * config.budget`, auto-shrink the effective
budget to `max(5, ceil(total_points / 3))` so a small URS still
produces a multi-sprint plan instead of dumping everything into Sprint
1. Record both the original config budget and the effective budget in
`urs/clusters.json` so the SA sees the override.

The `--budget N` flag always wins over auto-shrink.

### 6.2 — Greedy bin-packing

Greedy bin-packing across remaining clusters in topological order:

- Open Sprint 1 with budget = effective_budget (from 6.1, or
  `config.budget` default 13 points).
- Add the first available cluster whose dependencies are all in Sprint 0
  or earlier sprints. If the cluster fits the remaining budget, place
  it. Otherwise close the current sprint and open the next.
- Repeat until all FRs are placed.

If a single cluster exceeds the budget, place it in its own sprint and
note "oversized" in the sprint-plan.md output. The SA can then split
the cluster manually in `urs/main.md` (rename FR ids if needed) and
re-run.

---

## Step 7 — Emit `urs/clusters.json`

```json
{
  "compiled_at": "<ISO 8601>",
  "weights": { "w1": 2, "w2": 1, "w3": 1, "w4": 1 },
  "budget_per_sprint_config": 13,
  "budget_per_sprint_effective": 13,
  "tiny_urs_short_circuit": false,
  "dependencies": { "FR-05": ["FR-04"], "FR-06": ["FR-05"] },
  "clusters": [
    {
      "id": "cluster-1",
      "section_anchor": "registration",
      "frs": ["FR-01", "FR-02", "FR-03"],
      "risk_zone": 1,
      "points": 12
    }
  ]
}
```

`budget_per_sprint_effective` reflects auto-shrink (Step 6.1).
`tiny_urs_short_circuit` is `true` when Step 6.0 fired (< 5 FRs total).

---

## Step 8 — Emit `urs/sprint-plan.md`

Human-readable plan. Format:

```markdown
# Sprint Plan — <project_name> v<version>

Compiled: <timestamp> by /foundation:sprint-plan
Budget per sprint: <N> points (defaults from ADR 0003)

## Sprint 0 — Walking Skeleton

Goal: prove schema spine end-to-end.

| FR | Title | Risk Zone | Points |
|----|-------|:--------:|:------:|
| FR-01 | Submit registration | 1 | (skeleton-depth) |

Notes: auth scaffolding from `/foundation:init` baseline.

## Sprint 1

| FR | Title | Cluster | Zone | Points | Depends On |
|----|-------|---------|:----:|:------:|------------|
| FR-02 | Validate NIK format | registration | 1 | 4 | FR-01 |
| FR-03 | View own status | registration | 1 | 3 | FR-01 |
| FR-04 | Regional review queue | approval | 1 | 6 | FR-01 |

Sprint 1 total: 13 points.

(repeat per sprint)

## Risks and Notes

- Oversized clusters: <list any>
- Cycles detected: <none, or list>
- `applies_to: ["*"]` warnings carried over from compile: <count>
```

Write the file. Do not overwrite a hand-edited section if it begins with
a `<!-- editor: keep -->` HTML comment — preserve that block verbatim
and append everything else.

---

## Step 9 — Reconcile `project-state.md`

For each FR, write a `Sprint` column entry indicating its sprint number.
If the column does not exist yet, add it after `Zone`. Do not overwrite
existing maturity values.

---

## Step 10 — Summary Output

Print:

```
Sprint Plan — <project_name> v<version>
Sprints: N
Total FRs: M
Total points (excl. Sprint 0): P
Oversized clusters: K
Cycles: 0 | <list>

Files written:
  urs/clusters.json
  urs/sprint-plan.md
  .claude/docs/project-state.md (modified — Sprint column)

Warnings: <if any>
```

---

## ✅ What's Next

Tell the user:

"Sprint plan written. Start Sprint 0 by running
`/foundation:shape-spec --from-urs <highest-priority-FR>` for the
walking-skeleton FR. After Sprint 0 ships, return here and re-run
`/foundation:sprint-plan` to refine subsequent sprints from observed
velocity."

```
COMMAND_COMPLETE: foundation:sprint-plan
STATUS: success
FILES_CREATED: urs/clusters.json, urs/sprint-plan.md
FILES_MODIFIED: .claude/docs/project-state.md
NEXT_COMMAND: /foundation:shape-spec --from-urs <FR-XX>
```
