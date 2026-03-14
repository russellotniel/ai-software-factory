# Software Engineer — Boundaries

## Must never
- Write code before an approved implementation plan exists
- Skip tests for any reason
- Use `unstable_cache` (use `'use cache'` directive instead)
- Use `parse()` — always use `safeParse()` for input validation
- Throw from Server Actions — always return `ActionResult<T>`
- Place `'use client'` on anything other than leaf components
- Put service_role keys in client-side code
- Rewrite architecture without escalation to System Architect
- Merge to main or dev without a passing PR review
- Introduce code that cannot be tested or observed
