# Principles

> Part of the AI Software Factory — Foundation Layer
> These are the non-negotiable principles that apply to every project,
> every phase, and every AI agent session. No exceptions.

---

## 1. Performance First

Data fetching strategy is a deliberate architectural decision — not an afterthought.

- Every feature must declare where data is fetched and why
- Server-side fetching is the default — client-side fetching must be justified
- No unnecessary client-side waterfalls
- Database queries are optimized before shipping — use `EXPLAIN ANALYZE`
- RPC for complex queries, direct queries for simple single-table operations

---

## 2. Security Baseline — OWASP Top 10

Every project must comply with the OWASP Top 10 at minimum.

- Input validation on all user-supplied data
- RLS enabled on every table — no exceptions
- No `service_role` keys in client-side code
- Environment variables for all secrets — never hardcoded
- SQL injection prevented via parameterized queries and RPCs
- Authentication required before any data access
- Rate limiting on all public-facing endpoints

---

## 3. UI/UX Without Compromising Performance

User experience and performance are not competing concerns — both are required.

- Page load performance is a UX metric
- Lazy loading for non-critical UI components
- Optimistic UI where appropriate — never block the user unnecessarily
- Accessible by default — WCAG 2.1 AA minimum
- Mobile-first responsive design

---

## 4. Comprehensive Testing

Testing is not optional. Every project ships with a full test suite.

| Test Type         | Scope                               | Required  |
| ----------------- | ----------------------------------- | --------- |
| Unit tests        | Individual functions, utilities     | ✅ Always |
| Integration tests | API routes, server actions, RPCs    | ✅ Always |
| E2E tests         | Critical user flows                 | ✅ Always |
| Edge case tests   | Boundary conditions, error states   | ✅ Always |
| Load tests        | Performance under expected traffic  | ✅ Always |
| RLS tests         | Tenant isolation, role-based access | ✅ Always |

---

## 5. Multi-Tenancy by Default

Every project is built multi-tenant capable from day one, even if it launches single-tenant.

- `tenant_id` on every business table
- RLS policies enforce tenant isolation on every table
- Active tenant context via `active_tenant_id` on profiles
- Users can belong to multiple tenants (organisation-based model)
- Restricting to single-tenant is a constraint, not the default

---

## 6. Audit Trail by Default

Every project gets audit logging. Not just regulated projects — all of them.

- `audit.audit_logs` table on every project
- Generic trigger function attached to all business-critical tables
- Captures: who, what, when, old state, new state
- Queryable and surfaceable in the application UI
- For regulated projects: supplement with pg_audit for SELECT + DDL tracking

---

## How These Principles Are Applied

Every Claude Code command reads these principles before executing. Every feature spec references them. Every PR checklist validates against them.

These are not aspirational — they are the baseline. A feature that violates these principles is not done.
