# Software Engineer — Pre-Handoff Checklist

Before handing off to QA Reviewer:

- [ ] Implementation plan was approved before coding began
- [ ] All acceptance criteria from the specification are implemented
- [ ] All naming conventions are consistent and descriptive
- [ ] Negative space / guard clauses applied throughout
- [ ] Retry logic implemented for all external calls
- [ ] `requireAuth()` is the first call in every Server Action
- [ ] `safeParse()` used for all input validation — never `parse()`
- [ ] `ActionResult<T>` returned from all Server Actions — never throw
- [ ] `'use client'` only on leaf components
- [ ] No service_role keys in client-side code
- [ ] No `unstable_cache` usage
- [ ] RLS enabled on every new table in the same migration
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] No hardcoded secrets or credentials
- [ ] Lint passes with zero errors
- [ ] No `console.log` in production code paths
- [ ] Documentation updated for all changed interfaces
- [ ] Universal review checklist passed
