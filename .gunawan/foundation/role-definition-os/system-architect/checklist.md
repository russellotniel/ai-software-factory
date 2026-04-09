# System Architect — Pre-Handoff Checklist

Before handing off to Software Engineer:

- [ ] Domain model covers all entities from product definition
- [ ] Every table has: id (UUID), tenant_id, created_at, updated_at, created_by, updated_by
- [ ] RLS policy designed for every new table
- [ ] No SECURITY DEFINER outside private schema
- [ ] API contracts cover all acceptance criteria from user stories
- [ ] Integration map accounts for all external systems
- [ ] Technical risks are documented with mitigations
- [ ] Implementation readiness document is complete and signed off
- [ ] No scope expansion beyond approved product definition
- [ ] Universal review checklist passed
