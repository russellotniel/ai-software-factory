-- @spec: submit-registration
-- @urs: FR-01
-- @risk_zone: 1
-- @cross_cutting: NFR-01 (encryption), NFR-02 (audit retention), UR-01 (Customer scope), UR-02 (Dealer regional scope), UR-03 (Admin read-all)
--
-- Migration: registrations base table + RLS + RPC submit_registration
-- See: .claude/docs/specs/submit-registration.md

-- ============================================================
-- Extensions and private schema for encryption helpers
-- ============================================================

create extension if not exists pgcrypto;
create schema if not exists private;

-- Grant USAGE so authenticated can resolve fully-qualified function names.
-- Schema membership alone doesn't expose tables — those still require their
-- own grants and RLS. SECURITY DEFINER functions stay safe because the
-- definer's privileges are used regardless of the caller's permissions.
grant usage on schema private to authenticated;

-- Encryption helpers — AES-256 deterministic for exact-match search (NFR-01).
-- The key is stored in private.config (one-row table). In production, the
-- key is rotated by replacing the row via a controlled migration; the
-- private schema is not exposed to PostgREST.

create table if not exists private.config (
  key  text primary key,
  value text not null
);

-- Seed a local-dev key. Production replaces this via secret injection.
-- The key MUST be 32 bytes for AES-256.
insert into private.config(key, value)
values ('pii_key', 'local-dev-aes-256-key-32-bytes!!')
on conflict (key) do nothing;

create or replace function private.encrypt_pii(p_plain text)
returns bytea
language plpgsql
security definer
set search_path = private, public, extensions, pg_temp
as $$
declare
  v_key text;
begin
  select value into v_key from private.config where key = 'pii_key';
  if v_key is null or v_key = '' then
    raise exception 'PII encryption key not configured';
  end if;
  return encrypt(p_plain::bytea, v_key::bytea, 'aes');
end;
$$;

revoke all on function private.encrypt_pii(text) from public;
grant execute on function private.encrypt_pii(text) to authenticated;

create or replace function private.decrypt_pii(p_cipher bytea)
returns text
language plpgsql
security definer
set search_path = private, public, extensions, pg_temp
as $$
declare
  v_key text;
begin
  select value into v_key from private.config where key = 'pii_key';
  if v_key is null or v_key = '' then
    raise exception 'PII encryption key not configured';
  end if;
  return convert_from(decrypt(p_cipher, v_key::bytea, 'aes'), 'UTF8');
end;
$$;

revoke all on function private.decrypt_pii(bytea) from public;
-- Decrypt is intentionally NOT granted to authenticated — only RPCs in
-- private schema may call it. Application code never decrypts directly.

-- ============================================================
-- registrations table
-- ============================================================

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  nik_encrypted bytea not null,
  kk_encrypted bytea not null,
  selfie_url text not null,
  phone_number text not null,
  region_code text not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  -- VR-02: rejection_reason required when status='rejected'
  constraint rejection_reason_required_when_rejected
    check (status <> 'rejected' or (rejection_reason is not null and length(rejection_reason) > 0))
);

create index registrations_customer_id_idx
  on public.registrations(customer_id);

create index registrations_region_status_idx
  on public.registrations(region_code, status);

create index registrations_status_created_idx
  on public.registrations(status, created_at desc);

comment on table public.registrations is
  'SIM registration submissions. NIK/KK are encrypted (NFR-01). State machine pending → approved | rejected. @urs: FR-01';

-- ============================================================
-- RLS — applied in the same migration per project standard
-- ============================================================

alter table public.registrations enable row level security;

-- UR-01: Customer can SELECT only their own registrations
create policy customer_select_own
  on public.registrations
  for select
  to authenticated
  using (customer_id = auth.uid());

-- UR-01: Customer can INSERT only as themselves
-- Direct INSERT is allowed via this policy, but the canonical path is
-- the submit_registration RPC which centralises encryption + region derivation.
create policy customer_insert_own
  on public.registrations
  for insert
  to authenticated
  with check (customer_id = auth.uid());

-- UR-02: Dealer can SELECT registrations within their assigned region
create policy dealer_select_region
  on public.registrations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.global_role = 'dealer'
        and p.region_code = registrations.region_code
    )
  );

-- UR-03: Admin (read-only) can SELECT all
create policy admin_select_all
  on public.registrations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.global_role = 'admin'
    )
  );

-- Updates only via RPC (decide_registration in a later migration).
-- Customer cannot UPDATE; Dealer/Admin cannot UPDATE directly.
-- DELETE is never allowed at the policy level — registrations are immutable.

-- ============================================================
-- RPC: submit_registration (canonical entry point)
-- ============================================================

create or replace function public.submit_registration(
  p_nik text,
  p_kk text,
  p_selfie_url text,
  p_phone text
)
returns uuid
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare
  v_customer_id uuid;
  v_region_code text;
  v_id uuid;
begin
  -- requireAuth equivalent at the DB layer
  v_customer_id := auth.uid();
  if v_customer_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  -- FR-02: validate NIK format (16 digits)
  if p_nik !~ '^[0-9]{16}$' then
    raise exception 'invalid_nik_format' using errcode = '22023';
  end if;

  if p_kk !~ '^[0-9]{16}$' then
    raise exception 'invalid_kk_format' using errcode = '22023';
  end if;

  -- region_code is derived from the caller's profile, never trusted from input
  select region_code into v_region_code
  from public.profiles
  where id = v_customer_id;

  if v_region_code is null then
    raise exception 'profile_missing_region' using errcode = '22023';
  end if;

  insert into public.registrations(
    customer_id, nik_encrypted, kk_encrypted, selfie_url, phone_number,
    region_code, status, created_by, updated_by
  ) values (
    v_customer_id,
    private.encrypt_pii(p_nik),
    private.encrypt_pii(p_kk),
    p_selfie_url,
    p_phone,
    v_region_code,
    'pending',
    v_customer_id,
    v_customer_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_registration(text, text, text, text) from public;
grant execute on function public.submit_registration(text, text, text, text) to authenticated;

comment on function public.submit_registration(text, text, text, text) is
  'Canonical entry point for FR-01: validates NIK/KK format, encrypts PII, derives region from profile, inserts a pending registration. @urs: FR-01, FR-02, NFR-01, UR-01';
