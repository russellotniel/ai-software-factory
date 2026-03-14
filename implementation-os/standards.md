# Implementation OS — Standards

**Status:** Active  
**Last Updated:** 2026-03-09  
**Scope:** All Next.js + Supabase projects

---

## Purpose

This document defines how code is written, structured, and organised across all projects. It covers folder structure, naming conventions, component rules, data fetching, state management, forms, hooks, and TypeScript standards. Every developer and AI agent writes code to this standard — no exceptions without a recorded decision.

---

## Project Folder Structure

```
my-project/
├── public/                        # Static assets (images, fonts, icons)
├── src/
│   ├── app/                       # Next.js App Router — routing only
│   │   ├── (auth)/                # Route group — auth pages (no URL segment)
│   │   │   ├── login/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/   # Private — only used by this route
│   │   │   │       └── LoginForm.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/           # Route group — authenticated app
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── _components/   # Private — only used by projects routes
│   │   │   │       ├── ProjectList.tsx
│   │   │   │       └── ProjectCard.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── api/                   # Route Handlers (webhooks, external HTTP)
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts       # Supabase auth callback
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing / root page
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   │
│   ├── components/                # Shared, reusable components
│   │   ├── ui/                    # Shadcn generated components — never edit directly
│   │   └── [shared-component].tsx # Custom shared components composed on top of ui/
│   │
│   ├── features/                  # Feature modules (for large domains)
│   │   └── [feature-name]/
│   │       ├── actions.ts         # Server Actions for this feature
│   │       ├── queries.ts         # TanStack Query hooks for this feature
│   │       ├── types.ts           # Feature-specific types
│   │       └── components/        # Feature-specific components
│   │
│   ├── hooks/                     # Shared custom hooks
│   ├── lib/                       # Shared utilities and configurations
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser Supabase client
│   │   │   ├── server.ts          # Server Supabase client
│   │   │   └── proxy.ts           # updateSession() helper — called by root proxy.ts
│   │   ├── auth/
│   │   │   └── server.ts          # requireAuth() helper
│   │   └── logger.ts              # Logger abstraction
│   ├── types/                     # Global TypeScript types
│   │   ├── actions.ts             # ActionResult<T>, ActionError
│   │   ├── api.ts                 # ApiResponse<T>
│   │   └── database.ts            # Generated Supabase types
│   └── styles/
│       └── globals.css            # Tailwind + Shadcn CSS variables
├── supabase/
│   ├── migrations/                # SQL migration files
│   └── functions/                 # Supabase Edge Functions
├── .claude/
│   ├── CLAUDE.md
│   └── commands/
├── proxy.ts                       # Next.js Proxy — delegates to lib/supabase/proxy.ts
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Key Rules

1. **`app/` is for routing only.** Pages and layouts live here. Business logic, components, and utilities do not.
2. **`_components/` (private folder) for route-specific components.** The underscore prefix prevents Next.js from treating the folder as a route segment. If a component is only used by one route, it lives next to that route.
3. **`components/` for shared components only.** If only one route uses it, it does not belong here.
4. **`features/` for large, self-contained domains.** Auth, billing, genomics, etc. When a feature outgrows a single route's `_components/` folder, promote it to `features/`.
5. **`actions.ts` lives next to the route or in the feature folder.** Never in `lib/` or `utils/`.

---

## Naming Conventions

| Thing                  | Convention                 | Example                                            |
| ---------------------- | -------------------------- | -------------------------------------------------- |
| Folders                | `kebab-case`               | `user-profile/`, `tenant-settings/`                |
| Files (components)     | `PascalCase.tsx`           | `ProjectCard.tsx`, `UserAvatar.tsx`                |
| Files (non-components) | `camelCase.ts`             | `actions.ts`, `queries.ts`, `useProjects.ts`       |
| Files (route handlers) | `route.ts`                 | Next.js convention — always `route.ts`             |
| React components       | `PascalCase`               | `ProjectList`, `TenantSwitcher`                    |
| Functions              | `camelCase`                | `createProject`, `getUserRole`                     |
| Constants              | `SCREAMING_SNAKE_CASE`     | `MAX_TENANT_MEMBERS`, `DEFAULT_PAGE_SIZE`          |
| Types / Interfaces     | `PascalCase`               | `ProjectRecord`, `AuthContext`                     |
| Custom hooks           | `use` prefix + `camelCase` | `useProjects`, `useTenantMembers`                  |
| Zod schemas            | `PascalCase` + `Schema`    | `CreateProjectSchema`, `UpdateProfileSchema`       |
| Server Actions         | verb + subject             | `createProject`, `updateProfile`, `deleteDocument` |
| TanStack Query keys    | `kebab-case` strings       | `['projects', tenantId]`, `['profile', userId]`    |

---

## Server vs Client Components

### The Default Rule

**Every component is a Server Component by default.** Only add `'use client'` when the component actually needs it.

### Decision Tree

```
Does this component need any of the following?
  - onClick, onChange, or any event handler
  - useState, useReducer, useEffect, or any React hook
  - Browser-only APIs (window, localStorage, navigator)
  - A third-party library that requires the browser (charts, drag-and-drop, etc.)
  - Real-time Supabase subscription (useChannel, useRealtimeChannel)

  → YES to any of the above: add 'use client'
  → NO to all of the above: keep as Server Component (no directive needed)
```

### Push `'use client'` as Deep as Possible

The goal is to keep the outer shell server-rendered and push interactivity to leaf nodes.

```
// ✅ Good — only the interactive part is a Client Component
// ProjectsPage.tsx (Server Component — fetches data directly)
export default async function ProjectsPage() {
  const supabase = await createServerClient();
  const { data: projects } = await supabase.from('projects').select('*');
  return <ProjectList projects={projects} />;  // passes data down
}

// ProjectList.tsx (Server Component — pure display)
export function ProjectList({ projects }) {
  return projects.map(p => <ProjectCard key={p.id} project={p} />);
}

// ProjectCardMenu.tsx — only this tiny component needs 'use client'
'use client';
export function ProjectCardMenu({ projectId }) {
  const [open, setOpen] = useState(false);
  // ...dropdown menu logic
}
```

```
// ❌ Wrong — 'use client' on the whole page because of one dropdown
'use client';
export default function ProjectsPage() {
  // entire page is now client-side, loses all RSC benefits
}
```

### What Server Components Can Do (and Client Components Cannot)

| Capability                     | Server Component | Client Component                    |
| ------------------------------ | ---------------- | ----------------------------------- |
| Direct Supabase queries        | ✅               | ❌                                  |
| Access environment secrets     | ✅               | ❌                                  |
| async/await at component level | ✅               | ❌                                  |
| useState, useEffect, hooks     | ❌               | ✅                                  |
| Event handlers                 | ❌               | ✅                                  |
| Browser APIs                   | ❌               | ✅                                  |
| Import Server Components       | ✅               | ❌ (pass as children/props instead) |

---

## Data Fetching

### The Two Modes

| Situation                                                                 | Approach                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------- |
| Data for a server-rendered page or layout                                 | Direct Supabase client call in a Server Component |
| Data needed in a Client Component (real-time, user interactions, polling) | TanStack Query                                    |

**`useEffect` + `fetch` is banned** for data fetching. It produces duplicate requests, poor loading states, no caching, and inconsistent error handling. TanStack Query replaces it everywhere.

### Server-Side Fetching (Default)

```typescript
// app/(dashboard)/projects/page.tsx — Server Component
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';

export default async function ProjectsPage() {
  const { tenantId } = await requireAuth();
  const supabase = await createServerClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  return <ProjectList projects={projects ?? []} />;
}
```

### Client-Side Fetching (TanStack Query)

Use TanStack Query when a Client Component needs data that may change without a page navigation — dashboards, real-time feeds, search results, optimistic updates.

**Setup — `src/lib/query-client.ts`:**

```typescript
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000 // 1 minute default — prevents unnecessary refetches
      }
    }
  });
}
```

**Query hooks live in `queries.ts` next to their feature:**

```typescript
// features/projects/queries.ts
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";

export function useProjects(tenantId: string) {
  return useQuery({
    queryKey: ["projects", tenantId],
    queryFn: async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId
  });
}
```

**Cache invalidation after Server Actions:**

```typescript
// After a mutation Server Action succeeds, invalidate the relevant query
'use client';
import { useQueryClient } from '@tanstack/react-query';
import { createProject } from './actions';

export function CreateProjectButton({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createProject({ name: 'New Project' });
      if (result.success) {
        // Invalidate so TanStack Query refetches fresh data
        await queryClient.invalidateQueries({ queryKey: ['projects', tenantId] });
      }
    });
  };

  return <button onClick={handleCreate} disabled={isPending}>Create</button>;
}
```

### Query Key Conventions

Query keys are arrays. Always start with the resource name, then scope by tenantId, then any filters.

```typescript
["projects", tenantId][("projects", tenantId, projectId)][ // all projects for tenant // single project
  ("projects", tenantId, { status: "active" })
][("profile", userId)][("tenant-members", tenantId)]; // filtered projects // user profile // members of a tenant
```

### Server Prefetch + HydrationBoundary (Preferred for Initial Page Load)

When a page has Client Components that need data on first render, use TanStack Query's prefetch pattern to eliminate the loading spinner. The data is fetched on the server, serialised, and hydrated into the client cache before the component mounts.

```typescript
// app/(dashboard)/projects/page.tsx — Server Component
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/query-client';
import { ProjectsDashboard } from './_components/ProjectsDashboard';
import { requireAuth } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';

export default async function ProjectsPage() {
  const { tenantId } = await requireAuth();
  const queryClient = makeQueryClient();

  // Prefetch on the server — Client Component gets data from cache immediately, no spinner
  await queryClient.prefetchQuery({
    queryKey: ['projects', tenantId],
    queryFn: async () => {
      const supabase = await createServerClient();
      const { data } = await supabase
        .from('projects')
        .select('id, name, created_at')
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
// Data is already in cache — renders immediately, no loading state on first paint
'use client';
import { useProjects } from '@/features/projects/queries';

export function ProjectsDashboard({ tenantId }: { tenantId: string }) {
  const { data: projects } = useProjects(tenantId);
  return <ProjectList projects={projects ?? []} />;
}
```

**When to use this pattern:** Any page where a Client Component needs data on the initial render and a loading spinner would degrade the experience. Dashboard pages, detail pages, anything user-facing.

**When to skip it:** Simple pages where the data is rendered entirely server-side (no Client Components need it) — just fetch directly in the Server Component.

---

## State Management

### The Hierarchy

With the App Router, the amount of client-side state you need is dramatically smaller than in the Pages Router era. Server Components handle data on the server; TanStack Query handles syncing it to the client. What remains is a much smaller surface area of genuinely client-side state.

Reach for each layer in order — only move to the next if the current one genuinely cannot handle it:

| Priority | Tool                                    | Use for                                                   | Examples                                                                    |
| -------- | --------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1st      | URL state (search params, route params) | Shareable, bookmarkable UI state                          | Filters, active tabs, selected items, pagination, search query              |
| 2nd      | `useState` / lifted state               | Local component state or small shared subtree             | Input values, dropdown open/closed, toggle states                           |
| 3rd      | React Context                           | Static config shared across a deep tree                   | Theme, locale, current user object (read-only)                              |
| 4th      | Zustand                                 | Complex mutable UI state needed across distant tree parts | Multi-step wizard state, notification queue, complex modal with many fields |

**TanStack Query handles all server state.** Do not put Supabase data into any of the layers above.

**No Redux.** The App Router architecture makes Redux an anti-pattern — global stores are shared across requests on the server, causing data contamination between users.

### URL State — Use This First

URL state is the most underused tool in Next.js. It is shareable, bookmarkable, survives a refresh, and requires zero libraries.

```typescript
// ✅ Filters, search, pagination — use URL state
'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export function ProjectFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? 'all';

  const setStatus = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', value);
    router.push(`?${params.toString()}`);
  };

  return (
    <select value={status} onChange={(e) => setStatus(e.target.value)}>
      <option value="all">All</option>
      <option value="active">Active</option>
      <option value="archived">Archived</option>
    </select>
  );
}
```

The Server Component reading that filter:

```typescript
// page.tsx — Server Component reads URL params directly
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams;
  const supabase = await createServerClient();
  const query = supabase.from('projects').select('*');
  if (status && status !== 'all') query.eq('status', status);
  const { data } = await query;
  return <ProjectList projects={data ?? []} />;
}
```

### useState — Second Reach

For state that is local to a component or a small subtree and does not need to survive navigation:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [step, setStep] = useState<1 | 2 | 3>(1);
```

### React Context — Third Reach, Static Config Only

Context is acceptable for read-only config that needs to be deeply available — never for mutable data or data fetched from Supabase:

```typescript
// ✅ Correct — static, read-only, set once
const CurrentUserContext = createContext<CurrentUser | null>(null);

// ❌ Wrong — mutable server data belongs in TanStack Query
const ProjectsContext = createContext<Project[]>([]);
```

### Zustand — Only If You Genuinely Need It

Add Zustand only when you have complex, frequently-mutating UI state needed across distant parts of the component tree that cannot be expressed as URL state. Most projects never reach this point.

If you do add it, keep stores small and scoped. One store per concern, not one global store:

```typescript
// lib/stores/notifications-store.ts — only if you have complex toast/notification logic
import { create } from "zustand";

type Notification = { id: string; message: string; type: "success" | "error" };
type NotificationsStore = {
  notifications: Notification[];
  add: (n: Omit<Notification, "id">) => void;
  dismiss: (id: string) => void;
};

export const useNotifications = create<NotificationsStore>((set) => ({
  notifications: [],
  add: (n) =>
    set((s) => ({
      notifications: [...s.notifications, { ...n, id: crypto.randomUUID() }]
    })),
  dismiss: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
}));
```

---

## Form Handling

**Stack:** React Hook Form + Zod. Always. No exceptions.

The Zod schema is defined and exported from `actions.ts`. React Hook Form uses it via `zodResolver`. This means the same schema validates both the client form and the server action — one source of truth.

```typescript
// features/projects/actions.ts
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
});

// features/projects/_components/CreateProjectForm.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateProjectSchema, createProject } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type FormValues = z.infer<typeof CreateProjectSchema>;

export function CreateProjectForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (values: FormValues) => {
    const result = await createProject(values);
    if (!result.success) {
      form.setError('root', { message: result.error.message });
      return;
    }
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="My Project" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create Project'}
        </Button>
      </form>
    </Form>
  );
}
```

### Form Rules

1. Schema always defined in `actions.ts` — exported so the form can import it.
2. Use Shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` wrappers — consistent error display.
3. Server errors from `result.error.message` go to `form.setError('root')`.
4. Field-level errors from `result.error.details` (Zod flatten) can be mapped to individual fields using `form.setError('fieldName', ...)`.

---

## Custom Hooks Conventions

All custom hooks live in `src/hooks/` (shared) or `features/[feature]/` (feature-scoped).

### Naming

- Always prefix with `use`: `useProjects`, `useTenantMembers`, `useActiveModal`
- Name describes what it returns, not how it works: `useCurrentUser` not `useAuthFetch`

### Structure

```typescript
// hooks/useCurrentUser.ts
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";

export type CurrentUser = {
  id: string;
  email: string;
  tenantId: string;
  role: string;
};

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const supabase = createBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_tenant_id, global_role")
        .eq("id", user.id)
        .single();

      return {
        id: user.id,
        email: user.email!,
        tenantId: profile!.active_tenant_id,
        role: profile!.global_role
      };
    }
  });
}
```

### Rules

1. Hooks that wrap TanStack Query return the full query result — don't destructure inside the hook, let the consumer decide what to use.
2. Hooks that wrap Zustand stores export the selector directly — keep them small.
3. No hooks that mix data fetching with mutations — separate `useX` (read) from `useCreateX`, `useUpdateX` (write).

---

## Shadcn/ui Usage

### The Three-Layer Model

```
components/ui/         ← Shadcn generated. Never touch.
components/            ← Your custom components, built by composing ui/ components.
app/*/_components/     ← Route-specific components, can use both layers above.
```

### Adding Components

Always use the CLI — never copy-paste from the docs:

```bash
npx shadcn@latest add button
npx shadcn@latest add form input dialog
```

### Customising

Extend via `className` prop using `cn()` — never edit files in `components/ui/`:

```typescript
// ✅ Correct — compose and extend, don't edit ui/
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DangerButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      className={cn('border-destructive text-destructive hover:bg-destructive/10', className)}
      {...props}
    />
  );
}
```

### Theming

All colour and spacing tokens live in `globals.css` as CSS variables. Change the theme by updating the variables, not by overriding Tailwind classes throughout the codebase.

---

## TypeScript Standards

### Non-Negotiable Rules

1. **`strict: true` always** in `tsconfig.json` — no exceptions.
2. **No `any`** — use `unknown` and narrow the type. If you can't avoid it, use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a comment explaining why.
3. **Database types are generated, never hand-written.** Run `supabase gen types typescript --local > src/types/database.ts` after every migration.
4. **No non-null assertions (`!`)** unless you have just checked the value. Prefer optional chaining and explicit null checks.
5. **Explicit return types on Server Actions.** TypeScript can infer most return types, but Server Actions must be explicit: `Promise<ActionResult<{ id: string }>>`.

### Type Organisation

```
src/types/
  database.ts    ← Generated by Supabase CLI. Never hand-edited.
  actions.ts     ← ActionResult<T>, ActionError, ActionErrorCode
  api.ts         ← ApiResponse<T>, ApiErrorResponse
  [domain].ts    ← Domain-specific types, created as needed
```

Feature-specific types that are not shared across features live in `features/[feature]/types.ts`, not in `src/types/`.

### Useful Patterns

```typescript
// Derive types from Zod schemas instead of duplicating
export const CreateProjectSchema = z.object({ name: z.string() });
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// Derive types from database schema instead of hand-writing
import type { Database } from "@/types/database";
type Project = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];

// Use satisfies for config objects — catches errors without widening the type
const config = {
  maxFileSize: 5 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png"]
} satisfies UploadConfig;
```

---

## Decisions Log

| Decision                 | Choice                                                                           | Rationale                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Folder structure         | `src/app/` routing + route groups + `_components/` private folders + `features/` | Follows Next.js/Vercel 2025 conventions; colocates feature code without bloating shared folders |
| File naming              | PascalCase for components, kebab-case for folders, camelCase for utilities       | Industry standard for Next.js projects; matches Shadcn conventions                              |
| Server Component default | Server Component unless `'use client'` explicitly needed                         | Smaller bundles, no secrets in browser, better performance                                      |
| `'use client'` placement | As deep/late in the tree as possible                                             | Keeps maximum surface area server-rendered                                                      |
| Client data fetching     | TanStack Query — `useEffect` + `fetch` is banned                                 | Caching, deduplication, DevTools, mutation handling, prefetch/hydration with RSC                |
| Server state             | TanStack Query                                                                   | Separates server state from UI state cleanly                                                    |
| URL state                | `useSearchParams` + `useRouter`                                                  | Primary tool — shareable, bookmarkable, survives refresh                                        |
| Local UI state           | useState / useReducer                                                            | No library needed for component-local state                                                     |
| Static shared config     | React Context                                                                    | Theme, locale, read-only current user                                                           |
| Zustand                  | Only if genuinely needed                                                         | Complex mutable cross-tree UI state — most projects never need this                             |
| Form stack               | React Hook Form + Zod + Shadcn Form components                                   | Type-safe, schema shared between client and server, consistent error display                    |
| Schema location          | Defined and exported from `actions.ts`                                           | One schema, used by both Server Action validation and client-side form                          |
| Shadcn customisation     | Compose on top via `cn()`, never edit `components/ui/`                           | Preserves ability to update Shadcn components via CLI                                           |
| TypeScript               | strict mode, no any, generated DB types                                          | Prevents entire classes of runtime errors                                                       |
| Database types           | Generated via Supabase CLI after every migration                                 | Single source of truth — never duplicated or hand-written                                       |
