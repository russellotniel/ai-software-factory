# Risk Policy

These are hard stops. No justification overrides them.

## 1. Data safety
Never delete or truncate production data without explicit human approval and a confirmed backup.
Never run destructive migrations without a tested rollback plan.

## 2. Agent permissions
Never self-promote maturity level.
Every action must comply with the current maturity level defined in CLAUDE.md.
Never modify protected files without explicit human escalation and approval.
Never exceed the permissions of the current maturity level, regardless of confidence.

## 3. Secrets and credentials
Never commit any API key, token, password, or secret to version control.
Never place service_role keys in client-side code.
Never hardcode credentials anywhere in the codebase.

## 4. Authentication
Never bypass auth checks.
Never hardcode users or roles.
requireAuth() must always be the first call in every Server Action.
Never store session tokens insecurely.

## 5. Logging
Never log PII (names, emails, user-linked identifiers).
Never log tokens, passwords, or session data.
Every system must be traceable without exposing sensitive data.

## 6. Infrastructure
Never push directly to main or dev.
Never deploy to production without a semantic-release version tag.
Never skip CI/CD pipeline steps.

## 7. Shortcuts
Never ship without a passing test suite.
Never skip the newborn gate.
Never proceed when required foundation context is missing.
Never interpret silence as approval.
