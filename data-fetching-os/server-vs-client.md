# Data Fetching

> Part of the AI Software Factory — Data Fetching OS
> Written for **Expo (React Native) + Supabase**

## The Core Rule

**All data fetching uses TanStack Query.** React Native has no Server Components — every component is client-side. `useEffect` + `fetch` and bare `useEffect` + Supabase calls are banned. TanStack Query handles caching, deduplication, background refetch, loading states, and error states.

---

## Decision Tree

```
Does this component need data?
│
├── READ (display data)
│   └── useQuery (TanStack Query)
│         • queryFn calls supabase directly
│         • validate response with Zod safeParse
│         • queryKey: [resource, tenantId, ...filters]
│
├── WRITE (create / update / delete)
│   └── useMutation (TanStack Query)
│         • mutationFn calls supabase directly
│         • onSuccess: invalidate affected queryKeys
│         • validate input with Zod safeParse before calling supabase
│
└── LIVE (real-time updates)
    └── useEffect subscription + invalidateQueries
          • supabase.channel(...).on('postgres_changes', ...)
          • on event: queryClient.invalidateQueries(...)
          • cleanup: supabase.removeChannel(channel) on unmount
```

---

## Patterns

### Pattern 1: Query (Most Common)

Use for all read operations — lists, detail views, profile data, etc.

```typescript
// hooks/usePlacesQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { PlaceSchema } from '@/types';
import { AppError } from '@/utils/error';
import { z } from 'zod';

export function usePlacesQuery(tenantId: string) {
  return useQuery({
    queryKey: ['places', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw AppError.from(error, 'usePlacesQuery');

      const parsed = z.array(PlaceSchema).safeParse(data);
      if (!parsed.success) throw AppError.from(parsed.error, 'usePlacesQuery:parse');
      return parsed.data;
    },
    enabled: !!tenantId,
  });
}
```

```typescript
// features/place/PlaceScreen.tsx
export function PlaceScreen() {
  const { userData } = useContext(UserContext);
  const { data: places, isLoading, isError } = usePlacesQuery(userData?.tenantId);

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState />;

  return <PlaceList places={places ?? []} />;
}
```

---

### Pattern 2: Mutation

Use for all writes — create, update, delete.

```typescript
// hooks/useCreateMoment.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { CreateMomentSchema } from '@/types';
import { AppError } from '@/utils/error';
import type { z } from 'zod';

type Input = z.infer<typeof CreateMomentSchema>;

export function useCreateMoment(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Input) => {
      const parsed = CreateMomentSchema.safeParse(input);
      if (!parsed.success) throw AppError.from(parsed.error, 'useCreateMoment:validate');

      const { data, error } = await supabase
        .from('moments')
        .insert(parsed.data)
        .select()
        .single();

      if (error) throw AppError.from(error, 'useCreateMoment:insert');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments', tenantId] });
    },
  });
}
```

---

### Pattern 3: RPC (Complex Operations)

For joins, aggregations, or business logic — use Supabase RPC instead of direct table queries.

```typescript
// hooks/useActivityFeedQuery.ts
export function useActivityFeedQuery(tenantId: string) {
  return useQuery({
    queryKey: ['activity-feed', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_activity_feed', { p_tenant_id: tenantId });

      if (error) throw AppError.from(error, 'useActivityFeedQuery');
      return data;
    },
    enabled: !!tenantId,
  });
}
```

Full RPC standards: `architecture-os/rpc-standards.md`

---

### Pattern 4: Realtime Subscription

Initial data fetched via `useQuery`. Subscription invalidates cache on change.

```typescript
// hooks/useMomentsRealtime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useMomentsRealtime(tenantId: string) {
  const queryClient = useQueryClient();

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
}
```

Call this hook alongside `useMomentsQuery` in the same screen component.

---

## Where the Supabase Client Lives

One client, shared across the app:

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { env } from '@/constants/env';

export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_KEY,
);
```

There is no server/browser client split in React Native. One client, one session managed by Supabase Auth.

---

## What Belongs Where

| Responsibility | Location |
| --- | --- |
| Auth session | Supabase Auth + `UserContext` |
| Data reads | `useQuery` in `src/hooks/` |
| Data writes | `useMutation` in `src/hooks/` |
| Complex queries/aggregations | Supabase RPC → `useQuery` |
| Real-time updates | `useEffect` subscription + `invalidateQueries` |
| Input validation | `safeParse()` before every Supabase call |
| Error normalization | `AppError.from(error, context)` |

---

## Anti-Patterns

| Anti-pattern | Problem | Correct approach |
| --- | --- | --- |
| `useEffect` + `fetch` | No caching, no deduplication, no DevTools | `useQuery` |
| `useEffect` + bare Supabase call | No cache, double-fetches on re-render | Wrap in `useQuery` |
| Supabase call outside a hook | Cannot be cancelled, no cache | Always wrap in `useQuery` or `useMutation` |
| `parse()` instead of `safeParse()` | Throws unhandled exception on bad data | Always `safeParse()` |
| Storing fetched data in React Context | Duplicates TanStack Query's responsibility | Keep server state in TanStack Query |
| Direct Supabase calls in components | Bypasses caching, hard to test | Always go through a custom hook |
