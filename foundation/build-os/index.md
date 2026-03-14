# Build OS — Index

The Build Implementation OS for this factory is distributed across four existing layers.
Agents must read these documents when working on implementation, testing, or deployment tasks.

## Where to find what

| Shannon Phase 5 concept | Document |
|------------------------|----------|
| Coding standards, patterns, Server Actions | `implementation-os/standards.md` |
| Schema design, RLS, multi-tenancy | `architecture-os/schema-conventions.md` |
| RPC patterns and usage rules | `architecture-os/rpc-standards.md` |
| API contract patterns | `architecture-os/api-contracts.md` |
| Audit trail requirements | `architecture-os/audit-trail.md` |
| System design standards | `architecture-os/system-design.md` |
| Testing strategy | `qa-os/strategy.md` |
| CI/CD pipeline | `deployment-os/ci-cd.md` |
| Environment configuration | `deployment-os/environments.md` |
| Kubernetes sizing | `deployment-os/k8s-sizing.md` |
| Release process and branching | `deployment-os/release-process.md` |

## Loading order for implementation tasks

1. `implementation-os/standards.md` — coding rules first
2. `architecture-os/schema-conventions.md` — before any schema work
3. `architecture-os/rpc-standards.md` — before any RPC work
4. `qa-os/strategy.md` — before writing any tests
5. `deployment-os/release-process.md` — before any merge or release

## Non-negotiable rules (from Human Intent OS)

- Never use `unstable_cache` — use `'use cache'` directive
- Never use `parse()` — always `safeParse()`
- Never throw from Server Actions — always return `ActionResult<T>`
- Never create a table without RLS in the same migration
- Never use SECURITY DEFINER outside the `private` schema
- Never store tenant context in session variables
- Never put service_role keys in client-side code
- `requireAuth()` is always the first call in every Server Action
- `'use client'` only on leaf components
