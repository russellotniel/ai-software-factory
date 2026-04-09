# /qa:fix

Run the test suite, read failures, fix the source, re-run until green.
Works for Vitest (unit/component) and Playwright (E2E).

Read `qa-os/strategy.md` if you need context on the test setup.

---

## Process

### Step 1 — Run tests

Ask: "Which tests should I run?"

- All unit tests: `npm test`
- Specific feature: `npm test -- src/features/{domain}/`
- E2E only: `npm run test:e2e`
- Specific E2E spec: `npm run test:e2e -- e2e/{spec}.spec.ts`

Run the command. Read the full output.

### Step 2 — Triage failures

For each failure:

1. Read the error and stack trace
2. Identify: is this a bad test (wrong assertion, stale mock) or a real bug?
3. For E2E failures: check `test-results/` for screenshots. View them to
   understand what the browser actually saw at the point of failure.

Never fix the test to hide a real source code bug.
Never change an assertion to match wrong behaviour.

### Step 3 — Fix

Fix one failure at a time, starting with the most fundamental.
After each fix, explain: what was wrong, why the fix is correct, and
whether this was a test issue or a source code bug.

### Step 4 — Re-run and repeat

Re-run after each fix. Continue until all tests pass.

### Step 5 — Final check

When all targeted tests pass, run the full suite to confirm no regressions:

```bash
npm test
```

Report: tests passed, tests skipped, coverage summary if available.

---

## ✅ What's Next

Tell the user:

"Tests green. Choose your next step:

- **If there are more features to build:** run `/foundation:shape-spec` for the next feature
- **If all features are done and you're ready to ship:** run `/deployment:k8s-config` to generate Kubernetes manifests"

```
Next command: /foundation:shape-spec   (if more features to build)
         OR: /deployment:k8s-config    (if ready to ship)
```
