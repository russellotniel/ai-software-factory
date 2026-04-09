# Review Checklist

Run this checklist before finalizing any output or handoff.
If any item fails, fix it before proceeding.

## Universal pre-handoff self-check

- [ ] Did I solve the requested problem as specified?
- [ ] Did I load context in the correct order (layers 1–7)?
- [ ] Did I declare all assumptions explicitly?
- [ ] Did I violate any rule in the Human Intent OS?
- [ ] Did I operate within my current maturity level?
- [ ] Is my output usable by the next agent without clarification?
- [ ] Did I leave any hidden risk unmentioned?
- [ ] Would another engineer understand my reasoning within 10 minutes?
- [ ] Did I touch any protected file? If yes, did I escalate?
- [ ] Are all naming conventions consistent and descriptive?
- [ ] Did I apply negative space / guard clauses where applicable?
- [ ] Are tests present for every new behavior?
- [ ] Is documentation updated to reflect every change?
- [ ] Are there no hardcoded secrets or credentials in any output?
- [ ] Does my output comply with the active specification?

## Code-specific additions

- [ ] Lint passes with zero errors
- [ ] No `any` types without documented justification (TypeScript)
- [ ] No `console.log` left in production code paths
- [ ] All async operations have error handling
- [ ] All external calls have retry logic
- [ ] RLS is enabled on any new database table
- [ ] `requireAuth()` is the first call in every Server Action

## Verdict

If all items pass: proceed to handoff.
If any item fails: fix, re-check, then hand off.
Never hand off a checklist with known failures.
