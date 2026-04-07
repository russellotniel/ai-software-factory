# /deployment:release

Guide through a production release: verify staging, confirm scope, walk
through the deploy gate.

This command does not push tags or deploy. Semantic-release handles tagging
automatically. This command ensures the human verifies the right things first.

**Preconditions:**
- `.claude/project-config.json` must exist (run `/foundation:init`)
- Kubernetes manifests should exist (run `/deployment:k8s-config`)

Read before starting:

- `.claude/project-config.json` — project context, riskZones, governanceMode, regulated
- `.claude/docs/deployment-os/release-process.md`
- `.claude/docs/project-state.md` — feature stages

---

## Step 0 — Governance Gates

Before the manual pre-release checklist, run automated governance checks.

### Gate 1: Spec Coverage
For every feature with stage `implementation` or later in project-state.md:
- Verify a spec file exists at `.claude/docs/specs/{feature-name}.md`
- Result: ✅ pass | ❌ "{feature-name} has no spec"

### Gate 2: Test Coverage
For every feature with stage `implementation` or later:
- Search for test files containing `// @spec: {feature-name}`
- Result: ✅ pass | ❌ "{feature-name} has no linked tests"
- **Pre-traceability detection:** If a feature's implementation files (actions.ts,
  schemas.ts, _components/) do NOT contain `// @spec:` comments either, the feature
  predates the traceability convention. In that case, emit ⚠️ warning (not ❌ failure):
  `⚠️ "{feature-name}" predates @spec convention — tests exist but lack traceability tags`
- Only emit ❌ if the feature's source files HAVE `// @spec:` tags but no test files do

### Gate 3: Review Status
For every feature with stage `implementation` or later:
- Check that the feature's stage is `reviewed` or `shipped`
- Result: ✅ pass | ❌ "{feature-name} has not been reviewed (stage: {current-stage})"

### Gate 4: Migration Security
Search all migration files in `supabase/migrations/`:
- For every `CREATE TABLE` statement, verify a corresponding
  `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` exists in the same file
- For every `CREATE TABLE` statement, verify at least one `CREATE POLICY` exists
- Result: ✅ pass | ❌ "Migration {filename}: table {name} has no RLS"

### Gate 5: Zone 1 Coverage (if riskZones configured)
For files matching Zone 1 (critical) paths in `project-config.json`:
- Verify these files have corresponding test files
- Result: ✅ pass | ⚠️ "Zone 1 file {path} has no corresponding test file"

### Gate Report

Display:

```
Governance Gates: {passing} of {total} passing

  ✅ Gate 1: Spec Coverage — all features have specs
  ✅ Gate 2: Test Coverage — all features have linked tests
  ❌ Gate 3: Review Status — 1 feature not reviewed
     → "new-feature" is at stage "tested", needs review
  ✅ Gate 4: Migration Security — all tables have RLS
  ⚠️ Gate 5: Zone 1 Coverage — 1 warning
     → src/lib/auth/server.ts has no test file (pre-traceability)

Blockers: 1
  → Run /architecture:review or /implementation:review on "new-feature"
```

### Gate Mode

Read `project-config.json`:
- If `governanceMode` is set: use that value (`"blocking"` or `"advisory"`)
- Else if `regulated: true`: gates are **blocking** — do not proceed to Step 1 until all ❌ gates pass (⚠️ warnings are allowed)
- Else: gates are **advisory** — show the report and let the user decide

Ask: "Governance report above. Proceed to pre-release checks?"
(If blocking mode and ❌ failures exist: "All gates must pass before proceeding — fix blockers first.")

---

## Step 1 — Pre-release checks

Ask the user to confirm each:

- [ ] All features for this release are merged to `main`
- [ ] Latest `main` CI is green (GitHub Actions → staging.yml → release job)
- [ ] E2E tests passed on the most recent PR to `main`
- [ ] Staging manually verified for any significant changes
- [ ] `CHANGELOG.md` reflects expected scope
      (`cat CHANGELOG.md | head -60`)
- [ ] No new env variables added without updating Kubernetes ConfigMaps/Secrets

---

## Step 2 — Identify release scope

Show commits since last tag:

```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

Summarise:

- `feat:` commits → minor bump
- `fix:` commits → patch bump (minor wins if both present)
- `BREAKING CHANGE` → major bump
- Expected version based on current tag

Ask: "Does this scope look right?"

---

## Step 3 — Release tag

Semantic-release runs automatically on merge to `main`.
Check if the tag was already created:

```bash
git fetch --tags
git describe --tags --abbrev=0
```

If it exists, show the tag and move to Step 4.
If not yet created, advise: "Check GitHub Actions → staging.yml → release job.
It will create the tag automatically if commits warrant a release."

---

## Step 4 — Production deploy gate

Once the tag exists, `production.yml` fires automatically:

1. GitHub Actions → production.yml → find the triggered run
2. `deploy-production` job requires manual approval
   (configured via the `production` GitHub Environment)
3. Verify the image tag matches the release version
4. Approve the deploy
5. Watch rollout: `kubectl rollout status deployment/nextjs-app -n app-production`
6. Confirm smoke test passed: `/api/health` returning 200

---

## Step 5 — Post-release

- [ ] Manually verify one or two key flows on production
- [ ] Watch error monitoring for 10 minutes post-deploy
- [ ] If something is wrong: assess hotfix vs rollback before acting
      (see `.claude/docs/deployment-os/release-process.md` — Rollback section)

---

## ✅ What's Next

Tell the user:

"Release complete. You're shipped.

- **If there are more features to build:** loop back to `/foundation:shape-spec`
- **If this was a hotfix:** make sure the hotfix PR to `dev` is also merged"

```
COMMAND_COMPLETE: deployment:release
STATUS: success
NEXT_COMMAND: /foundation:status (to start next feature) OR done
```
