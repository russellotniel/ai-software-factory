# Server vs Client Data Fetching

> Part of the AI Software Factory — Data Fetching OS

## The Core Rule

**Default to Server Components. Push `'use client'` to the leaves.**

A Server Component that renders a Client Component is fine. A Client Component cannot render a Server Component inside it. Every time you add `'use client'`, you draw a boundary — everything below that boundary ships to the browser.

---

## Decision Tree

```
Is this data needed for the initial render?
│
├── YES — Does it differ per user / depend on auth?
│   │
│   ├── YES — Fetch in Server Component
│   │         • await supabase query directly
│   │         • requireAuth() to get tenantId / userId
│   │         • Pass result as props to Client Components
│   │         • Use HydrationBoundary if Client Component also
│   │           needs to refetch / mutate this data later
│   │
│   └── NO — Is it shared across all users?
│             • 'use cache' directive with cacheLife + cacheTag
│             • Or fetch at build time (static route)
│
└── NO — Is it triggered by user interaction?
    │
    ├── User interacts → data changes (mutation)
    │   • Server Action — always
    │   • useMutation (TanStack Query) to manage state
    │
    └── User interacts → data loads (lazy / conditional)
        • useQuery (TanStack Query) in a Client Component
        • Prefetch with HydrationBoundary if first load needs to be fast
```

---

## Patterns

### Pattern 1: Pure Server Fetch (Most Common)

Data is fetched on the server and rendered entirely in Server Components. No client-side data fetching needed.

**Use when:** The page or section is read-only, doesn't require real-time updates, and the user doesn't need to interact with or mutate the data after load.

```typescript
// app/(dashboard)/projects/[id]/page.tsx
import { requireAuth } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default async function ProjectPage({ params }: Props) {
  const { tenantId } = await requireAuth();
  const supabase = await createServerClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, description, status, created_at, members(id, display_name)')
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .single();

  if (!project) notFound();

  return <ProjectDetail project={project} />;
}
```

**No TanStack Query, no `useEffect`, no `useState` for data.** Just `await`.

---

### Pattern 2: Server Fetch + Client Interactivity (Standard)

Data is fetched on the server for the initial render, then the Client Component manages further interaction, mutations, and refetching.

**Use when:** A page has data on load AND the user can mutate or filter that data interactively.

```typescript
// app/(dashboard)/projects/page.tsx — Server Component
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/query-client';
import { requireAuth } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';
import { ProjectsDashboard } from './_components/ProjectsDashboard';

export default async function ProjectsPage() {
  const { tenantId } = await requireAuth();
  const queryClient = makeQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['projects', tenantId],
    queryFn: async () => {
      const supabase = await createServerClient();
      const { data } = await supabase
        .from('projects')
        .select('id, name, status, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectsDashboard tenantId={tenantId} />
    </HydrationBoundary>
  );
}
```

```typescript
// _components/ProjectsDashboard.tsx — Client Component
'use client';
import { useProjects } from '@/features/projects/queries';

interface Props {
  tenantId: string;
}

export function ProjectsDashboard({ tenantId }: Props) {
  // Data is already in cache from server prefetch — no loading spinner on first render
  const { data: projects, isLoading } = useProjects(tenantId);

  return (
    <div>
      {projects?.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

---

### Pattern 3: Lazy / Conditional Client Fetch

Data is not needed on initial render — it loads in response to a user action (tab switch, filter, modal open, infinite scroll).

**Use when:** Data is behind a user interaction, or the volume of data makes it impractical to load everything server-side.

```typescript
'use client';
import { useQuery } from '@tanstack/react-query';

interface Props {
  tenantId: string;
  selectedStatus: string;
}

export function ProjectsByStatus({ tenantId, selectedStatus }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects', tenantId, { status: selectedStatus }],
    queryFn: () => fetchProjectsByStatus(tenantId, selectedStatus),
    // Only fetch when a status is selected
    enabled: !!selectedStatus,
  });

  if (isLoading) return <ProjectsSkeleton />;
  if (isError) return <ErrorState />;

  return <ProjectList projects={data ?? []} />;
}
```

---

### Pattern 4: Mutations with Server Actions

All writes go through Server Actions. Client Components trigger the action and use TanStack Query to sync the cache.

```typescript
// features/projects/actions.ts
"use server";
import { requireAuth } from "@/lib/auth/server";
import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";
import { CreateProjectSchema } from "./schemas";

export async function createProject(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const { tenantId } = await requireAuth();
  const parsed = CreateProjectSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      success: false,
      error: "VALIDATION_ERROR",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, tenant_id: tenantId })
    .select("id")
    .single();

  if (error) return { success: false, error: "DB_ERROR" };

  revalidatePath("/dashboard/projects");
  return { success: true, data: { id: data.id } };
}
```

```typescript
// _components/CreateProjectForm.tsx
'use client';
import { useActionState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createProject } from '../actions';

export function CreateProjectForm({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const [state, formAction, isPending] = useActionState(createProject, null);

  useEffect(() => {
    if (state?.success) {
      queryClient.invalidateQueries({ queryKey: ['projects', tenantId] });
    }
  }, [state, tenantId, queryClient]);

  return (
    <form action={formAction}>
      <input name="name" required />
      {state?.success === false && <p>{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
}
```

---

## Where Does the Supabase Client Live?

The right client depends on where the code runs.

| Context                                           | Client                  | Import                  |
| ------------------------------------------------- | ----------------------- | ----------------------- |
| Server Components, Server Actions, Route Handlers | `createServerClient()`  | `@/lib/supabase/server` |
| Client Components (browser only)                  | `createBrowserClient()` | `@/lib/supabase/client` |

**Never use the browser client in Server Components or Server Actions.** It carries the anon key and does not have access to the server-side session cookie.

```typescript
// lib/supabase/server.ts — async, reads cookies for the session
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function createServerClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
}
```

```typescript
// lib/supabase/client.ts — singleton, lives in browser
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export function createBrowserClientInstance() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

---

## What Belongs on the Server vs Client

### Always on the server

- `requireAuth()` / session validation
- Any query involving `SERVICE_ROLE_KEY`
- Queries where RLS is the security boundary (never call from client if the intent is security)
- File upload — get a signed URL server-side, upload from client
- Aggregations or joins that are expensive and don't change per interaction

### Always on the client

- Anything that responds to user interaction in real-time (search, filter, infinite scroll)
- Optimistic updates
- Subscriptions (Supabase Realtime)
- Polling

### Either (decide per feature)

- Initial page data — prefer server; use `HydrationBoundary` if the client also needs to refetch
- List pages with filters — fetch unfiltered server-side, filter client-side via TanStack Query with `enabled`

---

## Anti-Patterns

| Anti-pattern                                                | Problem                                                             | Correct approach                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `useEffect` + `fetch` in a Client Component                 | No caching, no deduplication, no DevTools                           | `useQuery` with TanStack Query                                                       |
| Supabase query in a Client Component without TanStack Query | No cache, double-fetches on re-render                               | Wrap in `useQuery`                                                                   |
| Calling a Server Action from `useEffect`                    | Actions run on mount, bypassing form state management               | Use `useActionState` for form-bound actions; `useMutation` for programmatic triggers |
| Importing server-only code into a Client Component          | Runtime error — `cookies()`, `headers()` don't exist in the browser | Mark server utilities with `import 'server-only'`                                    |
| `createServerClient()` in a Client Component                | Can't call `cookies()` in the browser                               | Use `createBrowserClientInstance()`                                                  |
| Fetching inside a `useEffect` for initial data              | Loading spinner on every mount                                      | Prefetch in Server Component with `HydrationBoundary`                                |
| Returning large data sets from Server Actions               | Actions are not designed for data fetching                          | Use Server Components or `useQuery` for reads                                        |

---

## Realtime (Supabase)

Supabase Realtime is client-only. Subscriptions open a WebSocket from the browser. The pattern is: server-fetch the initial data, subscribe client-side for updates.

```typescript
"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserClientInstance } from "@/lib/supabase/client";

export function useProjectsRealtime(tenantId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createBrowserClientInstance();

    const channel = supabase
      .channel(`projects:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          // Invalidate TanStack Query cache — triggers a refetch
          queryClient.invalidateQueries({ queryKey: ["projects", tenantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient]);
}
```

Call this hook in the same Client Component that uses `useProjects(tenantId)`. The Realtime event triggers `invalidateQueries`, which causes TanStack Query to refetch — keeping the UI in sync without managing separate state.
