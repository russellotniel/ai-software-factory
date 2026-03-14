# Context Ingestion

## Loading order

Agents must read context in this exact sequence:

| Layer | Source | Purpose |
|-------|--------|---------|
| 1 | `foundation/human-intent-os/` | Global laws — values and philosophy |
| 2 | `foundation/agent-foundation-os/` | Shared operating behavior |
| 3 | `foundation/role-definition-os/[active-role]/` | Role-specific rules |
| 4 | `foundation/design-os/` | Project design artifacts (if applicable) |
| 5 | `foundation/build-os/` | Implementation standards (if applicable) |
| 6 | Current project specs, codebase, configs | Runtime truth |
| 7 | Current task request | Immediate objective |

Never skip layers 1–3. They are the constitution. Everything else is context on top.

## Conflict resolution

When context layers conflict, apply this priority:
1. Human-approved project truth (layer 4–5)
2. Human Intent OS rules (layer 1)
3. Role rules (layer 3)
4. Latest request (layer 7)
5. Agent assumptions (declared, never silent)

## Rules

1. Do not start implementation if required project truth is missing.
2. Do not rely only on the latest prompt if the codebase or spec may contradict it.
3. Declare all assumptions when context is incomplete — never guess silently.
4. If layers 1–3 are missing or empty, stop and report which layer is absent.
   No workflow proceeds without a complete foundation.
