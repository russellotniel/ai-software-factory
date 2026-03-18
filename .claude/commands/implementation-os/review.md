# /implementation:review

Review existing implementation code against AI Software Factory standards.

Read `implementation-os/standards.md` before starting.

---

## Process

Ask: "Which file or directory should I review?"
Accept: a file path, a feature directory, or "all features" for `src/features/`.

For each file, check:

### Hooks (useQuery / useMutation)

- [ ] All data fetching uses TanStack Query — no `useEffect` + `fetch` (known exception: `useLocationAutocomplete`)
- [ ] Input validated with `safeParse()` before any Supabase call — never `parse()`
- [ ] `AppError` thrown on validation failure or Supabase error — never raw `Error` or plain string
- [ ] No service_role key anywhere in client-side code
- [ ] Mutation `onSuccess` calls `queryClient.invalidateQueries()`

### Components

- [ ] No direct Supabase calls in component bodies — data comes from hooks
- [ ] No `'use server'` or `'use client'` directives — not applicable in React Native
- [ ] Error states check `query.error` and render inline retry UI
- [ ] Loading states check `query.isPending` or `query.isLoading`

### State management

- [ ] TanStack Query for all server state
- [ ] React Context (`src/contexts/`) for cross-cutting app state (user, location, credits)
- [ ] No Zustand or Redux
- [ ] URL/navigation params for screen-level state (place ID, source param, etc.)

### Type safety

- [ ] No `any` types
- [ ] Database types from `src/types/db.ts` (Supabase-generated) — not hand-written
- [ ] Domain types inferred from Zod schemas (`z.infer<typeof Schema>`)
- [ ] API response types inferred from Zod schemas (e.g. `GooglePlaceDetail`)

### Report format

```
❌ src/hooks/usePlacesQuery.ts:18
   Issue: Uses parse() instead of safeParse() in mock data helper
   Standard: implementation-os/standards.md — Validation
   Fix: Replace with safeParse() when real Supabase integration is wired

✅ src/hooks/usePlaceDetails.ts — useQuery correct, safeParse on response,
   AppError thrown on failure, enabled guard on placeId
```

End with a summary and offer to apply fixes.

---

## ✅ What's Next

Tell the user:

"Review complete. Fix any issues found, then return to whatever you were working on.

- **If you were in the middle of a feature:** continue with `/qa:new-tests`
- **If you ran this as a standalone audit:** you're done"

```
Next command: /qa:new-tests        (if continuing a feature)
         OR: back to your current task
```
