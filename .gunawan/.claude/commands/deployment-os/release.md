# /deployment:release

Guide through a production release: verify staging, confirm scope, walk
through the deploy gate.

This command does not push tags or deploy. Semantic-release handles tagging
automatically. This command ensures the human verifies the right things first.

Read `deployment-os/release-process.md` before starting.

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
      (see `deployment-os/release-process.md` — Rollback section)

---

## ✅ What's Next

Tell the user:

"Release complete. You're shipped.

- **If there are more features to build:** loop back to `/foundation:shape-spec`
- **If this was a hotfix:** make sure the hotfix PR to `dev` is also merged"

```
Next command: /foundation:shape-spec   (to start the next feature)
```
