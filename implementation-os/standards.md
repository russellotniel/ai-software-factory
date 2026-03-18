# Implementation OS — Standards

**Status:** Active  
**Last Updated:** 2026-03-09  
**Scope:** Weeknd Expo (React Native) + Supabase project

---

## Purpose

This document defines how code is written, structured, and organised across all projects. It covers folder structure, naming conventions, component rules, data fetching, state management, forms, hooks, and TypeScript standards. Every developer and AI agent writes code to this standard — no exceptions without a recorded decision.

---

## Project Folder Structure

```
src/
├── app/                        # Expo Router — routing only (thin shells)
│   ├── _layout.tsx             # Root layout — AppProviders + ThemeProvider
│   ├── (auth)/                 # Auth flow: splash → welcome → login/register
│   ├── (tabs)/                 # User tab bar: Moments, Activity, Place, Profile
│   ├── (business-tabs)/        # Business tab bar: same + Create tab
│   ├── (modals)/               # Modal screens
│   ├── activity/[id].tsx
│   ├── place/[id].tsx
│   ├── moments/[id].tsx
│   ├── moments/create.tsx
│   ├── settings/
│   └── api/                    # Expo API routes (server-side, e.g. Maps proxy)
│       └── maps/
│
├── features/                   # All UI logic — mirrors route structure
│   ├── auth/
│   ├── activity/
│   ├── place/
│   ├── moments/
│   │   └── components/         # Feature-specific components
│   ├── profile/
│   ├── business/
│   ├── settings/
│   └── modal/
│
├── components/                 # Shared, reusable React Native components
│
├── hooks/                      # Shared custom hooks (use*Query.ts pattern)
│
├── contexts/                   # React Context providers
│   └── AppProviders.tsx        # Composes all providers
│
├── types/                      # Global TypeScript types + Zod schemas
│   └── index.ts                # PlaceSchema / Place, ActivitySchema / Activity, etc.
│
├── utils/                      # Shared utilities
│   └── error.ts                # AppError
│
├── constants/
│   └── env.ts                  # Zod-validated EXPO_PUBLIC_* env vars
│
└── lib/
    └── supabase/
        └── client.ts           # Single Supabase client instance

supabase/
├── migrations/                 # SQL migration files
└── functions/                  # Supabase Edge Functions

.env
.env.example
app.config.ts
tsconfig.json
```

### Key Rules

1. **`app/` is for routing only.** Route files are thin shells that import and render the corresponding screen from `src/features/`. No business logic in route files.
2. **`features/` mirrors the route structure.** All UI logic, query hooks, and feature-specific components live here.
3. **`components/` for shared components only.** If only one feature uses it, it belongs in `features/[feature]/components/`.
4. **No Server Components.** React Native is all client-side — every component has access to hooks and event handlers by default.
5. **Many features have user and business variants** (e.g. `PlaceScreen.tsx` vs `PlaceScreenBusiness.tsx`) — routing decides which to render based on `accountType`.

---

## Naming Conventions

| Thing                  | Convention                 | Example                                            |
| ---------------------- | -------------------------- | -------------------------------------------------- |
| Folders                | `kebab-case`               | `user-profile/`, `tenant-settings/`                |
| Files (components)     | `PascalCase.tsx`           | `ProjectCard.tsx`, `UserAvatar.tsx`                |
| Files (non-components) | `camelCase.ts`             | `actions.ts`, `queries.ts`, `useProjects.ts`       |
| React components       | `PascalCase`               | `MomentFeed`, `BusinessTabBar`                     |
| Functions              | `camelCase`                | `createMoment`, `getUserProfile`                   |
| Constants              | `SCREAMING_SNAKE_CASE`     | `MAX_UPLOAD_SIZE`, `DEFAULT_STALE_TIME`            |
| Types / Interfaces     | `PascalCase`               | `Place`, `ActivitySchema`                          |
| Custom hooks           | `use` prefix + `camelCase` | `usePlacesQuery`, `useMomentsQuery`                |
| Zod schemas            | `PascalCase` + `Schema`    | `PlaceSchema`, `MomentSchema`                      |
| TanStack Query keys    | `kebab-case` strings       | `['places', tenantId]`, `['profile', userId]`      |

---

## Components

### The Default

All React Native components have full access to hooks and event handlers — there is no Server Component concept. Every component is a client component.

### Decision Tree

```
Does this component need to fetch or display data?
  → Use TanStack Query (useQuery) — never useEffect + fetch

Does this component need to trigger a write (create/update/delete)?
  → Use TanStack Query (useMutation) with a Supabase client call

Does this component need shared state from a distant component?
  → Use React Context (read src/contexts/)

Does this component need local toggle/input state?
  → useState
```

### Component Colocation

```typescript
// ✅ Good — feature screen imports sub-components
// features/moments/MomentFeed.tsx
export function MomentFeed() {
  const { data: moments } = useMomentsQuery();
  return moments?.map(m => <MomentCard key={m.id} moment={m} />);
}

// features/moments/components/MomentCard.tsx
export function MomentCard({ moment }: { moment: Moment }) {
  // Pure display component
}
```

---

## Data Fetching

### The Rule

**All data fetching uses TanStack Query.** `useEffect` + `fetch` and bare `useEffect` + Supabase calls are banned. No exceptions.

### Configuration

```typescript
// Configured in AppProviders.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,         // 5 minutes
      gcTime: 10 * 60 * 1000,           // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### Query hooks live in `src/hooks/`

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

### Mutations

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

### Query Key Conventions

Keys are arrays. Always start with the resource name, then scope by tenantId/userId, then filters.

```typescript
['places', tenantId]
['places', tenantId, placeId]              // single place
['places', tenantId, { status: 'active' }] // filtered
['moments', tenantId]
['profile', userId]
['saved-places', userId]
```

---

## State Management

### The Hierarchy

With the App Router, the amount of client-side state you need is dramatically smaller than in the Pages Router era. Server Components handle data on the server; TanStack Query handles syncing it to the client. What remains is a much smaller surface area of genuinely client-side state.

Reach for each layer in order — only move to the next if the current one genuinely cannot handle it:

| Priority | Tool                                          | Use for                                                   | Examples                                                                    |
| -------- | --------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1st      | Navigation params (`useLocalSearchParams`)    | Screen-scoped shareable state                             | Selected item ID, filter values passed via route                            |
| 2nd      | `useState` / lifted state                     | Local component state or small shared subtree             | Input values, modal open/closed, toggle states                              |
| 3rd      | React Context                                 | Static config shared across a deep tree                   | Theme, current user object (read-only), account type                        |
| 4th      | Zustand                                       | Complex mutable UI state needed across distant tree parts | Multi-step wizard state, notification queue, complex modal with many fields |

**TanStack Query handles all server state.** Do not put Supabase data into any of the layers above.

**No Redux.** React Native Context + TanStack Query covers all use cases without global store complexity.

### Navigation Params — Use This First

For state that needs to survive navigation or be passed between screens, use Expo Router params.

```typescript
// Navigate with params
router.push({ pathname: '/place/[id]', params: { id: place.id } });

// Read in the destination screen
import { useLocalSearchParams } from 'expo-router';
const { id } = useLocalSearchParams<{ id: string }>();
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

The Zod schema is defined and exported from `src/types/index.ts`. React Hook Form uses it via `zodResolver`. The same schema validates both the form and the Supabase mutation — one source of truth.

```typescript
// types/index.ts
export const CreateMomentSchema = z.object({
  caption: z.string().min(1, 'Caption is required').max(300),
  place_id: z.string().uuid(),
});
export type CreateMomentInput = z.infer<typeof CreateMomentSchema>;

// features/moments/components/CreateMomentForm.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextInput, TouchableOpacity, Text, View } from 'react-native';
import { CreateMomentSchema, type CreateMomentInput } from '@/types';
import { useCreateMoment } from '@/hooks/useCreateMoment';

export function CreateMomentForm({ tenantId }: { tenantId: string }) {
  const { mutate, isPending, error } = useCreateMoment(tenantId);
  const { control, handleSubmit, formState: { errors } } = useForm<CreateMomentInput>({
    resolver: zodResolver(CreateMomentSchema),
  });

  return (
    <View>
      <Controller
        control={control}
        name="caption"
        render={({ field: { onChange, value } }) => (
          <TextInput value={value} onChangeText={onChange} placeholder="What's happening?" />
        )}
      />
      {errors.caption && <Text>{errors.caption.message}</Text>}
      {error && <Text>{error.message}</Text>}
      <TouchableOpacity onPress={handleSubmit(v => mutate(v))} disabled={isPending}>
        <Text>{isPending ? 'Posting...' : 'Post'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Form Rules

1. Schema always defined in `src/types/index.ts` — exported so forms and hooks share the same schema.
2. Use `react-hook-form` + `zodResolver` for all forms.
3. Mutation errors from the hook's `error` field go to the UI — do not throw unhandled.
4. Always use `safeParse()` inside mutation hooks before calling Supabase — never `parse()`.

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
import { supabase } from "@/lib/supabase/client";

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
      const { data: { user } } = await supabase.auth.getUser();
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
        role: profile!.global_role,
      };
    },
  });
}
```

### Rules

1. Hooks that wrap TanStack Query return the full query result — don't destructure inside the hook, let the consumer decide what to use.
2. Hooks that wrap Zustand stores export the selector directly — keep them small.
3. No hooks that mix data fetching with mutations — separate `useX` (read) from `useCreateX`, `useUpdateX` (write).

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

| Decision             | Choice                                                             | Rationale                                                                         |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Folder structure     | `src/app/` routing + `src/features/` + `src/hooks/` + `src/contexts/` | Follows Expo Router conventions; colocates feature code without bloating shared folders |
| File naming          | PascalCase for components, kebab-case for folders, camelCase for utilities | Industry standard; consistent across team                                     |
| All components       | Client-side (React Native has no Server Components)                | React Native is always client-side                                                |
| Data fetching        | TanStack Query — `useEffect` + `fetch` is banned                   | Caching, deduplication, DevTools, mutation handling                               |
| Server state         | TanStack Query                                                     | Separates server state from UI state cleanly                                      |
| Navigation state     | `useLocalSearchParams` + Expo Router params                        | Primary tool — survives navigation, shareable between screens                     |
| Local UI state       | useState / useReducer                                              | No library needed for component-local state                                       |
| Static shared config | React Context                                                      | Theme, current user, account type (read-only)                                     |
| Zustand              | Only if genuinely needed                                           | Complex mutable cross-tree UI state — most features never reach this              |
| Form stack           | React Hook Form + Zod + React Native inputs                        | Type-safe, schema shared between form and mutation hook                           |
| Schema location      | Defined and exported from `src/types/index.ts`                     | One schema, used by both form validation and Supabase mutation                    |
| TypeScript           | strict mode, no any, generated DB types                            | Prevents entire classes of runtime errors                                         |
| Database types       | Generated via Supabase CLI after every migration                   | Single source of truth — never duplicated or hand-written                         |
