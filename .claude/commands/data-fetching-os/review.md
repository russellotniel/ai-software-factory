# /data-fetching:review

Audit data fetching patterns against caching and server/client standards.

Read before starting:

- `data-fetching-os/caching-strategy.md`
- `data-fetching-os/server-vs-client.md`

---

## Process

Ask: "Which file or directory should I review?"

For each file, check:

### Caching

- [ ] Supabase queries wrapped in `'use cache'` functions where appropriate
- [ ] `cacheTag` set for granular invalidation
- [ ] `cacheLife` set explicitly
- [ ] `revalidateTag` called with two args: `revalidateTag('tag', 'max')`
- [ ] User-specific or RLS-governed data is NOT cached
- [ ] Auth state is NOT cached
- [ ] `unstable_cache` is NOT used (deprecated in Next.js 16)

### Server vs Client

- [ ] Default to Server Components — `'use client'` only at leaf level
- [ ] No `useEffect` + `fetch` patterns
- [ ] TanStack Query for all client-side data fetching
- [ ] `HydrationBoundary` + `prefetchQuery` where client component needs
      data on first render without a loading spinner
- [ ] Realtime subscriptions invalidate via `queryClient.invalidateQueries()`

### Report format

```
❌ src/features/dashboard/components/DashboardStats.tsx
   Issue: Direct Supabase query in Client Component via useEffect+fetch
   Standard: data-fetching-os/server-vs-client.md
   Fix: Move query to Server Component parent, pass data as props

✅ src/features/projects/queries.ts — Correctly wrapped with 'use cache',
   cacheTag and cacheLife set
```

---

## ✅ What's Next

Tell the user:

"Review complete. Fix any issues found, then return to whatever you were working on."

```
Next command: back to your current task
```
