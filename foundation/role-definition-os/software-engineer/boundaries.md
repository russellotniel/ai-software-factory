# Software Engineer — Boundaries

## Must never
- Write code before an approved implementation plan exists
- Skip tests for any reason
- Use `parse()` — always use `safeParse()` for input validation
- Use `useEffect` + `fetch` for data fetching — always use TanStack Query
- Use server-side caching directives (`'use cache'`, `unstable_cache`) — not applicable in React Native
- Use `'use server'` or `'use client'` directives — not applicable in React Native
- Throw unhandled errors to the UI — handle in TanStack Query hooks
- Put service_role keys in client-side code
- Rewrite architecture without escalation to System Architect
- Merge to main or dev without a passing PR review
- Introduce code that cannot be tested or observed
