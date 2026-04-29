# XLSmart Coaching Session — Working Plan

**This file is the resume document for the work on the `xlsmart-coaching` branch.**
After any `/clear`, read this file first to recover full state, then continue.

---

## Mission

Coaching session for one Telco (XLSmart) viewer, 15–20 min, mixed
presentation/workshop/demo. Goal: showcase the AI Software Factory and ideally
get adoption.

The viewer asked whether the factory covers end-to-end AI-assisted SDLC:
**BRD → test cases → code scaffolding → post-deploy monitoring.**

Our answer:
- BRD piece → reframed as **URS** (User Requirement Specification — what their
  template actually is, regulated-industry style with C/I/D rank).
- Test cases + code scaffolding → already covered by existing factory commands.
- Post-deploy monitoring → out of scope to *replace* Datadog/Prometheus, but in
  scope to *generate the monitoring contract* (instrumentation, SLOs, dashboards,
  alerts) from the spec. Sketch as roadmap, not built for this session.

## Deadlines

- **Soft target:** tonight (2026-04-29) by 23:00 — end of work session.
- **Hard deadline:** 2026-04-30 at 16:00 — coaching session begins.

## Branch

`xlsmart-coaching` — branched from `main`. Work directly here. Commit
incrementally with focused messages, sign with Co-Authored-By: Claude Opus 4.7.

## Demo project

**SIM Registration Portal.** Indonesian PP / Kominfo regulation requires every
prepaid SIM to register with NIK + KK. Universally recognizable for a telco
audience. Has natural compliance + audit + multi-role + approval-workflow
features → exercises every governance feature the factory has.

Stack: Next.js 16 + Supabase (factory default).

## Demo concept

Two bands of demo content:

1. **Pre-baked band** — URS authored, 3 features shipped through full pipeline
   (FR-01 submit registration, FR-03 dealer approval, VR-01 audit log). Walk
   through artifacts. Ends with `grep FR-XX` traceability moment as the climax.
2. **Live band** — one small feature run end-to-end during the session. Decided
   in Phase 6.

Wow moment: `grep -r "FR-03" .` shows the URS ID threaded through URS doc, spec,
migration, code, test, release gate output. Auto-generated traceability matrix.

## Architecture (already decided — don't re-litigate)

See ADR 0001 and ADR 0002 in `.claude/docs/adr/`.

Key facts to remember:

- URS source is `urs/main.md` (Markdown, structured, factory-editable).
- Compiled to `urs/main.tex` (formal, signed, legal artifact) using
  `latex_template/main.tex` as layout.
- `urs/index.json` is the downstream contract — every command after URS reads
  this, never the LaTeX or Markdown directly.
- `project-state.md` is the engineering ledger; it links to URS IDs but does
  NOT store requirement text. Joined by URS ID.
- C/I/D rank → Risk Zone 1/2/3 mapping is automatic, applied to
  `project-config.json#riskZones` by `/foundation:urs`.
- URS IDs: `FR-`, `NFR-`, `UR-`, `VR-` prefixes, unique across doc.
- Bold title in Requirement cell (`**Submit registration**: ...`) becomes the
  short label in `index.json`.
- Sign-off + status in YAML front-matter; status moves `draft → reviewed → signed`.

## Build vs pre-bake vs roadmap split (already decided)

**Build:**

1. ADR 0001 + 0002 ✅ done
2. `/foundation:urs:draft` — brief → `urs/main.md` skeleton with FR/NFR/UR/VR.
3. `/foundation:urs` — compile/lock: `main.md` → `main.tex` + `index.json`,
   reconcile `project-state.md`, map C/I/D → Risk Zone in `project-config.json`.
4. Tiny extension to `/foundation:shape-spec` to accept `--from-urs FR-XX` flag.

**Pre-bake (using existing factory commands, find friction along the way):**

- 1-page brief for SIM Registration Portal.
- Run `urs:draft` → real `urs/main.md`.
- Hand-edit a few rows (visible in git history — the SA review moment).
- Run `/foundation:urs` → `main.tex` + `index.json` + project-state seeded + risk
  zones mapped.
- Run `/foundation:shape-spec --from-urs FR-01`, `FR-03`, `VR-01` → specs.
- Run `/architecture:new-feature` for each → migrations + RPC + API contracts.
- Run `/implementation:new-feature` for each → Server Actions + Zod + components.
- Run `/qa:new-tests` for each → test scaffolds.
- Run `/deployment:release` dry-run → see gates including new C-rank coverage.

**Roadmap (do NOT build, sketch in talk):**

- Extending `discover`/`plan`/`shape-spec` to write to URS source (full
  co-production architecture). Multi-day refactor with risk.
- `/observability:setup` — generate OTel + SLO + dashboard + alerts from spec.
- `/observability:incident-to-spec` — close the post-deploy feedback loop.

## URS contents (sketched, finalize during draft)

```
FR-01 (C)  Customer can submit SIM registration with NIK + KK + selfie
FR-02 (C)  System validates NIK format (16 digits, Dukcapil schema)
FR-03 (C)  Dealer can approve or reject pending registrations in their region
FR-04 (C)  On approve, SIM is activated and audit log entry is written
FR-05 (I)  Admin can view all registrations across regions
FR-06 (D)  Admin can export registration report as CSV

NFR-01 (C) NIK encrypted at rest (AES-256)
NFR-02 (I) Approval action completes within 2s p95
NFR-03 (I) Audit log is append-only, never deleted

UR-01      Customer: submit own, view own status
UR-02      Dealer: approve/reject within assigned region
UR-03      Admin: view all, run reports
UR-04      Auditor: read-only access to audit log

VR-01 (C)  Every approval/rejection writes audit log entry with actor + timestamp
VR-02 (C)  NIK changes after approval require dual approval
VR-03 (I)  Rejected registrations must include a reason
```

Result: 3 C-rank → Zone 1, 4 I-rank → Zone 2, 1 D-rank → Zone 3.

## Phases — status and check-in points

After each phase: commit, update this file's "Current state" section, mark task
completed, **check in with the user**. User wants check-ins at phase boundaries.

### Phase 1 — Architecture ✅ DONE

Output:
- `.claude/docs/adr/0001-urs-project-state-separation.md`
- `.claude/docs/adr/0002-urs-source-format.md`

Commit: `b8c805a docs: ADR 0001 + 0002 for URS architecture`

### Phase 2 — Build `/foundation:urs:draft`

Goal: command that takes a 1-page product brief and emits `urs/main.md`
skeleton with FR/NFR/UR/VR rows + ranks + user matrix + glossary.

Inputs: path to brief markdown file (or interactive Q&A).

Behavior:
1. Read brief or run interactive discover-style Q&A to gather: product name,
   target users + roles, modules/features, regulatory drivers, key constraints.
2. Produce a draft `urs/main.md` with:
   - YAML front-matter (project name, code, version=0.1, status=draft).
   - Project Detail narrative (4 subsections from brief).
   - User Matrix (modules × roles).
   - Functional / Non-functional / User Role / Validation tables (proposed reqs
     with proposed C/I/D rank — SA reviews and adjusts).
   - Glossary (acronyms detected from brief).
3. Print summary of what was generated, ask SA to review the .md before running
   `/foundation:urs`.

Done when: command file `.claude/commands/foundation/urs-draft.md` exists,
follows existing command file format, has clear preconditions/steps/outputs/
COMMAND_COMPLETE block.

Reference command files for style: `.claude/commands/foundation/plan.md`,
`.claude/commands/foundation/discover.md`, `.claude/commands/foundation/shape-spec.md`.

Commit message style: `feat(foundation): add /foundation:urs:draft command for AI-assisted URS authoring`.

### Phase 3 — Build `/foundation:urs`

Goal: compile/lock command that turns `urs/main.md` into the formal artifact
set and seeds project-state.

Inputs: presence of `urs/main.md`.

Behavior:
1. Parse `urs/main.md` (YAML front-matter + Markdown tables).
2. Validate invariants from ADR 0002 (column count, unique IDs, rank values).
3. Compile to `urs/main.tex` using `latex_template/main.tex` as layout.
   Substitution by section heading.
4. Emit `urs/index.json` per ADR 0002 schema, with `risk_zone` derived from rank.
5. Reconcile with `.claude/docs/project-state.md`:
   - For each URS req, ensure a backlog row exists with `urs_ref`, `risk_zone`,
     and `maturity` (default `🔲 Pending`).
   - Flag URS reqs without backlog rows; flag backlog rows with broken
     `urs_ref` links.
6. Update `.claude/project-config.json#riskZones` if the file exists, mapping
   C/I/D to Zone 1/2/3 with the URS IDs in each zone.
7. Print summary: req counts by class and rank, zone distribution, drift report,
   files written.

Done when: command file `.claude/commands/foundation/urs.md` exists, follows
existing format, has clear preconditions/steps/outputs/COMMAND_COMPLETE block.

Commit message style: `feat(foundation): add /foundation:urs compile/reconcile command`.

### Phase 4 — Wire `--from-urs` into `shape-spec`

Goal: small extension to `/foundation:shape-spec` so `--from-urs FR-03` reads
the URS row from `urs/index.json` and pre-fills the spec scaffold.

Behavior:
1. Add a "Step 0 — Optional URS Lookup" section to `shape-spec.md` that, if
   the user invokes with `--from-urs FR-XX`, reads `urs/index.json`, finds the
   matching req, and uses `title`, `text`, `rank`, and `risk_zone` to seed the
   spec.
2. Stamp `@urs: FR-XX` into the spec front-matter alongside `@spec`.

Done when: `shape-spec.md` modified, `@urs:` stamping conventions added.

Commit message style: `feat(foundation): shape-spec --from-urs flag for URS-driven spec seeding`.

### Phase 5 — Pre-bake SIM Registration Portal demo

Goal: actually run the pipeline on the demo project. Find friction. Fix. Have
artifacts ready for the coaching session.

Steps:
1. Write 1-page brief at `urs/brief.md`.
2. Run `/foundation:urs:draft` → produce `urs/main.md`. (If `/foundation:init`
   has not been run on this branch, may need to run that first or write a
   minimal `project-config.json` by hand for the demo project.)
3. Review and edit `urs/main.md` to match the URS contents block above. Commit
   the edits separately ("SA review" moment for the demo).
4. Run `/foundation:urs` → verify `main.tex`, `index.json`, project-state
   seeded, risk zones mapped.
5. For FR-01, FR-03, VR-01:
   - `/foundation:shape-spec --from-urs FR-XX` → spec.
   - `/architecture:new-feature` → migration + RPC + API contract.
   - `/implementation:new-feature` → Server Action + Zod + component.
   - `/qa:new-tests` → tests.
6. `/deployment:release` dry-run → gate output, including C-rank URS coverage.
7. Verify the `grep -r "FR-03" .` traceability moment works as expected.
   May need to ensure `@urs:` tags are stamped consistently.

Done when: artifacts exist, traceability grep works, demo can be walked
through end-to-end.

Commit cadence: one commit per major step (URS, each feature, release dry-run).

### Phase 6 — Live feature + dry-run

Goal: pick the live demo feature, prepare prompts, do an end-to-end timed
dry-run.

Candidates for live:
- Customer views own registration status (safer — read-only with RLS).
- FR-06 Admin CSV export (more wow but riskier).

Decide with user. Prepare the exact prompts in scrollback. Time the dry-run.
Adjust the demo feature scope if it runs over.

Done when: live feature plan exists, prompts ready, demo timed under 15 min.

---

## Current state

| Phase | Status | Last commit |
|-------|--------|-------------|
| 1. Architecture (ADRs) | ✅ done | b8c805a |
| 2. /foundation:urs:draft | ✅ done | 2bc1ce0 |
| 3. /foundation:urs | ✅ done | bde797d |
| 4. shape-spec --from-urs + @urs propagation | ✅ done | 43f08fd, a2027e0 |
| 5. Pre-bake demo (artifacts) | ✅ done | 1ce44eb |
| 5b. Path B real build (typecheck + tests + dev server) | ✅ done | 0e62ffc |
| 5c. Path A — actual Supabase integration | ⏳ tomorrow morning | — |
| 6. Live feature + dry-run | ⏳ pending | — |

**Phase 5b outcome (committed in 0e62ffc):**

The SIM Registration Portal is now a real running Next.js application:

- `npm run typecheck` clean
- `npm test` for FR-01: **15/15 passing** (8 schemas, 7 actions, including
  fast-check property-based and NFR-01 PII-safety)
- `npm run dev` boots in <1s
- `/login` renders the real sign-in form
- `/register` correctly meta-refreshes to `/login` when unauthenticated
- `/dashboard` same auth gate
- Root `/` redirects based on session

What's still not runnable end-to-end (Path A tomorrow):
- Actual SIM submission requires Supabase running locally
- Need Docker daemon started + `supabase` CLI installed
- Then `supabase start` → `supabase db reset` → app flows end-to-end

**Phase 5c plan for tomorrow morning (Path A):**

1. User starts Docker, installs `supabase` CLI (or uses `npx supabase`).
2. Run `supabase start` (downloads images first time, ~3–5 min).
3. Run `supabase db reset` to apply both migrations.
4. Run `supabase gen types typescript --local > src/types/database.ts` to
   replace the hand-stub.
5. Sign up a test customer through `/signup`.
6. Update profile to set `region_code` (via Studio or SQL).
7. Visit `/register`, submit, verify row in `registrations` with
   encrypted NIK/KK.
8. Run E2E tests against the live app: `npm run test:e2e`.

Risk: any of steps 2–4 could hit a friction point. Have ~2 hours buffer
before the 16:00 coaching session.

**Live feature decision pending. Candidates listed in the conversation
(FR-03, FR-04, FR-09, FR-08, FR-05). Lean: FR-04.**

**Phase 5 outcome:**

FR-01 (submit-registration) is fully through the pipeline:
- urs/brief.md → urs/main.md → urs/main.tex + urs/index.json
- .claude/docs/specs/submit-registration.md (with @urs: FR-01 front-matter)
- supabase/migrations/20260429220000_submit_registration.sql (with @urs: header,
  pgcrypto encryption helpers, registrations table, 4 RLS policies, RPC
  submit_registration)
- .claude/docs/architecture-os/api-contracts.md (Project Contracts section)
- src/features/registrations/{schemas.ts, actions.ts, _components/SubmitRegistrationForm.tsx}
- src/features/registrations/{schemas.test.ts, actions.test.ts}
- tests/e2e/submit-registration.spec.ts
- urs/TRACEABILITY.md (matrix snapshot for the talk)

Wow-moment grep verified: `grep -rln "FR-01" urs/ supabase/ src/ tests/ .claude/docs/specs/ .claude/docs/project-state.md .claude/docs/architecture-os/api-contracts.md` returns 13 files across every SDLC phase.

Other 8 features (FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09)
remain as 🔲 Pending in project-state.md — by design. The demo shows ONE
feature fully, and the backlog table proves the same pipeline produces the
rest. Doing all 9 would be theatre, not value.

**Friction notes captured during Phase 5 (for factory hardening later):**

1. project-config.json is gitignored — re-init on a branch that's already
   mid-flow needs a documented "reset" path.
2. The implementation command's example destructures `tenantId` even on
   single-tenant projects. Should be conditional on `multiTenant`.
3. api-contracts.md was a global standards doc with no per-project section.
   The factory should ship it with a "Project Contracts" header pre-stubbed.
4. The spec's "RPC triggers audit_log insert" was confused — VR-01 only
   covers approve/reject. The shape-spec command could check VR rules
   against the proposed RPC behavior and flag mismatches.
5. NFR/UR/VR don't fit as standalone backlog rows; they're constraints
   applied to FR rows. Documented this in project-state.md but the factory's
   project-state schema should formalize "constraint" rows separately.
6. The qa command's mock examples don't show sequential RPC failure cases
   (mockResolvedValueOnce). Worth a worked example.

**Next action:** Phase 6 — pick + prep live feature, dry-run timing.

**Note discovered in Phase 3:** `project-config.json#riskZones` already exists
but is **path-based** (file globs), not requirement-based. Different concept.
Decision: do NOT touch the path-based key. URS-driven zone is per-requirement,
stored in `urs/index.json` and per-feature in `project-state.md`. The two
concepts coexist.

**Note for Phase 5 pre-bake:** existing `project-state.md` schema (from
plan.md / shape-spec.md / new-feature.md) uses columns `# | Feature | Status |
Depends On | Spec` plus `Stage` and a `Feature Timeline`. URS reconciliation
adds `urs_ref` and `risk_zone` columns. Watch for friction during pre-bake —
may need to reconcile schemas or simplify.

**Phase 4 actually completed in two commits:**
- `43f08fd` — shape-spec --from-urs flag + spec template YAML front-matter
- `a2027e0` — @urs propagation across architecture/implementation/qa commands;
  qa risk_zone now prefers URS-derived value from spec front-matter

**Next action:** Start Phase 5 (pre-bake the SIM Registration Portal demo).

Pre-bake plan:
1. Decide where the demo project files live in this repo (since we're working
   directly in the factory, not creating a separate project). Likely `urs/` for
   the URS artifacts at repo root, and skip the actual Next.js app — the wow
   moment is the `grep` traceability across SPECS and command outputs, which we
   can demonstrate without a runnable app.
2. Write a 1-page brief at `urs/brief.md` describing SIM Registration Portal.
3. Either run /foundation:urs:draft against it OR hand-author urs/main.md
   directly using the brief + the URS contents block in this plan.
4. Run /foundation:urs to compile main.tex + index.json + reconcile project-state.
5. Run /foundation:shape-spec --from-urs FR-01, FR-03, VR-01 — produce specs.
6. Run /architecture:new-feature for each — produce migrations + RPCs.
7. Run /implementation:new-feature for each — produce schemas/actions/components.
   (May or may not actually write to src/features/ — depends on whether we want
   a runnable app. Decision: write to `demo/sim-registration/src/features/` so
   we have artifacts to grep without polluting the factory's own src/.)
8. Run /qa:new-tests — produce tests.
9. Run /deployment:release dry-run — produce gate output.
10. Test the grep moment: grep -r "FR-03" .

**Important friction note:** the factory's existing project-state.md schema
(plan.md / shape-spec.md / new-feature.md) doesn't have urs_ref or risk_zone
columns. /foundation:urs is supposed to add them when reconciling. During
pre-bake, watch for whether this works cleanly or needs a smaller fix.

**Decision for pre-bake:** since this repo has no `.claude/docs/project-state.md`
yet (it's the factory itself, not a project), the demo will create it from
scratch via /foundation:urs reconciliation. That actually exercises the
"create from scratch" code path.

## Open questions

- Live feature decision (Phase 6).
- Whether the demo needs an actual runnable Next.js project or just artifacts
  is sufficient. Lean toward artifacts-only for time.
- Whether to also run `/foundation:init` on this branch (might be needed before
  `/foundation:urs` works because reconciliation reads `project-config.json`).
  Decision: try without; add only if needed.

## Existing factory structure (quick map)

- `.claude/commands/foundation/` — command files (init, discover, plan, shape-spec, status, validate, inject-standards)
- `.claude/commands/architecture-os/` — new-feature, review
- `.claude/commands/implementation-os/` — new-feature, review
- `.claude/commands/qa-os/` — new-tests, fix
- `.claude/commands/deployment-os/` — k8s-config, release
- `.claude/commands/design-os/` — import, system
- `.claude/docs/standards-index.yml` — keyword → standards file mapping
- `.claude/docs/foundation/` — product-mission, principles, tech-standards, auth-model, mcp-setup, compliance-standards
- `.claude/docs/architecture-os/` — schema-conventions, rpc-standards, api-contracts, audit-trail, system-design
- `.claude/docs/implementation-os/standards.md`
- `.claude/docs/data-fetching-os/` — caching-strategy, server-vs-client
- `.claude/docs/qa-os/strategy.md`
- `.claude/docs/deployment-os/` — ci-cd, environments, release-process, k8s-sizing
- `.claude/docs/specs/_template.md`
- `.claude/docs/adr/` — new, 0001 + 0002
- `latex_template/main.tex` — formal URS layout (input to compiler)
- `urs/` — does not exist yet, will be created in Phase 5

## Commit conventions

- Branch: `xlsmart-coaching` (no PRs, just push when complete).
- Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
- Conventional commit prefixes: `docs:`, `feat(scope):`, `fix(scope):`,
  `chore:`. Match what's already in the repo's history.

## Recovery checklist after `/clear`

1. Read this file (`.claude/coaching-session-plan.md`).
2. Run `git log --oneline xlsmart-coaching ^main` to see what's already done.
3. Check task list (TaskList tool).
4. Read the most recent commit's diff if needed.
5. Read the relevant ADR or command file the next phase touches.
6. Continue from "Current state" section.

Do NOT re-read the entire conversation history — this file is the source of truth.
