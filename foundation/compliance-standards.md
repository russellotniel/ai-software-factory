# Compliance Standards

> Part of the AI Software Factory — Foundation Layer
> Defines the compliance and security baseline for all projects.
> Regulated projects apply additional requirements on top of this baseline.

---

## Baseline — All Projects

### OWASP Top 10

Every project must address all OWASP Top 10 risks at minimum:

| Risk                      | Implementation                                                       |
| ------------------------- | -------------------------------------------------------------------- |
| Broken Access Control     | RLS on every table, tenant isolation enforced at DB level            |
| Cryptographic Failures    | HTTPS always, secrets in env vars, Supabase Vault for sensitive data |
| Injection                 | Parameterized queries, RPCs, never raw SQL from client               |
| Insecure Design           | Architecture OS review before implementation                         |
| Security Misconfiguration | No `service_role` in client, RLS always on, anon key scoped          |
| Vulnerable Components     | Dependency audits in CI pipeline                                     |
| Authentication Failures   | Supabase Auth or Keycloak, no custom auth                            |
| Integrity Failures        | Signed JWTs, migration version control                               |
| Logging Failures          | Audit trail on all business tables (see audit-trail.md)              |
| SSRF                      | Server-side fetch validation, allowlists for external requests       |

---

## Regulated Projects — Additional Requirements

Apply when the project operates in healthcare, pharmaceutical, or other regulated industries.

### Computer System Validation (CSV)

- All system changes documented and traceable
- Validation protocols for critical functionality
- Change control process enforced via PR reviews
- User requirements documented before implementation (Product OS output)

### Audit Trail — Enhanced

Standard audit trail (see `architecture-os/audit-trail.md`) plus:

- SELECT tracking via pg_audit for sensitive tables
- DDL change tracking via pg_audit
- Audit logs retained for minimum 7 years
- Audit logs are immutable — no UPDATE or DELETE on `audit.audit_logs`
- User identity traceable in every audit record

### Data Integrity

- Data validation at database level (CHECK constraints)
- Data validation at application level (server actions / API routes)
- No orphaned records — FK constraints always enforced
- Backup and recovery procedures documented

---

## Security Checklist

Before any project goes to production:

- [ ] RLS enabled on every table in public schema
- [ ] No `service_role` key in client-side code
- [ ] All secrets in environment variables
- [ ] HTTPS enforced
- [ ] Input validation on all user-supplied data
- [ ] Audit trail enabled on all business-critical tables
- [ ] Dependency audit run (`npm audit`)
- [ ] OWASP Top 10 review completed
- [ ] Penetration test or security review (regulated projects)
