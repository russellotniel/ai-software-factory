# AI Software Factory — Claude Code Context

This file is automatically loaded by Claude Code at the start of every session.
It provides the global context and standards for this project.

---

## What You Are Working On

This is the AI Software Factory template repository.
It contains the living backbone documents and Claude Code commands for a structured
full-lifecycle development framework built for Next.js + Supabase projects.

---

## Core Standards (Always Apply)

### Stack
- Frontend: Next.js (App Router) + TypeScript
- Backend: Supabase (PostgreSQL)
- Auth: Supabase Auth (public apps) or Keycloak (AD/LDAP apps)
- Styling: Tailwind CSS

### Database
- All tables in `public` schema unless otherwise specified
- Audit tables in `audit` schema
- RLS enabled on every table — no exceptions
- Table names: plural snake_case
- Column names: snake_case
- Every table has: id (UUID), tenant_id, created_at, updated_at, created_by, updated_by
- RPCs for complex queries (joins, aggregations, business logic)
- Direct queries for simple single-table operations

### Security
- SECURITY INVOKER on all RPCs (default)
- SECURITY DEFINER only for helper functions — always with SET search_path = ''
- No service_role keys in client code
- OWASP Top 10 compliance on every project

### Multi-Tenancy
- Organisation-based tenant model
- tenant_id on every business table
- active_tenant_id on profiles — no session variables
- Users can belong to multiple tenants

### Audit Trail
- audit.log_changes() trigger on all business-critical tables
- audit.audit_logs table captures: who, what, when, old state, new state

---

## Key Documents

Read these before making any architectural decisions:

- `foundation/principles.md` — non-negotiable principles
- `foundation/tech-standards.md` — technology decisions
- `foundation/auth-model.md` — auth and authorization model
- `foundation/compliance-standards.md` — security and compliance baseline
- `architecture-os/schema-conventions.md` — database standards
- `architecture-os/rpc-standards.md` — RPC patterns and rules
- `architecture-os/audit-trail.md` — audit logging standard

---

## How to Run Commands

All commands are in `.claude/commands/`.
Run them with `/command-name` in Claude Code.

Start a new project with:
```
/foundation/discover
```

---

## Important Rules

1. Never create a table without RLS enabled in the same migration
2. Never use SECURITY DEFINER without SET search_path = ''
3. Never store tenant context in session variables
4. Never put service_role keys in client-side code
5. Always follow the migration template in schema-conventions.md
6. Always validate tenant membership at the start of every RPC
