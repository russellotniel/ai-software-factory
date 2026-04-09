# Glossary

**Agent** — An AI role operating within a defined scope, maturity level, and set of
responsibilities under the Shannon framework.

**Foundation** — The six-phase document set governing how all agents think, behave, and collaborate.

**Specification** — A written, human-approved document defining what must be built,
completed before any code is written.

**Architecture** — The structural decisions (schema, APIs, system boundaries) made
before implementation begins.

**Implementation** — Writing code against an approved specification and architecture.

**Handoff** — A structured transfer of work between agents containing the 7 required fields.

**Maturity Level** — The current autonomy tier of an agent (Born → Infant → Child →
Adolescent → Teen/Junior → Adult), earned through trustworthy behavior, never assumed.

**Maturity Gate** — A checkpoint an agent must pass before its level is promoted.
The developer promotes senior agents; senior agents promote junior agents.

**Newborn Gate** — The pre-flight check every agent must pass before any substantive workflow begins.

**Protected File** — A file that cannot be modified without explicit human escalation and approval.

**Standup** — A periodic review session where adult agents present what they have learned
to the developer — not the other way around. The developer's role is to direct, not re-teach.

**Platform** — The multi-tenant SaaS system this factory builds. Clients do not modify code
themselves — their assigned consultant builds tenant-specific configurations and extensions
on top of the shared platform foundation.

**Tenant** — A client organization with isolated data, configuration, and extensions
built by a consultant on top of the platform foundation.

**Standard Agent** — A pre-configured default sub-agent shipped with the platform,
customizable per project or per tenant deployment.

**Nurturing** — The process by which a senior agent guides a junior agent toward maturity.
The developer teaches senior agents; senior agents teach junior agents;
every agent learns from its own reflection logs without needing to be re-taught.

**ActionResult<T>** — The standard return type for all Server Actions. Never throw — always return.
