# Knowledge Library

Reusable best practices accumulated across all projects.
This grows over time and accelerates future work.

## Categories

### Authentication patterns
- Standard: Supabase Auth for public apps, Keycloak for AD/LDAP apps
- `requireAuth()` is always the first call in every Server Action
- Never store session tokens in session variables

### Multi-tenancy patterns
- `tenant_id` on every business table — no exceptions
- RLS policies use `(SELECT private.get_active_tenant_id())`
- `active_tenant_id` on profiles — no session variables

### Caching patterns
- Use `'use cache'` + `cacheLife` + `cacheTag`
- Never cache user-specific or RLS-governed data
- Never use `unstable_cache`

### Error handling patterns
- All Server Actions return `ActionResult<T>` — never throw
- Input validated with `safeParse()` before any database call
- All external calls implement retry with exponential backoff

### Testing patterns
- Unit tests for all business logic
- Integration tests for all API endpoints
- Stress/load/rate limiter tests for critical paths
- Never ship without a passing test suite

## Adding to the library
Any agent may propose a new library entry via the improvement-proposals queue.
Entries are accepted if they are reusable across projects, not project-specific.
Human approval required before a library entry becomes a standard.
