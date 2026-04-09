# Tech Standards

> Part of the AI Software Factory — Foundation Layer
> These are the technology decisions that apply to every project.
> Deviations require explicit justification and team agreement.

---

## Core Stack

| Layer       | Technology                | Version       | Notes                                                             |
| ----------- | ------------------------- | ------------- | ----------------------------------------------------------------- |
| Frontend    | Next.js (App Router)      | 16.x          | Always                                                            |
| Database    | Supabase (PostgreSQL)     | Latest stable | Always                                                            |
| Auth        | Supabase Auth or Keycloak | —             | See decision fork below                                           |
| Styling     | Tailwind CSS              | 4.x           | Always                                                            |
| Language    | TypeScript                | 5.x           | Always — no plain JavaScript                                      |
| Runtime     | Node.js                   | 20.9+         | Next.js 16 minimum requirement                                    |
| Runtime env | next-runtime-env          | Latest        | Build-once, deploy-anywhere — see `deployment-os/environments.md` |

### Tooling (Next.js 16 defaults)

- **Bundler:** Turbopack — stable in Next.js 16, default for both `next dev` and `next build`. Do not add `--turbopack` flags; it is the default. Use `--webpack` only if a plugin has not yet been migrated.
- **React Compiler:** Stable in Next.js 16, opt-in via `reactCompiler: true` in `next.config.ts`. When enabled, automatically memoises components and removes the need for `useMemo`, `useCallback`, and `React.memo` in most cases. Enable on new projects; evaluate on existing ones.
- **Cache Components:** Enabled via `cacheComponents: true` in `next.config.ts`. Required to use the `'use cache'` directive, `cacheLife`, and `cacheTag`. Enable on all projects.

```typescript
// next.config.ts — baseline for all projects
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true, // Required for 'use cache' directive
  reactCompiler: false, // Enable per-project after evaluation
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false }
};

export default nextConfig;
```

---

## Auth Decision Fork

```
Does this project connect to AD / LDAP?
├── YES → Keycloak + Supabase
│         Keycloak = authentication only (who are you?)
│         Supabase = authorization (what can you do?)
│
└── NO  → Supabase Auth only
          Handles email, OAuth, OTP, magic link
```

**Keycloak is strictly for user federation — never for role management.**
Roles, permissions, and user management always live in Supabase regardless of auth path.

---

## Query Strategy

```
Simple single-table operation → Direct query from server
Complex operation (joins, aggregations, business logic) → RPC
```

Full rules in `architecture-os/rpc-standards.md`.

---

## Environment Structure

Every project runs three environments:

| Environment  | Purpose                                |
| ------------ | -------------------------------------- |
| `local`      | Individual developer machines          |
| `staging`    | Integration testing, QA, client review |
| `production` | Live application                       |

Separate Supabase projects for each environment.
Same schema across all environments.
Never test migrations directly in production — always staging first.

---

## Version Control

- **Platform:** GitHub
- **Branching:** Three-tier model — see `deployment-os/release-process.md`
  - `feature/*`, `fix/*` → `dev` (squash and merge)
  - `dev` → `main` (merge commit)
  - `hotfix/*` → `main` (squash and merge, also sync to `dev`)
  - No `prod` branch — production is a tag event, not a branch
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) — enforced at PR title level
- **PRs:** Required for all merges to `dev` and `main` — no direct pushes
- **Merge strategies:** Squash for feature/fix branches, merge commit for `dev` → `main`
- **Versioning:** semantic-release — automated from commit messages, no manual version bumps

---

## Package Management

- **JavaScript:** npm (default) or pnpm (for monorepos)
- **Consistent across team:** lock files always committed

---

## TypeScript Standards

- `strict` mode always enabled
- No `any` types — use `unknown` and type narrow
- Database types generated from Supabase schema — never hand-written
- Shared types in `src/types/` directory
