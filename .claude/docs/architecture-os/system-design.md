# System Design

**Status:** Active  
**Last Updated:** 2026-03-09  
**Scope:** All Next.js + Supabase projects

---

## Purpose

This document defines the system architecture for all projects built on this stack. It covers component responsibilities, network topology, authentication flows, and integration patterns. Every developer and AI agent must understand this model before making architectural decisions.

---

## Stack Overview

| Component          | Technology                              | Role                                                                                              |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Frontend + Server  | Next.js (App Router) on AKS / OpenShift | UI, Server Components, Server Actions, Route Handlers                                             |
| Database + Backend | Supabase (self-hosted or cloud)         | PostgreSQL, Auth, Storage, Realtime, Edge Functions                                               |
| Auth (enterprise)  | Keycloak                                | OAuth/OIDC provider for AD/LDAP projects — Supabase Auth is always active, Keycloak feeds into it |
| AI                 | OpenAI (or compatible provider)         | Inference — always called server-side                                                             |
| File Storage       | Supabase Storage or Azure Blob / S3     | Depends on project and compliance requirements                                                    |

---

## Architecture Topology

### Variant A — Supabase Auth (Public-Facing Projects)

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│  Next.js Client Components + Supabase Realtime sub   │
└─────────────┬────────────────────────┬──────────────┘
              │ HTTPS                  │ WSS (Realtime)
              ▼                        ▼
┌─────────────────────────────────────────────────────┐
│              AKS / OpenShift Cluster                 │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │           Next.js App (Pod)                  │   │
│  │  Server Components, Server Actions,          │   │
│  │  Route Handlers, Proxy                  │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │ Internal (same cluster)        │
│                     │ OR HTTPS (cloud Supabase)      │
│  ┌──────────────────▼───────────────────────────┐   │
│  │           Supabase (self-hosted pod           │   │
│  │           or cloud project)                  │   │
│  │  PostgREST, Auth, Storage, Realtime,         │   │
│  │  Edge Functions                              │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │                                │
│  ┌──────────────────▼───────────────────────────┐   │
│  │           PostgreSQL                         │   │
│  │  App tables, auth schema, audit schema       │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

External:
  Next.js → OpenAI API (server-side only, via Server Action or Edge Function)
  Next.js / Supabase → Azure Blob / S3 (if not using Supabase Storage)
```

### Variant B — Keycloak Auth (Enterprise / AD Projects)

Keycloak is configured as an **OAuth provider inside Supabase Auth** — not as a replacement for it.
The application layer is identical to Variant A after login. The only difference is how the user
initially authenticates.

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│  Next.js Client Components + Supabase Realtime sub   │
└─────────────┬────────────────────────┬──────────────┘
              │ HTTPS                  │ WSS (Realtime)
              ▼                        ▼
┌─────────────────────────────────────────────────────┐
│              AKS / OpenShift Cluster                 │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │           Next.js App (Pod)                  │   │
│  │  Server Components, Server Actions,          │   │
│  │  Route Handlers, Proxy                  │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │ HTTPS (public domain)          │
│  ┌──────────────────▼───────────────────────────┐   │
│  │           Supabase (self-hosted or cloud)     │   │
│  │  PostgREST, Auth (active), Storage,          │   │
│  │  Realtime, Edge Functions                    │   │
│  └──────┬───────────────────────────────────────┘   │
│         │ OAuth dance (server-to-server)             │
│  ┌──────▼──────────┐  ┌──────────────────────────┐  │
│  │   Keycloak      │  │      PostgreSQL           │  │
│  │   (Pod)         │  │  App tables, auth schema, │  │
│  │  OIDC / AD/LDAP │  │  audit schema             │  │
│  └─────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘

Login flow:
  Browser → supabase.auth.signInWithOAuth({ provider: 'keycloak' })
  → Supabase redirects browser to Keycloak login
  → Keycloak authenticates against AD/LDAP
  → Keycloak redirects to Supabase Auth callback (server-to-server token exchange)
  → Supabase issues its own JWT, redirects to Next.js /auth/callback route
  → Next.js calls exchangeCodeForSession(code) → Supabase session stored in HttpOnly cookie
  → Keycloak session is signed out (no longer needed)
  → From this point: identical to Variant A
```

---

## Component Responsibilities

### Next.js App

**Owns:**

- All UI rendering (server and client)
- Server Actions (mutations)
- Route Handlers (webhooks, external HTTP)
- Session management and cookie handling
- Proxy (`proxy.ts`) — auth checks, tenant routing, redirects
- All calls to external APIs (OpenAI, etc.) — **always server-side**

**Does not own:**

- Authorization logic (RLS policies live in Supabase/PostgreSQL)
- Business logic that needs to run without the Next.js lifecycle (use Edge Functions)
- Long-running background tasks

**Must never:**

- Call OpenAI or any external API from a Client Component
- Store secrets in `NEXT_PUBLIC_` environment variables
- Bypass RLS by using the service role key in a context the user can influence

### Supabase

**Owns:**

- PostgreSQL database and schema
- Row Level Security (all authorization lives here)
- Supabase Auth — **always active in both variants** (Keycloak feeds into it as an OAuth provider)
- File storage (when using Supabase Storage)
- Realtime WebSocket subscriptions
- Edge Functions (background jobs, third-party integrations)
- Audit logs (via triggers)

**Does not own:**

- AD/LDAP identity federation (Keycloak handles this in Variant B and hands off to Supabase Auth)
- UI logic or rendering
- Application-layer validation (Zod in Next.js handles this)

### Keycloak (Variant B only)

**Owns:**

- User authentication against AD/LDAP
- The initial OAuth/OIDC flow that produces a Supabase session
- User identity from Active Directory

**Does not own:**

- Application roles or permissions (always in Supabase `profiles.global_role` and `tenant_members.role`)
- Session management after login (Supabase Auth owns the session from the callback onward)
- Any database queries
- Any business logic

**Must never:**

- Be used as the source of truth for roles or permissions
- Have its session or tokens kept alive after the Supabase session is established
- Be queried directly from a Client Component

### PostgreSQL

**Owns:**

- All persistent data
- RLS enforcement (the final security gate)
- Audit triggers
- Business logic that must be atomic with data changes (via RPCs)

---

## Authentication Flows

### Variant A — Supabase Auth (Email/Password or Social OAuth)

```
1. User submits login form (or clicks social provider)
2. Server Action calls supabase.auth.signInWithPassword() (or signInWithOAuth())
3. Supabase Auth validates credentials, issues Supabase JWT
4. @supabase/ssr writes JWT to HttpOnly cookie
5. Next.js proxy (`proxy.ts`) calls supabase.auth.getUser() on every request to refresh the session
   → getUser() validates the token server-side with Supabase Auth on every call
   → Never trust supabase.auth.getSession() in the proxy — it doesn't revalidate the token
6. requireAuth() in Server Actions reads the validated user + active_tenant_id
7. RLS policies enforce tenant isolation in every query
```

### Variant B — Keycloak via Supabase Auth OAuth

Keycloak is configured as a custom OAuth provider in the Supabase Auth dashboard.
The login sequence uses PKCE flow (required for SSR). After the Supabase session is
established, the Keycloak session is signed out — it is not kept alive.

```
1. User clicks "Sign in with Keycloak" in Next.js
2. Client calls supabase.auth.signInWithOAuth({ provider: 'keycloak', options: { scopes: 'openid', redirectTo: '/auth/callback' } })
3. Browser is redirected to Keycloak login page
4. Keycloak authenticates the user against AD/LDAP
5. Keycloak redirects to Supabase Auth callback (server-to-server token exchange)
6. Supabase Auth issues its own JWT, redirects browser to Next.js /auth/callback route
7. Next.js /auth/callback calls supabase.auth.exchangeCodeForSession(code)
   → Supabase session is written to HttpOnly cookie via @supabase/ssr
8. Callback route signs out of Keycloak (supabase.auth.signOut for the Keycloak provider)
   → Keycloak session is discarded — Supabase session is the only active session
9. From this point: identical to Variant A
   → Proxy calls getUser() on every request
   → requireAuth() reads user + active_tenant_id from Supabase
   → RLS enforces tenant isolation
```

**Key point:** After step 8, there is no Keycloak-specific code anywhere in the application.
`requireAuth()`, RLS, Proxy, Server Actions — all identical between Variant A and Variant B.

---

## Network Communication

### Self-Hosted Supabase (AKS / OpenShift)

Self-hosted Supabase is deployed using [supabase-community/supabase-kubernetes](https://github.com/supabase-community/supabase-kubernetes) with an Ingress and a proper public domain. Both Next.js (server-side) and the browser use the same public URL.

```
# Both server-side and client-side use the same public domain
NEXT_PUBLIC_SUPABASE_URL=https://supabase.yourdomain.com
SUPABASE_URL=https://supabase.yourdomain.com   # same value — no split needed
```

**Optional optimisation — internal cluster DNS:** If latency between Next.js and Supabase becomes a concern, the server-side `SUPABASE_URL` can be changed to the internal Kubernetes service DNS to keep traffic off the public ingress. The client-side `NEXT_PUBLIC_SUPABASE_URL` always remains the public domain (required for Realtime WebSocket and auth redirects).

```
# Optional: internal DNS for server-side only (set if latency warrants it)
SUPABASE_URL=http://supabase-kong.supabase.svc.cluster.local:8000
NEXT_PUBLIC_SUPABASE_URL=https://supabase.yourdomain.com
```

The Supabase Realtime WebSocket connection is established from the **browser** directly to the public Supabase URL. This is unavoidable — Realtime subscriptions cannot be proxied through Next.js at scale.

### Cloud Supabase

Both server and client use the public Supabase project URL. The `anon` key is safe to expose in the browser because RLS enforces all access control. The `service_role` key is **never** exposed to the client.

### Environment Variable Pattern

```
# Server-only (never NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
KEYCLOAK_CLIENT_SECRET=...

# Safe for browser (RLS enforces access control)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Rule:** If a secret appears in a `NEXT_PUBLIC_` variable, it is not a secret. Never put service role keys, AI provider keys, or third-party secrets in `NEXT_PUBLIC_` variables.

---

## External Integration Patterns

### OpenAI / AI Providers

```
Browser → Server Action → OpenAI API
                       ↓
              Returns result to Server Action
                       ↓
              Server Action returns ActionResult<T> to browser
```

- **Always called from a Server Action or Supabase Edge Function.** Never from a Client Component.
- The `OPENAI_API_KEY` lives in server-only environment variables.
- For long-running inference (> 10s), use a Supabase Edge Function triggered by a Server Action, with the result stored in the database and surfaced via Realtime subscription.

### Supabase Storage

```
Browser → Server Action (creates signed upload URL) → returns URL to browser
Browser → uploads file directly to Supabase Storage using signed URL
```

- Files are **never** uploaded through the Next.js server. Next.js generates a signed URL; the browser uploads directly to Supabase Storage.
- Private buckets always. No public buckets unless the asset is genuinely public (e.g., a public logo).
- Storage bucket RLS policies mirror table RLS — tenant-scoped.

### Azure Blob / S3 (when not using Supabase Storage)

Same pattern as Supabase Storage — signed URL generated server-side, browser uploads directly. Storage credentials never leave the server.

---

## Infrastructure Topology by Environment

| Environment | Next.js             | Supabase                                         | Notes                                   |
| ----------- | ------------------- | ------------------------------------------------ | --------------------------------------- |
| Local dev   | `localhost:3000`    | `localhost:54321` (Supabase CLI)                 | Full local stack via `supabase start`   |
| Staging     | AKS / OpenShift pod | Self-hosted or dedicated cloud project           | Mirrors production topology             |
| Production  | AKS / OpenShift pod | Self-hosted on same cluster (preferred) or cloud | Internal cluster comms when self-hosted |

Each environment has its own Supabase project (or self-hosted instance). Staging and production databases are never shared.

---

## What Not To Do

These are real architectural mistakes this framework exists to prevent.

| Anti-pattern                                                                      | Why it's wrong                                                   | What to do instead                                                              |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Calling OpenAI from a Client Component                                            | Exposes API key in the browser                                   | Always use a Server Action or Edge Function                                     |
| Using service role key in a client-accessible context                             | Bypasses all RLS — complete data exposure                        | Service role key is server-only, never in `NEXT_PUBLIC_`                        |
| Storing Keycloak roles in Keycloak                                                | Roles become split across two systems, inconsistent              | All roles live in Supabase `profiles` and `tenant_members`                      |
| Uploading files through Next.js server                                            | Memory pressure, upload size limits, unnecessary latency         | Signed URL pattern — browser uploads directly to storage                        |
| Using the public Supabase URL for server-to-server calls on a self-hosted cluster | Unnecessary network hop, external traffic for internal calls     | Use internal Kubernetes DNS for server-side calls                               |
| Keeping the Keycloak session alive after login                                    | Creates two active sessions; only the Supabase session is needed | Sign out of Keycloak in the /auth/callback route after exchangeCodeForSession() |
| Single Supabase project across staging and production                             | Migrations, data, and config bleed between environments          | Separate Supabase project per environment                                       |

---

## Decisions Log

| Decision                     | Choice                                               | Rationale                                                                                                     |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Two topology variants        | Keycloak (AD/LDAP) vs Supabase Auth direct           | Login mechanism differs but application layer is identical post-login                                         |
| OpenAI call location         | Server Action or Edge Function only                  | API key must never reach the browser                                                                          |
| File upload pattern          | Signed URL — browser uploads directly to storage     | Next.js is not a file upload proxy; avoids memory pressure and size limits                                    |
| Keycloak role authority      | Supabase only — never Keycloak                       | Single source of truth for all authorization decisions                                                        |
| Service role key scope       | Server-only environment variables                    | RLS must never be bypassable from a client-influenced context                                                 |
| Self-hosted URL              | Public domain via Ingress for both server and client | supabase-kubernetes deployed with Ingress; same URL used everywhere. Internal DNS optional optimisation only. |
| Keycloak session after login | Signed out at callback                               | Supabase session is the only active session; Keycloak session is not kept alive                               |
| Post-login code paths        | Identical between Variant A and Variant B            | requireAuth(), RLS, Proxy — same in both variants after the OAuth exchange                                    |
| Environment isolation        | Separate Supabase project per environment            | Prevents staging operations from affecting production schema or data                                          |
| Realtime from browser        | Browser → public Supabase URL directly               | Cannot be proxied through Next.js at scale; RLS enforces access                                               |
| Keycloak deployment          | supabase-community/supabase-kubernetes               | Standard community Helm chart; documented approach for all self-hosted projects                               |
| Session refresh file         | `proxy.ts` (formerly `middleware.ts`)                | Next.js renamed middleware to proxy; `proxy.ts` at project root delegates to `lib/supabase/proxy.ts`          |
