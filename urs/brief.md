# SIM Registration Portal — Product Brief

**Author:** XLSmart Solution Architect
**Date:** 2026-04-29
**Status:** Draft for URS authoring

---

## What we're building

XLSmart needs to replace the dealer-facing SIM activation tooling with a
single Customer-and-Dealer portal that handles prepaid SIM registration
end-to-end and produces an audit trail acceptable to Kominfo.

Customers can submit their own registration online with NIK (national ID)
and KK (family card) data. Dealers in their assigned region review the
submission, verify identity against the uploaded documents, and either
approve or reject. On approval, the SIM is activated and the registration is
written to the immutable audit log. On rejection, the customer is notified
with a reason and can resubmit.

Internal users — administrators and Kominfo auditors — need read access to
the registry and the audit log respectively.

---

## Why now

PP No. 28/2017 mandates that every prepaid SIM in Indonesia is registered
against a valid NIK and KK before activation, and that the registration is
auditable for at least 5 years. The current dealer tooling is a spreadsheet
and a WhatsApp group. Kominfo audits in 2025 flagged it as non-compliant on
three points: NIK not validated against Dukcapil format, no immutable audit
log, no role separation between dealer and admin.

The new portal must close all three gaps and ship before the next audit
window in Q3 2026.

---

## Users and roles

- **Customer** — submits registration with NIK, KK, and selfie. Views own
  registration status. Can resubmit if rejected. Cannot see other customers.
- **Dealer** — handles registrations from their assigned region only.
  Approves valid submissions, rejects with reason. Cannot see other regions'
  registrations.
- **Admin (XLSmart HQ)** — read-only access to all registrations across all
  regions. Generates monthly reports for internal review.
- **Auditor (Kominfo + internal compliance)** — read-only access to the
  immutable audit log only. Cannot see customer PII directly; sees only the
  hashed identifiers and the action trail.

---

## Modules

1. **Registration** — customer-facing submission and status tracking.
2. **Approval** — dealer-facing queue, review, decision.
3. **Reporting** — admin dashboard with cross-regional registration counts
   and rejection breakdowns.
4. **Audit** — append-only audit trail with read access for auditors.

---

## Data sensitivity

- **NIK (16-digit national ID)** — must be encrypted at rest. AES-256.
  Searchable by exact match only (deterministic encryption is acceptable).
- **KK (family card number)** — same handling as NIK.
- **Selfie image** — stored in object storage, not in the database. Lifecycle
  rule: deleted 30 days after registration is finalized (approved or
  rejected). Referenced only by hash in the audit log.
- **Phone number** — the activation target — stored unencrypted but is
  considered PII for export/reporting purposes (mask in CSV exports).

---

## Non-functional concerns

- **Performance** — dealer approval action must complete in under 2 seconds
  at p95 (Kominfo audit response targets).
- **Availability** — 99.5% during business hours (the current spreadsheet
  has zero SLA, anything is an improvement).
- **Auditability** — every state transition is written to the audit log,
  append-only, never deleted. Audit retention 5 years per regulation.
- **Auth** — Supabase Auth (existing XLSmart SSO is out of scope for this
  module).

---

## Validation, approval, and audit obligations

- Every approval AND every rejection writes an audit log entry with actor
  identity, timestamp, action, registration ID, and reason (if rejection).
- Rejections must include a free-text reason field (mandatory).
- A dealer who has already approved or rejected a registration cannot
  re-decide it. Reversals require admin escalation (out of scope for v1 —
  for now, treat as immutable).
- NIK changes after a registration is signed (approved) require dual
  approval (admin + supervisor). For v1 we can defer this to "rejection +
  re-submission" workflow.

---

## Out of scope for v1

- Direct integration with Dukcapil API (we validate format only, not the
  identity).
- SAP / billing integration (handled downstream by existing dealer commission
  flow).
- SMS / WhatsApp notification to the customer (notification is via in-app
  status page only for v1).
- Multi-language UI (Bahasa Indonesia only for v1).
