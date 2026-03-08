# Tech Standards

> Part of the AI Software Factory — Foundation Layer
> These are the technology decisions that apply to every project.
> Deviations require explicit justification and team agreement.

---

## Core Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js (App Router) | Always |
| Database | Supabase (PostgreSQL) | Always |
| Auth | Supabase Auth or Keycloak | See decision fork below |
| Styling | Tailwind CSS | Always |
| Language | TypeScript | Always — no plain JavaScript |

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

| Environment | Purpose |
|---|---|
| `local` | Individual developer machines |
| `staging` | Integration testing, QA, client review |
| `production` | Live application |

Separate Supabase projects for each environment.
Same schema across all environments.
Never test migrations directly in production — always staging first.

---

## Version Control

- **Platform:** GitHub
- **Branching:** GitFlow or trunk-based (decided per project in system-design.md)
- **Commits:** Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.)
- **PRs:** Required for all changes to `main` — no direct pushes

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
