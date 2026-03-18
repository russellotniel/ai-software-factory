# System Design

**Status:** Active
**Last Updated:** 2026-03-09
**Scope:** Weeknd Expo (React Native) + Supabase project

---

## Purpose

This document defines the system architecture for all projects built on this stack. It covers component responsibilities, network topology, authentication flows, and integration patterns. Every developer and AI agent must understand this model before making architectural decisions.

---

## Stack Overview

| Component | Technology | Role |
|---|---|---|
| Mobile App | Expo (React Native) | UI, navigation, all client-side rendering |
| Database + Backend | Supabase (cloud-hosted) | PostgreSQL, Auth, Storage, Realtime, Edge Functions |
| Server-side (limited) | Expo API Routes | Server-only secrets proxy (e.g. Google Maps) |
| File Storage | Supabase Storage | User-uploaded content (moment photos, etc.) |

---

## Architecture Topology

```
┌─────────────────────────────────────────────────────┐
│                  Expo Mobile App                     │
│  React Native UI Components + TanStack Query +       │
│  Supabase Realtime WebSocket subscriptions           │
└──────────────┬──────────────────────┬───────────────┘
               │ HTTPS (REST/RPC)     │ WSS (Realtime)
               ▼                      ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (cloud-hosted)                 │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  PostgREST — REST API for table/RPC access   │   │
│  ├──────────────────────────────────────────────┤   │
│  │  Supabase Auth — session management          │   │
│  ├──────────────────────────────────────────────┤   │
│  │  Supabase Storage — file uploads             │   │
│  ├──────────────────────────────────────────────┤   │
│  │  Supabase Realtime — WebSocket subscriptions │   │
│  ├──────────────────────────────────────────────┤   │
│  │  Edge Functions — server-side logic          │   │
│  └──────────────────────────────────────────────┤   │
│  ┌──────────────────────────────────────────────┐   │
│  │  PostgreSQL                                  │   │
│  │  App tables, auth schema, audit schema       │   │
│  │  RLS on every table                          │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

               │ HTTPS (server-side only)
               ▼
┌─────────────────────────────────────────────────────┐
│           Expo API Routes (runtime: Node.js)         │
│  Server-only secrets proxy                           │
│  e.g. src/app/api/maps/ → Google Maps API            │
└─────────────────────────────────────────────────────┘
```

**Note:** There is no AKS/OpenShift cluster, no Docker containers, and no Next.js server. The mobile app communicates directly with Supabase over HTTPS/WSS. Expo API routes handle the narrow case of server-only secrets (currently only the Google Maps API proxy).

---

## Component Responsibilities

### Expo Mobile App

**Owns:**

- All UI rendering (React Native components)
- Navigation (Expo Router)
- All data fetching and state via TanStack Query
- Supabase Realtime WebSocket subscriptions
- Session management via Supabase Auth client
- All calls to Expo API routes (for server-only secrets)

**Does not own:**

- Authorization logic (RLS policies live in Supabase/PostgreSQL)
- Business logic that needs to run without the app lifecycle (use Edge Functions)
- Long-running background tasks

**Must never:**

- Call third-party APIs with secret keys directly from client code
- Store secrets in `EXPO_PUBLIC_` environment variables
- Bypass RLS by using the service role key in client code

### Supabase

**Owns:**

- PostgreSQL database and schema
- Row Level Security (all authorization lives here)
- Supabase Auth — session management for all users
- File storage (Supabase Storage)
- Realtime WebSocket subscriptions
- Edge Functions (background jobs, third-party integrations)
- Audit logs (via triggers)

**Does not own:**

- UI logic or rendering
- Application-layer validation (Zod in the mobile app handles this)

### Expo API Routes

**Owns:**

- Server-only secrets proxy (e.g. Google Maps API key)
- Any route where a secret must not be bundled into the app binary

**Does not own:**

- Auth or session management (Supabase Auth owns this)
- Database queries (direct Supabase client calls from the mobile app handle this)
- Business logic (Edge Functions handle this)

### PostgreSQL

**Owns:**

- All persistent data
- RLS enforcement (the final security gate)
- Audit triggers
- Business logic that must be atomic with data changes (via RPCs)

---

## Authentication Flows

### Supabase Auth (Email/Password or Social OAuth)

```
1. User submits login form (or clicks social provider)
2. Mobile app calls supabase.auth.signInWithPassword() (or signInWithOAuth())
3. Supabase Auth validates credentials, issues Supabase JWT
4. Supabase client stores session in secure storage (expo-secure-store)
5. All subsequent Supabase calls include the JWT automatically
   → getUser() validates the token server-side with Supabase Auth on every call
   → Never trust supabase.auth.getSession() alone — always revalidate with getUser()
6. requireAuth() in query/mutation hooks reads the validated user + active_tenant_id
7. RLS policies enforce tenant isolation in every query
```

---

## Network Communication

### Cloud Supabase

Both the mobile app and Expo API routes use the public Supabase project URL. The `anon` key is safe to expose in the app binary because RLS enforces all access control. The `service_role` key is **never** bundled into the app.

### Environment Variable Pattern

```
# Server-only (Expo API routes only — never EXPO_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_MAPS_API_KEY=...

# Safe for app binary (RLS enforces access control)
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_KEY=...
```

**Rule:** If a secret appears in an `EXPO_PUBLIC_` variable, it is not a secret. Never put service role keys or third-party API secrets in `EXPO_PUBLIC_` variables.

---

## External Integration Patterns

### Server-Only APIs (Google Maps, etc.)

```
Mobile App → Expo API Route (/api/maps/) → Google Maps API
                                         ↓
                              Returns result to mobile app
```

- **Always proxied through an Expo API route.** Never called directly from the mobile app.
- The secret API key lives in server-only environment variables, not in the app binary.

### Supabase Storage

```
Mobile App → creates signed upload URL via Supabase client → returns URL
Mobile App → uploads file directly to Supabase Storage using signed URL
```

- Files are **never** uploaded through an Expo API route. The app generates a signed URL; the upload goes directly to Supabase Storage.
- Private buckets always. No public buckets unless the asset is genuinely public.
- Storage bucket RLS policies mirror table RLS — tenant-scoped.

---

## Infrastructure Topology by Environment

| Environment | Mobile App | Supabase | Notes |
| ----------- | ---------- | -------- | ----- |
| Local dev | Expo Go / dev client on device/simulator | Local Supabase CLI (`supabase start`) or shared dev project | Full local stack optional |
| Staging | EAS preview build (TestFlight / internal track) | Dedicated staging Supabase cloud project | Mirrors production credentials shape |
| Production | App Store / Play Store | Production Supabase cloud project | Separate project, separate keys |

Each environment has its own Supabase project. Staging and production databases are never shared.

---

## What Not To Do

These are real architectural mistakes this framework exists to prevent.

| Anti-pattern | Why it's wrong | What to do instead |
| --- | --- | --- |
| Calling third-party APIs with secret keys from the mobile app | Exposes secret key in the app binary (extractable) | Always proxy through an Expo API route |
| Using service role key in client code | Bypasses all RLS — complete data exposure | Service role key is server-only, never in `EXPO_PUBLIC_` |
| Uploading files through an Expo API route | Memory pressure, upload size limits, unnecessary latency | Signed URL pattern — app uploads directly to Supabase Storage |
| Single Supabase project across staging and production | Migrations, data, and config bleed between environments | Separate Supabase project per environment |
| Storing auth state in React state or AsyncStorage manually | Session can desync from Supabase Auth state | Use Supabase client session listener (`onAuthStateChange`) as the single source of truth |

---

## Decisions Log

| Decision | Choice | Rationale |
| --- | --- | --- |
| Auth provider | Supabase Auth | Cloud-hosted, no self-hosting required; covers email/password and social OAuth |
| File upload pattern | Signed URL — app uploads directly to Supabase Storage | Expo API routes are not file upload proxies; avoids memory pressure and size limits |
| Service role key scope | Server-only environment variables (Expo API routes) | RLS must never be bypassable from a client-influenced context |
| Realtime from mobile app | App → public Supabase URL directly via WebSocket | Standard Supabase Realtime client; RLS enforces access |
| Environment isolation | Separate Supabase project per environment | Prevents staging operations from affecting production schema or data |
| Third-party secret proxy | Expo API routes | Narrow server-side surface for secrets; keeps the app binary clean |
