---
feature: submit-registration
urs: FR-01
risk_zone: 1
status: draft
generated_by: /foundation:shape-spec --from-urs FR-01
---

# Spec: Submit Registration

> Status: Draft

---

## Overview

**Feature:** Submit Registration
**Domain:** `src/features/registrations/`
**Requested by:** Kominfo PP No. 28/2017 compliance — see URS FR-01
**URS reference:** FR-01 (`urs/main.md`)
**Risk Zone:** 1 (Critical) — derived from URS rank C
**Cross-cutting URS:** NFR-01 (NIK/KK encryption), UR-01 (Customer scope), VR-01 (decision logged — applied at FR-05/FR-06, not here)

A Customer submits a SIM registration with NIK, KK, selfie image, and target
phone number. The submission is validated, encrypted at rest, and placed in the
queue for the dealer assigned to the customer's region. This is the entry
point of the registration lifecycle.

---

## User Stories

```
As a Customer,
I want to submit my SIM registration with my NIK, KK, selfie, and phone number,
So that a dealer in my region can review and activate my SIM.
```

---

## Acceptance Criteria

Each criterion is independently testable. Becomes a Vitest case or Playwright spec.

- [ ] Given a logged-in Customer, when they POST to `submitRegistrationAction` with a valid 16-digit NIK, valid KK, selfie URL, and Indonesian phone number, then a row is inserted into `registrations` with `status = 'pending'` and the action returns `{ success: true, data: { registrationId } }`.
- [ ] Given a logged-in Customer, when they submit with NIK that is fewer than 16 digits, the action returns `{ success: false, error: { code: 'VALIDATION', fieldErrors: { nik: [...] } } }` and no row is inserted (FR-02 cross-validation).
- [ ] Given an unauthenticated request, when it calls `submitRegistrationAction`, then the action returns `401 Unauthorized` and no row is inserted.
- [ ] Given a Customer submits successfully, when their NIK is queried directly from the database via raw SQL, then the stored value is encrypted (not the plaintext NIK) — verifies NFR-01.
- [ ] Given a Customer submits successfully, when they call the `getMyRegistrations` query, then the new registration appears in their list (links to FR-03).
- [ ] Given a Customer submits successfully, when a different Customer queries `getMyRegistrations`, then the row from the first Customer is NOT returned (UR-01 RLS check).
- [ ] Given a Customer's profile has `region_code = 'DKI-JAKARTA'`, when they submit a registration, then the row's `region_code` is set to `'DKI-JAKARTA'` (derived from profile, not user-provided).

---

## Data Shape

```
New table: registrations
  id              UUID PK
  customer_id     UUID NOT NULL  → profiles(id)
  nik_encrypted   BYTEA NOT NULL — AES-256 deterministic, NFR-01
  kk_encrypted    BYTEA NOT NULL — AES-256 deterministic, NFR-01
  selfie_url      TEXT NOT NULL — Supabase Storage URL
  phone_number    TEXT NOT NULL — masked in CSV exports per VR-04
  region_code     TEXT NOT NULL — derived from customer profile at submit time
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
  rejection_reason TEXT — null until rejected; required when status='rejected' (FR-06)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  created_by      UUID NOT NULL → profiles(id)
  updated_by      UUID NOT NULL → profiles(id)

Indexes:
  (customer_id)         — customer's own listings
  (region_code, status) — dealer queue (FR-04)
  (status, created_at)  — admin dashboard (FR-07)

RLS policies:
  - customer_select_own: SELECT WHERE customer_id = auth.uid()
  - customer_insert: INSERT WITH CHECK (customer_id = auth.uid())
  - dealer_select_region: SELECT WHERE region_code = (SELECT region_code FROM profiles WHERE id = auth.uid())
  - admin_select_all: SELECT for role 'admin' (read-only)
  - no_update_or_delete_for_customer: prevent direct mutation; state changes go through RPC

RPC needed:
  submit_registration(p_nik TEXT, p_kk TEXT, p_selfie_url TEXT, p_phone TEXT)
    SECURITY INVOKER — encrypts NIK/KK with private.encrypt_nik(), reads
    region_code from caller's profile, inserts the row, returns the new id.
    Triggers an audit_log insert on commit (cross-feature: VR-01 wiring).
```

---

## UI / Design Reference

```
Figma frame: not yet
Screen spec:  design-os/screens/submit-registration.md  (to be authored)
Mockup:       none for v1 — Shadcn Form primitives, single column, mobile-first
```

UI states (covered by `/qa:new-tests`):
- empty (form unsubmitted)
- submitting (spinner, submit disabled)
- error (per-field errors from Zod safeParse)
- success (redirect to /registrations/[id]/status)

---

## Implementation Notes

- Use Supabase Vault or `pgcrypto` with a deterministic IV pattern stored in
  `private.encryption_keys`. Do NOT use a per-row IV; FR-02 needs exact-match
  searchability.
- Selfie upload happens client-side directly to Supabase Storage with a signed
  URL; the action receives only the resulting URL. Storage bucket has its own
  RLS preventing read by other customers.
- `region_code` is read from the customer's profile in the RPC, not passed
  from the client — prevents region spoofing.
- `created_by` and `updated_by` are set by the RPC, not by the client — server-
  authoritative.
- `requireAuth()` in the Server Action; `safeParse()` against the Zod schema;
  `ActionResult<{ registrationId: string }>` returned on success.

---

## Out of Scope for This Spec

- Dukcapil API real-time validation (FR-02 only validates format, not identity).
- SMS / WhatsApp notification on submission (deferred per brief).
- Resubmission flow after rejection (handled separately via FR-06 rejection
  spec; resubmission is a new submit-registration call after the previous
  registration is in `status='rejected'`).
- Multi-language UI (Bahasa Indonesia only for v1).
