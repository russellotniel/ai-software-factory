# Caching Strategy

> Part of the AI Software Factory — Data Fetching OS
> Written for **Expo (React Native) + Supabase**

## Overview

React Native has one caching layer: **TanStack Query**. There is no server-side caching (`'use cache'`), no Next.js Data Cache, and no Router Cache. All cached state lives in the TanStack Query `QueryClient` in memory for the duration of the app session.

---

## TanStack Query Cache — The Only Cache

The `QueryClient` is the single source of truth for all server state in the app.

### Project-wide defaults

```typescript
// Configured in AppProviders.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,         // 5 minutes — data is fresh, no background refetch
      gcTime: 10 * 60 * 1000,           // 10 minutes — removed from cache if no subscribers
      retry: 1,
      refetchOnWindowFocus: false,       // Disable — mobile apps don't have window focus
      refetchOnReconnect: true,          // Refetch when network reconnects
    },
  },
});
```

### Per-query overrides

```typescript
// Long-lived reference data — tenant config, categories
useQuery({
  queryKey: ['tenant-config', tenantId],
  queryFn: () => fetchTenantConfig(tenantId),
  staleTime: 10 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
});

// Frequently updated — notifications, activity feed
useQuery({
  queryKey: ['notifications', userId],
  queryFn: () => fetchNotifications(userId),
  staleTime: 0,                          // Always stale — refetches on mount
  refetchInterval: 30 * 1000,            // Poll every 30 seconds
});
```

### Invalidation after mutations

```typescript
const queryClient = useQueryClient();

// Invalidate all moments for this tenant
queryClient.invalidateQueries({ queryKey: ['moments', tenantId] });

// Invalidate a single item
queryClient.invalidateQueries({ queryKey: ['moments', tenantId, momentId] });
```

---

## Query Key Conventions

Keys are arrays. Structure: `[resource, tenantId/userId, ...filters]`

```typescript
['places', tenantId]
['places', tenantId, placeId]                    // single place
['places', tenantId, { status: 'active' }]       // filtered
['moments', tenantId]
['profile', userId]
['saved-places', userId]
['activity-feed', tenantId]
```

---

## What to Cache and How Long

| Data type | Cache it? | staleTime | Notes |
| --- | --- | --- | --- |
| Content lists (places, moments) | Yes | 5 min (default) | Invalidate after mutations |
| Single item detail | Yes | 5 min (default) | Invalidate after update/delete |
| User profile | Yes | 5 min | Invalidate after profile update |
| Saved items | Yes | 5 min | Invalidate after save/unsave |
| Business credit balance | Yes | 1 min | Invalidate after top-up/spend |
| Auth session / user identity | No | — | Managed by Supabase Auth + UserContext |
| RLS-governed sensitive data | Never exceed gcTime | Default | Never persist beyond session |

---

## Realtime — Keeping Cache in Sync

For live data, use Supabase Realtime to invalidate the TanStack Query cache rather than managing separate state.

Pattern: `useQuery` for initial data → `useEffect` Realtime subscription → `invalidateQueries` on change.

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`moments:${tenantId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'moments', filter: `tenant_id=eq.${tenantId}` },
      () => {
        queryClient.invalidateQueries({ queryKey: ['moments', tenantId] });
      },
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [tenantId, queryClient]);
```

---

## Anti-Patterns

| Anti-pattern | Problem | Correct approach |
| --- | --- | --- |
| Storing fetched data in React Context | Duplicates TanStack Query, causes stale data | Keep server state in TanStack Query |
| `useEffect` fetch without TanStack Query | No caching, no deduplication | Always use `useQuery` |
| Never invalidating after mutations | Stale UI until gcTime expires | `invalidateQueries` in `onSuccess` |
| `staleTime: 0` without `refetchInterval` | Refetches on every render | Only use `staleTime: 0` for polling or real-time |
| Polling with `refetchInterval` without `staleTime: 0` | Stale check prevents actual refetch | Set `staleTime: 0` when using `refetchInterval` |
| Caching auth state in QueryClient | Race conditions with Supabase Auth | Use `UserContext` / Supabase Auth session |
