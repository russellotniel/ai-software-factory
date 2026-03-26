# /foundation:init

Configure the project by asking architectural questions, then generate the
conditional pieces — auth pages, baseline migration, dashboard shell, and config files.

The template already ships with a working Next.js 16 + Supabase starter (utilities,
types, configs, test infrastructure). This command customizes it for the specific project.

**Preconditions:**
- The user created this repo from the AI Software Factory GitHub template
- `npm install` has been run — base files already exist

---

## Step 1 — Project Name

Ask: "What is the project name?" (kebab-case, used in package.json and display)

---

## Step 2 — Architectural Questions

Ask these three questions — they determine everything downstream:

1. **"Is this a multi-tenant application?"**
   Explain: "Multi-tenant means organisations/teams each see only their own data.
   This adds tenant tables, tenant-scoped RLS, and an onboarding flow."
   — Yes / No

2. **"Does this project connect to Active Directory or LDAP?"**
   Explain: "If yes, authentication goes through Keycloak. If no, Supabase Auth handles it directly."
   — Yes (Keycloak) / No (Supabase Auth)

3. **"Is this a regulated industry project? (healthcare, finance, pharma)"**
   — No / Yes → which regulation? (HIPAA, SOC2, PCI-DSS, GDPR)

---

## Step 3 — Write Project Config

Write `.claude/project-config.json`:

```json
{
  "schemaVersion": "0.1.0",
  "projectName": "{answer from step 1}",
  "initDate": "{today's date, ISO 8601}",
  "multiTenant": {true/false from step 2.1},
  "authModel": "{supabase-auth or keycloak from step 2.2}",
  "regulated": {true/false from step 2.3},
  "regulationType": "{hipaa/soc2/pci-dss/gdpr or null}",
  "auditTrail": true,
  "status": "initializing"
}
```

---

## Step 4 — Update Existing Files

### Update `package.json`

Change the `name` field to the project name from Step 1.

### Update `src/app/layout.tsx`

Change the `metadata.title` to the project name (title case).

### Replace `src/app/page.tsx`

Replace the welcome/setup page with a root redirect:

```typescript
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
```

---

## Step 5 — Generate Auth Files

### Always generate:

#### `src/app/auth/callback/route.ts`

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
```

#### `src/app/(auth)/layout.tsx`

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
```

### When `authModel: "supabase-auth"`:

#### `src/app/(auth)/login/page.tsx`

```typescript
import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter your email to sign in to your account
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
```

#### `src/app/(auth)/login/_components/login-form.tsx`

```typescript
"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="font-medium underline">
          Sign up
        </a>
      </p>
    </form>
  );
}
```

#### `src/app/(auth)/signup/page.tsx`

```typescript
import { SignupForm } from "./_components/signup-form";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter your details to get started
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
```

#### `src/app/(auth)/signup/_components/signup-form.tsx`

```typescript
"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <a href="/login" className="font-medium underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
```

### When `authModel: "keycloak"`:

#### `src/app/(auth)/login/page.tsx`

```typescript
import { redirect } from "next/navigation";

export default function LoginPage() {
  const keycloakUrl = process.env.KEYCLOAK_ISSUER;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;

  const authUrl = `${keycloakUrl}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid email profile`;

  redirect(authUrl);
}
```

No signup page for Keycloak — users are managed in Keycloak/AD.

---

## Step 6 — Generate Auth Utility

### When `multiTenant: true` — replace `src/lib/auth/server.ts`:

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthContext = {
  user: { id: string; email: string };
  tenantId: string;
  role: string;
};

export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_tenant_id, global_role")
    .eq("id", user.id)
    .single();

  if (!profile?.active_tenant_id) {
    redirect("/onboarding");
  }

  return {
    user: { id: user.id, email: user.email! },
    tenantId: profile.active_tenant_id,
    role: profile.global_role,
  };
}
```

### When `multiTenant: false` — replace `src/lib/auth/server.ts`:

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthContext = {
  user: { id: string; email: string };
  role: string;
};

export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("global_role")
    .eq("id", user.id)
    .single();

  return {
    user: { id: user.id, email: user.email! },
    role: profile?.global_role ?? "user",
  };
}
```

---

## Step 7 — Generate Baseline Migration

Write to `supabase/migrations/00000000000000_baseline.sql`.

### When `multiTenant: true`:

```sql
-- Baseline migration: multi-tenant project
-- Generated by /foundation:init

-- Schemas
CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS audit;

-- Role enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'user');

-- Tenants
CREATE TABLE public.tenants (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE public.profiles (
  id                UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name         TEXT,
  avatar_url        TEXT,
  global_role       app_role NOT NULL DEFAULT 'user',
  active_tenant_id  UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tenant members
CREATE TABLE public.tenant_members (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (tenant_id, user_id)
);
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper: get active tenant
CREATE OR REPLACE FUNCTION private.get_active_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION private.get_active_tenant_id() TO authenticated;

-- Helper: get user role
CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT global_role::TEXT FROM public.profiles WHERE id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION private.get_user_role() TO authenticated;

-- Helper: get user tenants
CREATE OR REPLACE FUNCTION private.get_user_tenants()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION private.get_user_tenants() TO authenticated;

-- Auto-create profile on signup
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

-- RLS: tenants
CREATE POLICY "superadmin_all" ON public.tenants
  FOR ALL USING ((SELECT private.get_user_role()) = 'superadmin');
CREATE POLICY "members_read_own" ON public.tenants
  FOR SELECT USING (id IN (SELECT private.get_user_tenants()));
CREATE POLICY "authenticated_insert" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS: profiles
CREATE POLICY "users_read_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- RLS: tenant_members
CREATE POLICY "members_read_own_tenant" ON public.tenant_members
  FOR SELECT USING (tenant_id = (SELECT private.get_active_tenant_id()));
CREATE POLICY "admin_manage_members" ON public.tenant_members
  FOR ALL USING (
    tenant_id = (SELECT private.get_active_tenant_id())
    AND EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = tenant_members.tenant_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'owner')
    )
  );
CREATE POLICY "authenticated_insert_members" ON public.tenant_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX idx_profiles_active_tenant ON public.profiles(active_tenant_id);
CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);

-- Audit
CREATE TABLE audit.audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       UUID,
  table_name      TEXT NOT NULL,
  record_id       UUID NOT NULL,
  operation       TEXT NOT NULL,
  old_data        JSONB,
  new_data        JSONB,
  changed_fields  JSONB,
  performed_by    UUID,
  performed_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address      TEXT,
  user_agent      TEXT
);

CREATE INDEX idx_audit_tenant_id ON audit.audit_logs(tenant_id);
CREATE INDEX idx_audit_table_name ON audit.audit_logs(table_name);
CREATE INDEX idx_audit_record_id ON audit.audit_logs(record_id);
CREATE INDEX idx_audit_performed_at ON audit.audit_logs(performed_at DESC);
CREATE INDEX idx_audit_performed_by ON audit.audit_logs(performed_by);

CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit.audit_logs (
    tenant_id, table_name, record_id, operation,
    old_data, new_data, changed_fields, performed_by
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id)::UUID,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    CASE WHEN TG_OP = 'UPDATE' THEN (
      SELECT jsonb_object_agg(key, value)
      FROM jsonb_each(to_jsonb(NEW))
      WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key
    ) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Audit triggers on baseline tables
CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
CREATE TRIGGER audit_tenant_members AFTER INSERT OR UPDATE OR DELETE ON public.tenant_members
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
```

### When `multiTenant: false`:

```sql
-- Baseline migration: single-tenant project
-- Generated by /foundation:init

-- Schemas
CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS audit;

-- Role enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id                UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name         TEXT,
  avatar_url        TEXT,
  global_role       app_role NOT NULL DEFAULT 'user',
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper: get user role
CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT global_role::TEXT FROM public.profiles WHERE id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION private.get_user_role() TO authenticated;

-- Auto-create profile on signup
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

-- RLS: profiles
CREATE POLICY "users_read_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit
CREATE TABLE audit.audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       UUID,
  table_name      TEXT NOT NULL,
  record_id       UUID NOT NULL,
  operation       TEXT NOT NULL,
  old_data        JSONB,
  new_data        JSONB,
  changed_fields  JSONB,
  performed_by    UUID,
  performed_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address      TEXT,
  user_agent      TEXT
);

CREATE INDEX idx_audit_table_name ON audit.audit_logs(table_name);
CREATE INDEX idx_audit_record_id ON audit.audit_logs(record_id);
CREATE INDEX idx_audit_performed_at ON audit.audit_logs(performed_at DESC);
CREATE INDEX idx_audit_performed_by ON audit.audit_logs(performed_by);

CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit.audit_logs (
    tenant_id, table_name, record_id, operation,
    old_data, new_data, changed_fields, performed_by
  ) VALUES (
    NULL,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    CASE WHEN TG_OP = 'UPDATE' THEN (
      SELECT jsonb_object_agg(key, value)
      FROM jsonb_each(to_jsonb(NEW))
      WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key
    ) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Audit triggers
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
```

---

## Step 8 — Generate Dashboard Shell

### Always generate:

#### `src/app/(dashboard)/layout.tsx`

When `multiTenant: true`:

```typescript
import { requireAuth } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tenantId } = await requireAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{/* Project name */}</h1>
          <span className="text-sm text-zinc-500">{user.email}</span>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

When `multiTenant: false`:

```typescript
import { requireAuth } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{/* Project name */}</h1>
          <span className="text-sm text-zinc-500">{user.email}</span>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

#### `src/app/(dashboard)/page.tsx`

```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <p className="text-zinc-500 dark:text-zinc-400">
        Welcome to your project. Start building features with{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
          /foundation:discover
        </code>
      </p>
    </div>
  );
}
```

### When `multiTenant: true` — also generate onboarding:

#### `src/app/(auth)/onboarding/page.tsx`

```typescript
import { OnboardingForm } from "./_components/onboarding-form";

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Create your organisation</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Set up your organisation to get started
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
```

#### `src/app/(auth)/onboarding/_components/onboarding-form.tsx`

```typescript
"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OnboardingForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({ name, slug })
      .select("id")
      .single();

    if (tenantError) {
      setError(tenantError.message);
      setLoading(false);
      return;
    }

    // Add user as owner
    const { error: memberError } = await supabase
      .from("tenant_members")
      .insert({ tenant_id: tenant.id, user_id: user.id, role: "owner" });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    // Set active tenant
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ active_tenant_id: tenant.id })
      .eq("id", user.id);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Organisation name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Acme Inc."
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create organisation"}
      </Button>
    </form>
  );
}
```

---

## Step 9 — Write Product Mission Stub

Write `.claude/docs/foundation/product-mission.md` with architectural choices filled in:

```markdown
# Product Mission

> Part of the AI Software Factory — Foundation Layer
> Stub written by /foundation:init on {today's date}. Completed by /foundation:discover.
> Run /foundation:discover to populate all remaining sections.

---

## Project

**Name:** {project-name}

**One-line description:** _To be completed by /foundation:discover_

**Status:** Initializing

---

## Users

**Primary users:** _To be completed by /foundation:discover_

**Secondary users:** _To be completed by /foundation:discover_

---

## Problem

_To be completed by /foundation:discover_

---

## Key Use Cases

_To be completed by /foundation:discover_

---

## Out of Scope

_To be completed by /foundation:discover_

---

## Technical Context

**Multi-tenant:** {Yes / No}

**Auth:** {Supabase Auth / Keycloak}

**Regulated industry:** {No / Yes — which}

**Integrations:** _To be completed by /foundation:discover_

---

## Definition of Done

A feature is complete when:

- [ ] Implements the use case as described
- [ ] {If multi-tenant: "All tenant isolation tests pass"}
- [ ] Matches the design spec in `design-os/screens/`
- [ ] Unit and E2E tests added
- [ ] No TypeScript errors, no lint errors
- [ ] Reviewed against implementation standards
```

---

## Step 10 — Initialize Project State

Write `.claude/docs/project-state.md`:

```markdown
# Project State

Last updated: {today's date} — initialized by /foundation:init

## Backlog

| # | Feature         | Status  | Depends On | Spec |
|---|-----------------|---------|------------|------|
| 1 | Auth (baseline) | ✅ Done | —          | —    |

## Schema Snapshot

Tables: profiles{, tenants, tenant_members (if multi-tenant)}

## Established Patterns

(populated after first feature is built)
```

---

## Step 11 — Confirm and Write

Show a summary of everything that will be generated:
- List all files to be created or modified
- Show the `project-config.json` contents
- Show the migration variant (multi-tenant or single-tenant)

Ask: "Should I generate all these files?"

On confirmation, write all files.

---

## Step 12 — Copy `.env.example` to `.env.local`

```bash
cp .env.example .env.local
```

Tell the user: "Fill in `.env.local` with your actual Supabase URL and keys before running the app."

---

## ✅ What's Next

Tell the user:

"Project configured. Run `/foundation:discover` next to document what you're building."

```
COMMAND_COMPLETE: foundation:init
STATUS: success
FILES_CREATED: [list of created files]
FILES_MODIFIED: [list of modified files]
NEXT_COMMAND: foundation:discover
CONFIG_UPDATED: .claude/project-config.json
```
