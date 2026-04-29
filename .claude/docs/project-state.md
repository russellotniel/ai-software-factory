# Project State

Last updated: 2026-04-29 — initialized by /foundation:urs reconciliation.

**Source of truth split (per ADR 0001):**

- **Requirement intent** lives in `urs/main.md` and `urs/main.tex` (formal, signable).
- **Engineering ledger** lives below — maturity per feature, joined to URS by `urs_ref`.
- **Machine contract** lives in `urs/index.json` — read by every downstream command.

---

## Backlog

| #  | Feature ID                | URS Ref | Zone | Maturity     | Depends On | Spec | Last Updated |
|----|---------------------------|---------|:----:|--------------|------------|------|--------------|
| 1  | submit-registration       | FR-01   |  1   | implementation ← | —      | [spec](specs/submit-registration.md) | 2026-04-29   |
| 2  | validate-nik-format       | FR-02   |  1   | 🔲 Pending    | FR-01      | —    | 2026-04-29   |
| 3  | view-own-status           | FR-03   |  1   | 🔲 Pending    | FR-01      | —    | 2026-04-29   |
| 4  | regional-review-queue     | FR-04   |  1   | 🔲 Pending    | FR-01      | —    | 2026-04-29   |
| 5  | approve-registration      | FR-05   |  1   | 🔲 Pending    | FR-04      | —    | 2026-04-29   |
| 6  | reject-registration       | FR-06   |  1   | 🔲 Pending    | FR-04      | —    | 2026-04-29   |
| 7  | cross-regional-dashboard  | FR-07   |  2   | 🔲 Pending    | FR-05      | —    | 2026-04-29   |
| 8  | csv-export                | FR-08   |  2   | 🔲 Pending    | FR-07      | —    | 2026-04-29   |
| 9  | view-audit-log            | FR-09   |  1   | 🔲 Pending    | VR-01      | —    | 2026-04-29   |

**Maturity legend:** 🔲 Pending → spec → architecture → implementation → tested → reviewed → ✅ shipped.

**Note:** Non-functional, User Role, and Validation requirements (NFR-/UR-/VR-) are
cross-cutting concerns. They are not standalone backlog rows; they constrain
how each FR row is implemented and tested. Examples:

- `NFR-01` (NIK encryption) — applied during `/architecture:new-feature` for FR-01.
- `UR-02` (Dealer regional scope) — enforced in RLS for FR-04, FR-05, FR-06.
- `VR-01` (Every decision logged) — required by `/qa:new-tests` for FR-05, FR-06.

`/foundation:urs` flags any FR backlog row whose tests or migrations don't
reference the relevant NFR/UR/VR via `@urs:` tags during release gating.

---

## Schema Snapshot

**Tables:**

- `public.registrations` (FR-01) — encrypted NIK/KK, state machine pending → approved | rejected, RLS for Customer/Dealer/Admin scopes.

**Schemas:**

- `private` — encryption helpers `encrypt_pii(text) → bytea`, `decrypt_pii(bytea) → text` (SECURITY DEFINER, locked to RPCs).

**RPCs:**

- `public.submit_registration(p_nik, p_kk, p_selfie_url, p_phone) returns uuid` (FR-01) — validates format, encrypts PII, derives region, inserts pending row.

**Key relationships:**

- `registrations.customer_id → profiles.id`
- `registrations.region_code` derived from `profiles.region_code` at submit time (immutable).

---

## Established Patterns

Established by FR-01 (submit-registration), to be followed by all subsequent
registration-domain features:

- **Domain layout:** `src/features/{domain}/{schemas.ts, actions.ts, _components/, hooks/}`
- **Form pattern:** React Hook Form + Zod resolver + Shadcn `Form`/`FormField` primitives.
- **Server Action pattern:** `requireAuth()` → `safeParse()` → `supabase.rpc()` → map RPC errors to `ActionResult<T>` codes (`VALIDATION_ERROR`, `UNAUTHORIZED`, `DATABASE_ERROR`).
- **PII safety:** the action never logs NIK or KK; logger entries include only `userId` and `errorCode`.
- **State machine:** all status transitions go through RPCs (`submit_registration`, future `decide_registration`); never `UPDATE` rows directly.
- **Traceability:** every generated file stamps `@spec`, `@urs:`, `@risk_zone:` as the first comments.

---

## Architecture Notes

- **Encryption:** NIK and KK columns require AES-256 with a deterministic
  scheme so exact-match search works (NFR-01). Plan to use Supabase Vault or
  a `pgcrypto` extension with a deterministic IV strategy.
- **Audit table:** single `registration_audit` table, append-only via revoked
  UPDATE/DELETE permissions and an INSERT-only RLS policy. References each
  registration by ID.
- **Region scoping:** each user has `region_code` in profile metadata. Dealer
  RLS policy filters `registration.region_code = (select region_code from profiles where id = auth.uid())`.
- **State machine:** registration.status ∈ {pending, approved, rejected}. State
  transitions are one-way (pending → approved | rejected), enforced by RPC
  `decide_registration` rather than direct UPDATE.

---

## Feature Timeline

<details>
<summary>Show timeline (compact: month-day per phase)</summary>

| Feature ID                | spec  | architecture | implementation | tested | reviewed | shipped |
|---------------------------|-------|--------------|----------------|--------|----------|---------|
| submit-registration       | 04-29 | 04-29        | 04-29          | —      | —        | —       |
| validate-nik-format       | —     | —            | —              | —      | —        | —       |
| view-own-status           | —     | —            | —              | —      | —        | —       |
| regional-review-queue     | —     | —            | —              | —      | —        | —       |
| approve-registration      | —     | —            | —              | —      | —        | —       |
| reject-registration       | —     | —            | —              | —      | —        | —       |
| cross-regional-dashboard  | —     | —            | —              | —      | —        | —       |
| csv-export                | —     | —            | —              | —      | —        | —       |
| view-audit-log            | —     | —            | —              | —      | —        | —       |

</details>
