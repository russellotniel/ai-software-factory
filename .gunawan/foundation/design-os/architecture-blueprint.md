# Architecture Blueprint

> Owner: System Architect
> Status: [ ] Draft [ ] In Review [ ] Approved
> Project:
> Date:

## Stack
| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | Next.js 16 (App Router) + TypeScript | Platform standard |
| Backend | Supabase (PostgreSQL, self-hosted on Kubernetes) | Platform standard |
| Auth | Supabase Auth / Keycloak | [specify for this project] |
| Styling | Tailwind CSS 4.x + Shadcn/ui | Platform standard |

## Module structure
```
src/
  modules/
    [module-name]/
      actions/
      components/
      hooks/
      types/
  services/
  lib/
```

## Service boundaries
<!-- What does each module own? Where do they not cross? -->

## Scalability assumptions
<!-- What load is this designed for? What breaks first under pressure? -->

## Architecture decisions
<!-- Key decisions made and why — link to ADRs if they exist -->
-
-
