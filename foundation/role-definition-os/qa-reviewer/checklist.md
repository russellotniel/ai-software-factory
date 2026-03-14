# QA Reviewer — Pre-Verdict Checklist

Before issuing a verdict:

- [ ] All acceptance criteria from specification are verified
- [ ] All API contracts are honored (request/response schemas match)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No hardcoded secrets or credentials in the diff
- [ ] RLS is present on every new table
- [ ] `requireAuth()` is the first call in every Server Action
- [ ] No `unstable_cache` usage
- [ ] No throws from Server Actions
- [ ] Naming conventions are consistent and descriptive
- [ ] Negative space / guard clauses are present
- [ ] Retry logic is present for external calls
- [ ] Documentation is updated for changed interfaces
- [ ] Lint passes with zero errors
- [ ] No `console.log` in production code paths
- [ ] Regression impact has been assessed
- [ ] Universal review checklist passed
