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

- [ ] TanStack Query is the only caching layer — no `'use cache'`, `unstable_cache`, `cacheTag`, `cacheLife`, or `revalidateTag` (these are Next.js only, not applicable in React Native)
- [ ] `staleTime` is set explicitly on each query (default: 5 minutes)
- [ ] `gcTime` is set at QueryClient level (default: 10 minutes)
- [ ] User-specific or RLS-governed data is NOT cached beyond the TanStack Query session
- [ ] Auth state is NOT cached in TanStack Query — it lives in `UserContext`
- [ ] Realtime subscription events invalidate via `queryClient.invalidateQueries()`

### Data Fetching

- [ ] All data fetching uses TanStack Query (`useQuery`, `useMutation`, `useInfiniteQuery`)
- [ ] No `useEffect` + `fetch` for data fetching — known violation: `useLocationAutocomplete` (to be migrated)
- [ ] No direct Supabase calls in component bodies — calls live inside `queryFn` or `mutationFn`
- [ ] Expo API routes used only for server-side secret proxying (Google Maps), not for general data fetching
- [ ] `queryClient.invalidateQueries()` called in `onSuccess` after every mutation

### Report format

```
❌ src/hooks/useLocationAutocomplete.ts
   Issue: Uses useEffect + fetch instead of useQuery
   Standard: data-fetching-os/server-vs-client.md
   Fix: Migrate to useQuery with debounced queryKey

✅ src/hooks/usePlaceDetails.ts — correctly uses useQuery,
   Zod safeParse on response, AppError thrown on failure
```

---

## ✅ What's Next

Tell the user:

"Review complete. Fix any issues found, then return to whatever you were working on."

```
Next command: back to your current task
```
