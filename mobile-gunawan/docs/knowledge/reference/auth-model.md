# Auth Model

> Part of the AI Software Factory — Foundation Layer
> Defines the complete authentication and authorization model.
> Every project follows this model — the auth path determines which variant applies.

---

## The Core Distinction

```
Authentication  →  "Who are you?"         →  Keycloak or Supabase Auth
Authorization   →  "What can you do?"     →  Always Supabase
```

These are two separate concerns. Never conflate them.

---

## Auth Decision Fork

```
Does this project connect to AD / LDAP?
│
├── YES → Keycloak Path
│         ├── Keycloak federates users from AD/LDAP
│         ├── Keycloak issues JWT on login
│         ├── Supabase verifies JWT via OIDC
│         └── Supabase owns all roles, permissions, user data
│
└── NO  → Supabase Auth Path
          ├── Supabase handles email, OAuth, OTP, magic link
          └── Supabase owns all roles, permissions, user data
```

---

## User Management — Always in Supabase

Regardless of auth path, the following tables always exist.

### profiles table

```sql
CREATE TABLE public.profiles (
  id                UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name         TEXT,
  avatar_url        TEXT,
  global_role       app_role NOT NULL DEFAULT 'user',
  active_tenant_id  UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (id)
);
```

### tenants table (multi-tenant projects)

```sql
CREATE TABLE public.tenants (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### tenant_members table (multi-tenant projects)

```sql
CREATE TABLE public.tenant_members (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (tenant_id, user_id)
);
```

---

## Role Model

### Non-multi-tenant projects — global roles

```sql
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'user');
```

Role lives on `profiles.global_role`.
Managed via in-app user management page.
Never managed in Keycloak.

### Multi-tenant projects — two-layer roles

```
profiles.global_role      →  Platform-level role (superadmin bypasses tenant isolation)
tenant_members.role       →  Tenant-level role (admin, member, viewer, etc.)
```

A superadmin can manage all tenants.
Regular users are constrained to their tenant(s) via RLS.

---

## Multi-Tenancy Model

### Pattern: RLS with shared schema

```
✅ Shared public schema with tenant_id on every business table
✅ tenant_id stored in tenant_members bridge table
✅ Index on every tenant_id column
✅ RLS policies always simple — no inline joins
✅ Security definer functions for tenant context resolution
✅ RLS enabled on every table — no exceptions
```

### Active tenant context

Users can belong to multiple tenants simultaneously.
The active tenant is stored on `profiles.active_tenant_id`.

```
On login
├── Fetch user's tenants from tenant_members
├── If one tenant  → set as active automatically
└── If multiple    → show tenant-switcher UI, user picks one

Tenant switch
└── UPDATE profiles SET active_tenant_id = '[selected]' WHERE id = auth.uid()
```

No session variables (PgBouncer incompatible).
No localStorage (XSS risk).
Just a plain table column.

### Single-tenant restriction

When a project should restrict users to one tenant only:

```sql
-- Add this constraint to tenant_members
ALTER TABLE public.tenant_members ADD CONSTRAINT one_tenant_per_user UNIQUE (user_id);
```

---

## Security Definer Helper Functions

These are the only functions that use SECURITY DEFINER.
All must be in the `private` schema — never `public`.
PostgREST exposes `public` as an API, so SECURITY DEFINER functions there
are callable by anyone via `supabase.rpc()`. The `private` schema is not
exposed via PostgREST.
All must include `SET search_path = ''`.

```sql
-- Get active tenant for current user
CREATE OR REPLACE FUNCTION private.get_active_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT active_tenant_id
  FROM public.profiles
  WHERE id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION private.get_active_tenant_id() TO authenticated;

-- Get global role for current user
CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT global_role::TEXT
  FROM public.profiles
  WHERE id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION private.get_user_role() TO authenticated;

-- Get all tenants for current user
CREATE OR REPLACE FUNCTION private.get_user_tenants()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT tenant_id
  FROM public.tenant_members
  WHERE user_id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION private.get_user_tenants() TO authenticated;
```

---

## Standard RLS Patterns

### Tenant isolation (most tables)

```sql
-- Wrap in (SELECT ...) so Postgres caches the result within the query plan
CREATE POLICY "tenant_isolation" ON public.{table}
FOR ALL USING (
  tenant_id = (SELECT private.get_active_tenant_id())
  AND deleted_at IS NULL
);
```

### Role-based access (admin-only operations)

```sql
CREATE POLICY "admin_only" ON public.{table}
FOR DELETE USING (
  (SELECT private.get_user_role()) IN ('admin', 'superadmin')
);
```

### Superadmin bypass (platform management)

```sql
CREATE POLICY "superadmin_all" ON public.{table}
FOR ALL USING (
  (SELECT private.get_user_role()) = 'superadmin'
);
```

---

## Auto-create Profile on Signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
