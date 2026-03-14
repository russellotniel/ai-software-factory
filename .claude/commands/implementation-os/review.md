# /implementation:review

Review existing implementation code against AI Software Factory standards.

Read `implementation-os/standards.md` before starting.

---

## Process

Ask: "Which file or directory should I review?"
Accept: a file path, a feature directory, or "all features" for `src/features/`.

For each file, check:

### Server Actions

- [ ] `'use server'` at top of file
- [ ] Returns `ActionResult<T>` — never throws
- [ ] `requireAuth()` is first call in every action
- [ ] Input validated with `safeParse()` before any database call
- [ ] No service_role key in client-callable code

### Components

- [ ] Forms use React Hook Form + Zod resolver
- [ ] No `useEffect` + `fetch` for data fetching (use TanStack Query)
- [ ] `'use client'` is at leaf level, not on parent layouts
- [ ] No direct Supabase client calls in Client Components

### State management

- [ ] URL state for shareable/bookmarkable state
- [ ] No Zustand for data that comes from the server
- [ ] No Redux

### Type safety

- [ ] No `any` types
- [ ] Database types from Supabase-generated types, not hand-written
- [ ] Zod schemas are source of truth for input shapes

### Report format

```
❌ src/features/projects/actions.ts:42
   Issue: Input not validated before database call
   Standard: implementation-os/standards.md — Validation
   Fix: Add safeParse() before the supabase call

✅ src/features/projects/schemas.ts — Zod schemas correct, types exported
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
