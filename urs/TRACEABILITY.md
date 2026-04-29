# Traceability Matrix — SIM Registration Portal

> Auto-generated snapshot. Regenerate by re-running `/foundation:urs` followed by
> `grep -rln "FR-XX" urs/ supabase/ src/ tests/ .claude/docs/specs/ .claude/docs/project-state.md .claude/docs/architecture-os/api-contracts.md`.

URS version: 0.1 (draft) · Compiled: 2026-04-29

---

## How to read this

Each URS requirement has a row. The columns show which artifact types reference
the requirement via the `@urs:` tag (or equivalent). A green dot means the
artifact exists; a dash means it has not been generated yet.

| Column          | What it points to                                                            |
|-----------------|------------------------------------------------------------------------------|
| URS source      | `urs/main.md` · `urs/main.tex` · `urs/index.json`                            |
| Backlog         | `.claude/docs/project-state.md`                                              |
| Spec            | `.claude/docs/specs/{feature}.md`                                            |
| Migration       | `supabase/migrations/{ts}_{feature}.sql`                                     |
| API contract    | `.claude/docs/architecture-os/api-contracts.md` (Project Contracts section)  |
| Implementation  | `src/features/{domain}/{schemas.ts, actions.ts, _components/}`               |
| Unit tests      | `src/features/{domain}/*.test.ts`                                            |
| E2E             | `tests/e2e/*.spec.ts`                                                        |

---

## Functional Requirements

| URS ID | Title                       | Zone | URS source | Backlog | Spec | Migration | API contract | Implementation | Unit tests | E2E |
|--------|-----------------------------|:----:|:----------:|:-------:|:----:|:---------:|:------------:|:--------------:|:----------:|:---:|
| FR-01  | Submit registration         |  1   |     ●      |    ●    |  ●   |     ●     |      ●       |       ●        |     ●      |  ●  |
| FR-02  | Validate NIK format         |  1   |     ●      |    ●    |  —   |     ●     |      ●       |       ●        |     ●      |  ●  |
| FR-03  | View own status             |  1   |     ●      |    ●    |  —   |     —     |      —       |       —        |     —      |  —  |
| FR-04  | Regional review queue       |  1   |     ●      |    ●    |  —   |     ●     |      —       |       —        |     —      |  —  |
| FR-05  | Approve registration        |  1   |     ●      |    ●    |  —   |     —     |      —       |       —        |     —      |  —  |
| FR-06  | Reject registration         |  1   |     ●      |    ●    |  —   |     —     |      —       |       —        |     —      |  —  |
| FR-07  | Cross-regional dashboard    |  2   |     ●      |    ●    |  —   |     —     |      —       |       —        |     —      |  —  |
| FR-08  | CSV export                  |  2   |     ●      |    ●    |  —   |     —     |      —       |       —        |     —      |  —  |
| FR-09  | View audit log              |  1   |     ●      |    ●    |  —   |     —     |      —       |       —        |     —      |  —  |

(FR-02 and FR-04 are inline-validated in the FR-01 migration but do not yet
have their own specs / standalone implementations — the format check is
inside `submit_registration` and the queue is satisfied by RLS.)

## Non-Functional Requirements

| URS ID  | Title                       | Zone | Applied where                                                           |
|---------|-----------------------------|:----:|-------------------------------------------------------------------------|
| NFR-01  | NIK and KK encryption       |  1   | Migration (private.encrypt_pii) · Schema · Action (no PII in logs) · Test (NFR-01 explicit assertion) |
| NFR-02  | Append-only audit log       |  1   | Future migration for FR-05 / FR-06                                      |
| NFR-03  | Approval latency (2s p95)   |  2   | Future SLO + load test for FR-05                                        |
| NFR-04  | Business-hours uptime       |  2   | Deployment OS (k8s HPA, readiness probes)                               |
| NFR-05  | Selfie retention 30 days    |  2   | Future Supabase Storage lifecycle rule                                  |

## User Role Requirements

| URS ID | Role     | Zone | Enforced where                                                          |
|--------|----------|:----:|-------------------------------------------------------------------------|
| UR-01  | Customer |  1   | RLS policies `customer_select_own`, `customer_insert_own` · E2E cross-customer isolation test |
| UR-02  | Dealer   |  1   | RLS policy `dealer_select_region`                                       |
| UR-03  | Admin    |  2   | RLS policy `admin_select_all`                                           |
| UR-04  | Auditor  |  1   | Future audit-log SELECT policy (FR-09)                                  |

## Validation & Audit Requirements

| URS ID | Title                          | Zone | Enforced where                                                         |
|--------|--------------------------------|:----:|------------------------------------------------------------------------|
| VR-01  | Every decision is logged       |  1   | Future trigger or RPC body for FR-05 / FR-06                           |
| VR-02  | Rejection reason required      |  1   | DB CHECK constraint `rejection_reason_required_when_rejected`          |
| VR-03  | No re-decide                   |  1   | Future RPC `decide_registration` will assert pending status            |
| VR-04  | PII masking on export          |  2   | Future CSV export RPC (FR-08)                                          |

---

## Risk Zone Distribution

| Zone                | Requirements | Coverage status         |
|---------------------|:------------:|-------------------------|
| Zone 1 (Critical)   |      15      | 1 of 9 FR fully shipped through pipeline; Zone 1 strict test strategy applied (property-based, PII safety, RLS isolation) |
| Zone 2 (Standard)   |       7      | 0 of 2 FR shipped; deferred to v2                                                                                          |
| Zone 3 (Presentational) |   0      | n/a                                                                                                                        |

---

## Release Gate Status (preview of `/deployment:release`)

This is what `/deployment:release` would show today:

```
Gate 1 — Spec coverage:        9/9 backlog rows have spec links     [⚠ 1/9 spec exists, 8/9 stub only]
Gate 2 — Test coverage:        FR-01 has unit + e2e ✓              [⚠ 8/9 untested]
Gate 3 — Review status:        no features marked reviewed          [— advisory only]
Gate 4 — Migration security:   1 migration, RLS in same file ✓     [PASS]
Gate 5 — Zone 1 coverage:      1/9 Zone-1 features shipped         [⚠ blocking under regulated:true]

Verdict: BLOCKED — regulated mode requires every C-rank URS req to ship with
strict tests before release. 8 features remain.
```

(Single feature pre-bake by design — the demo shows the pipeline working on
FR-01 end-to-end; the remaining 8 features are the natural backlog the team
would continue working through after the workshop.)
