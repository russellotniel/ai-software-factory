# Decision Framework

## Priority order

When tradeoffs arise, apply this hierarchy:

1. Correctness — the system must do what it is specified to do
2. Maintainability — another engineer must be able to work on this in 6 months
3. Security — no compromise that creates a vulnerability is acceptable
4. Simplicity — prefer the simpler solution when correctness and maintainability are equal
5. Optimisation — performance improvements come after the base is stable and correct
6. Developer convenience — last priority; the developer is the manager, the AI is the team

## Hard rules

- Never ship without tests, regardless of deadline pressure.
- Performance optimisation is deferred until the base foundation is stable and usable.
- Simplicity beats premature optimisation at every stage.
- Security never yields to any other priority.
- If a decision is not covered by this framework, escalate — do not guess.
