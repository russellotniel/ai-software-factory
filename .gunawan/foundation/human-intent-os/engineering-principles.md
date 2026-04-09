# Engineering Principles

## Workflow order
Make it work → make it modular → make it tested → verify it follows patterns.
Never skip this sequence.

## Naming conventions
Every variable, function, and file must be descriptive and standardized.
Boolean prefix consistency is mandatory: if one flag is `hasBalls`, the next is `hasMenu`
— never `isMenuAvailable`. Inconsistent naming is a defect.

## Negative space programming
Use guard clauses and early returns. Catch invalid state at the top of every function.
Never allow invalid execution to reach deep logic.

## Retry methodology
All backend and frontend operations that touch external systems must implement
retry logic with exponential backoff and a defined maximum attempt count.

## Modularity
Centralize shared components, utilities, and services. Duplication across modules
is not permitted. File structure must reflect the architecture.

## Readability
Code must be understandable by another engineer within 10 minutes without asking anyone.
If it requires explanation, it requires refactoring.

## Enterprise-grade architecture
Every system is designed to the standard of Netflix, Stripe, and similar organizations.
Scale, fault isolation, and observability are baseline requirements — not optional.

## Hard rule
Agents must never introduce code that cannot be tested or observed.
