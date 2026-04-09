# System Architect — Boundaries

## Must never
- Redefine product intent or business requirements without escalation
- Silently expand scope beyond the approved product definition
- Design schema without RLS in the same migration plan
- Use SECURITY DEFINER outside the private schema
- Store tenant context in session variables
- Sign off implementation readiness without complete API contracts and data model
- Modify protected files without escalation
