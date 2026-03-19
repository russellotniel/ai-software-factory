# Caching Strategy

> Part of the AI Software Factory — Data Fetching OS
> Written for **Next.js 16** (current stable as of 2026)

## Overview

Next.js 16 introduces Cache Components — an explicit, opt-in caching model. Nothing is cached by default. You place `'use cache'` on the functions or components you want cached, then use `cacheLife` to control duration and `cacheTag` to enable on-demand invalidation.

This replaces `unstable_cache`, which still exists but is deprecated. Migrate to `'use cache'`.

**Enable Cache Components in every project:**

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true // Required to use 'use cache', cacheLife, cacheTag
};

export default nextConfig;
```

There are four caching layers in the stack. Understand them separately — they compose, they do not replace each other.

| Layer                | Where               | What it caches                                          | Controlled by                            |
| -------------------- | ------------------- | ------------------------------------------------------- | ---------------------------------------- |
| TanStack Query Cache | Client (in-memory)  | Server state between renders                            | `staleTime`, `gcTime`, `queryClient`     |
| Cache Components     | Server (persistent) | Functions, components, Supabase queries, any async work | `'use cache'`, `cacheLife`, `cacheTag`   |
| Next.js Data Cache   | Server (persistent) | `fetch()` responses only                                | `cache`, `next.revalidate`, `next.tags`  |
| Router Cache         | Client (in-memory)  | RSC payload of visited segments                         | Navigation, prefetch, `router.refresh()` |

**Critical for Supabase:** The Supabase JS client (`supabase.from(...).select(...)`) does **not** use the native `fetch()` that Next.js extends. Supabase queries bypass the Next.js Data Cache entirely. Use `'use cache'` to cache Supabase data on the server.

---

## Layer 1: TanStack Query Cache (Primary Client Cache)

The primary caching mechanism for all client-side data. Handles fetching, caching, deduplication, background revalidation, and synchronisation between Client Components.

**Configuration (project-wide defaults):**

```typescript
// lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute — data considered fresh, no refetch
        gcTime: 5 * 60 * 1000, // 5 minutes — removed from cache if no subscribers
        retry: 1,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
      }
    }
  });
}
```

**Per-query overrides:**

```typescript
// Long-lived reference data — tenant config, user roles
useQuery({
  queryKey: ["tenant-config", tenantId],
  queryFn: () => fetchTenantConfig(tenantId),
  staleTime: 10 * 60 * 1000,
  gcTime: 30 * 60 * 1000
});

// Frequently updated — notifications, activity feed
useQuery({
  queryKey: ["notifications", userId],
  queryFn: () => fetchNotifications(userId),
  staleTime: 0, // Always stale — refetches on mount/focus
  refetchInterval: 30 * 1000 // Poll every 30 seconds
});
```

**Invalidation after mutations:**

```typescript
const queryClient = useQueryClient();

queryClient.invalidateQueries({ queryKey: ["projects", tenantId] });
queryClient.invalidateQueries({ queryKey: ["projects", tenantId, projectId] });
```

---

## Layer 2: Cache Components (Primary Server Cache)

Cache Components is the Next.js 16 server-side caching model. Add `'use cache'` to any async function or Server Component to cache its output. Works with Supabase queries, database queries, `fetch()` calls, file system operations — any async work.

### The `'use cache'` directive

```typescript
import { cacheLife, cacheTag } from 'next/cache';

// Cache a data-fetching function — works with Supabase, any DB, any async work
export async function getCachedTenantConfig(tenantId: string) {
  'use cache';
  cacheTag('tenant-config', `tenant-config-${tenantId}`);
  cacheLife('hours');   // Server revalidates every hour

  const supabase = await createServerClient();
  const { data } = await supabase
    .from('tenants')
    .select('id, name, plan, settings')
    .eq('id', tenantId)
    .single();
  return data;
}

// Cache an entire Server Component
async function CachedNavigation() {
  'use cache';
  cacheLife('days');
  const menuItems = await getMenuStructure();
  return <Nav items={menuItems} />;
}
```

### Built-in `cacheLife` profiles

Choose the profile that matches how often the data changes:

| Profile     | Revalidates   | Expires | Use for                       |
| ----------- | ------------- | ------- | ----------------------------- |
| `'seconds'` | Every 1s      | 1 min   | Real-time data, live scores   |
| `'minutes'` | Every 1 min   | 1 hr    | Social feeds, news            |
| `'hours'`   | Every 1 hr    | 1 day   | Product inventory, weather    |
| `'days'`    | Every 1 day   | 1 week  | Blog posts, articles          |
| `'weeks'`   | Every 1 week  | 1 month | Podcasts, newsletters         |
| `'max'`     | Every 1 month | Never   | Legal pages, archived content |

For custom control, pass an inline object:

```typescript
"use cache";
cacheLife({
  stale: 60, // Client uses cached data for 1 minute without checking server
  revalidate: 300, // Server regenerates after 5 minutes
  expire: 3600 // Cache entry discarded after 1 hour of no traffic
});
```

Define reusable named profiles in `next.config.ts`:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    "tenant-config": {
      stale: 60 * 5, // 5 minutes
      revalidate: 600, // 10 minutes
      expire: 3600 // 1 hour
    }
  }
};
```

### On-demand invalidation

Use `revalidateTag` in Server Actions and Route Handlers. In Next.js 16, `revalidateTag` requires a second argument — the cacheLife profile for background revalidation. Use `'max'` for most cases (stale-while-revalidate: users see cached data while it updates in the background).

```typescript
// Server Action — after tenant settings change
"use server";
import { revalidateTag } from "next/cache";

export async function updateTenantSettings(
  tenantId: string,
  settings: TenantSettings
): Promise<ActionResult<void>> {
  const { tenantId: authedTenantId } = await requireAuth();
  if (tenantId !== authedTenantId)
    return { success: false, error: "FORBIDDEN" };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("tenants")
    .update({ settings })
    .eq("id", tenantId);

  if (error) return { success: false, error: "DB_ERROR" };

  // Second argument required in Next.js 16 — enables stale-while-revalidate
  revalidateTag(`tenant-config-${tenantId}`, "max");

  return { success: true };
}
```

```typescript
// Route Handler — webhook from third-party service
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const event = await verifyAndParseWebhook(request);
  if (event.type === "subscription.updated") {
    revalidateTag("tenant-config", "max");
  }
  return Response.json({ received: true });
}
```

**Use `updateTag` for read-your-writes in Server Actions** — unlike `revalidateTag`, `updateTag` makes the current response see the fresh data immediately:

```typescript
"use server";
import { updateTag } from "next/cache";

export async function publishPost(postId: string): Promise<ActionResult<void>> {
  await requireAuth();
  await db.posts.update(postId, { status: "published" });
  updateTag(`post-${postId}`); // Immediate — current request sees fresh data
  return { success: true };
}
```

### What NOT to cache with `'use cache'`

```typescript
// WRONG — shared cache keyed only by userId; one user's data served to another
export async function getUserProjects(userId: string) {
  "use cache";
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId);
  return data;
}

// WRONG — RLS applies per-user; caching flattens that security boundary
export async function getTenantData() {
  "use cache";
  const { data } = await supabase.from("sensitive_records").select("*");
  return data;
}
```

**Safe to cache:** Tenant config/plan, reference tables (countries, categories), public content, external API responses, anything shared identically across all users.

---

## Layer 3: Next.js Data Cache (fetch() Only)

Applies **only** to native `fetch()` calls — not Supabase queries, not ORMs. Use for third-party external API calls.

```typescript
// Default — uncached, fetches fresh every request
const res = await fetch("https://api.example.com/data");

// Cache indefinitely
const res = await fetch("https://api.example.com/data", {
  cache: "force-cache"
});

// Time-based revalidation
const res = await fetch("https://api.example.com/data", {
  next: { revalidate: 3600 }
});

// Tag-based on-demand revalidation
const res = await fetch("https://api.example.com/products", {
  next: { tags: ["products"] }
});
```

Prefer `'use cache'` over `next.revalidate` on `fetch()` for new code — consistent model, works with Supabase too, and `cacheTag` is more explicit than `next.tags`.

---

## Layer 4: Router Cache (Client Navigation Cache)

Stores RSC payloads in the browser. In Next.js 16, page segments are not prefetched by default — layouts are still cached. Largely automatic.

```typescript
// Force refresh — re-fetches dynamic data from server
router.refresh();
```

After a mutation, call `router.refresh()` if the updated data is rendered server-side (not via TanStack Query). If data is in TanStack Query, `invalidateQueries` is sufficient.

---

## Decision: What to Cache and Where

| Data type                              | Cache it?          | Where                                 | Mechanism                        |
| -------------------------------------- | ------------------ | ------------------------------------- | -------------------------------- |
| User-specific data (projects, records) | No server cache    | TanStack Query (client)               | `staleTime` per query            |
| Tenant config / plan                   | Yes                | `'use cache'` (server)                | `cacheLife('hours')`, `cacheTag` |
| Public / shared reference data         | Yes                | `'use cache'` (server)                | `cacheLife('days')` or `'max'`   |
| External API calls                     | Yes                | Data Cache (`fetch`) or `'use cache'` | `next.revalidate` or `cacheLife` |
| Authentication state                   | Never cache        | Always fresh via `requireAuth()`      | `getUser()` per request          |
| RLS-governed data                      | Never server-cache | TanStack Query                        | Isolated per user session        |

---

## Invalidation Patterns

### After Mutations — Full Pattern

```typescript
// Server Action
"use server";
import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";

export async function createProject(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult<Project>> {
  const { tenantId } = await requireAuth();
  // ... validate, insert ...

  // Invalidate route cache if Server Components render this data
  revalidatePath("/dashboard/projects");

  // Invalidate 'use cache' entries
  revalidateTag("projects", "max");

  return { success: true, data: project };
}
```

```typescript
// Client Component — sync TanStack Query after Server Action resolves
const queryClient = useQueryClient();
const [state, formAction] = useActionState(createProject, null);

useEffect(() => {
  if (state?.success) {
    queryClient.invalidateQueries({ queryKey: ["projects", tenantId] });
  }
}, [state]);
```

---

## Anti-Patterns

| Anti-pattern                                          | Problem                                          | Correct approach                                    |
| ----------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| `'use cache'` on user-specific data                   | Shared cache — one user's data served to another | TanStack Query, scoped to session                   |
| `'use cache'` on RLS-governed data                    | Bypasses row-level security                      | Never server-cache RLS data                         |
| `unstable_cache` (deprecated)                         | Replaced by `'use cache'`                        | Migrate to `'use cache'` + `cacheLife` + `cacheTag` |
| `cache: 'force-cache'` on auth fetches                | Stale tokens, security risk                      | Always `no-store` for auth-related fetches          |
| `revalidateTag('tag')` without second arg             | Deprecated single-arg form — no SWR behaviour    | `revalidateTag('tag', 'max')`                       |
| `cacheComponents` not set in `next.config.ts`         | `'use cache'` directive silently ignored         | Always set `cacheComponents: true`                  |
| Polling with `refetchInterval` without `staleTime: 0` | Stale check prevents actual refetch              | Set `staleTime: 0` when polling                     |
| Never invalidating after mutations                    | Stale UI until cache expires                     | `invalidateQueries` + `revalidateTag` after writes  |
