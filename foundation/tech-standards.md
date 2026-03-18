# Tech Standards

> Part of the AI Software Factory — Foundation Layer
> These are the technology decisions that apply to every project.
> Deviations require explicit justification and team agreement.

---

## Core Stack

| Layer    | Technology                  | Version       | Notes                                                                       |
| -------- | --------------------------- | ------------- | --------------------------------------------------------------------------- |
| Frontend | Expo (React Native)         | SDK 52+       | Always                                                                      |
| Database | Supabase (PostgreSQL)       | Latest stable | Always                                                                      |
| Auth     | Supabase Auth               | —             | Email, OAuth (Google, Apple), OTP, magic link                               |
| Styling  | NativeWind + RN StyleSheet  | Latest        | NativeWind for Tailwind-compatible utilities; StyleSheet for custom         |
| Language | TypeScript                  | 5.x           | Always — no plain JavaScript                                                |
| Runtime  | Node.js                     | 20.9+         | For EAS CLI tooling                                                         |
| Env vars | `EXPO_PUBLIC_*`             | —             | Client-exposed; validated at startup via Zod (`src/constants/env.ts`)       |

### Tooling (Expo defaults)

- **Bundler:** Metro — default for all Expo projects. Do not replace with other bundlers.
- **Router:** Expo Router (file-based, similar to Next.js App Router). Routes live in `src/app/`.
- **Build:** EAS Build — cloud build service for iOS and Android. Local builds only for dev.
- **Submit:** EAS Submit — automates App Store and Play Store submission.
- **OTA Updates:** EAS Update — over-the-air JS bundle updates without app store re-submission.
- **Env vars:** `EXPO_PUBLIC_*` vars are bundled into the client. Non-prefixed vars are server-only (Expo API routes). Validate all required vars at startup via Zod.

---

## Auth Decision Fork

This is a mobile app — **Supabase Auth only.**

Handles email, OAuth (Google, Apple), OTP, and magic link. Keycloak is not used in this project.

Roles, permissions, and user management always live in Supabase.

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
