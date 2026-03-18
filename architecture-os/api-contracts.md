# API Contracts

**Status:** Active
**Last Updated:** 2026-03-19
**Scope:** Weeknd Core — Expo (React Native) + Supabase

---

## Purpose

This document defines the contract for all data fetching and server-side logic in this project: where it lives, how it is called, how errors are shaped, and how inputs are validated. Every developer and AI agent must follow these standards — no exceptions without a recorded decision.

React Native has no Server Components, no Server Actions, and no `'use server'` or `'use client'` directives. All components are client-side. All data fetching is done in hooks.

---

## Layer Decision Framework

### The Four Layers

| Layer | When to use | Who calls it |
| --- | --- | --- |
| TanStack Query hook (`useQuery` / `useMutation`) | All reads and mutations from React Native screens | React Native components |
| Expo API Route (`src/app/api/`) | Server-only secrets proxy (e.g. Google Maps API key) | Client hooks via `fetch(ENV.apiBaseUrl + '/api/...')` |
| Supabase Edge Function | Background jobs, scheduled tasks, third-party integrations, AI inference | pg_cron, external triggers, Supabase hooks |
| Direct Supabase client call | Simple single-table reads/writes — wrapped inside a TanStack Query hook | Never called raw from a component |

### Decision Tree

```
Does this read or mutate data that the component needs?
  → YES: TanStack Query hook (useQuery or useMutation).
         Wrap the Supabase client call inside queryFn or mutationFn.

Does this require a server-only secret (API key never bundled to the client)?
  → YES: Expo API Route in src/app/api/.
         Client hook calls fetch(ENV.apiBaseUrl + '/api/endpoint').
         Example: Google Maps API key lives only in the API route.

Does this need to run independently of the mobile app lifecycle?
(scheduled job, background processing, AI inference, third-party webhook)
  → YES: Supabase Edge Function.

If none of the above apply, default to TanStack Query.
```

### What Each Layer Is NOT For

**TanStack Query hooks are NOT for:**
- Direct DOM/native side-effects without a query or mutation
- Wrapping non-async state (use React Context or Zustand for local UI state)

**Expo API Routes are NOT for:**
- Internal Supabase mutations from the app (use TanStack Query + Supabase client directly)
- Any business logic that can live in a TanStack Query hook

**Supabase Edge Functions are NOT for:**
- UI-triggered mutations from the mobile app — those belong in TanStack Query hooks
- Logic tightly coupled to a single screen's lifecycle

---

## TanStack Query Standard

### QueryClient Configuration

Defined once in `src/contexts/AppProviders.tsx` and provided at the app root.

```typescript
// src/contexts/AppProviders.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 10 * 60 * 1000,      // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

These are the project defaults. Hooks may override `staleTime` per-query if the data is time-sensitive.

### Hook File Structure

```
src/hooks/
  use[Resource].ts       ← one hook file per resource or concern
  use[Resource]Query.ts  ← for hooks that group multiple queries on the same domain
```

One hook per file. Hook files live in `src/hooks/`. Feature-specific hooks that are only used within one feature may live in `src/features/[feature]/hooks/`.

### useQuery Pattern

```typescript
// src/hooks/usePlaceDetails.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { GooglePlaceDetailSchema } from '@/types/googlePlace'
import { AppError } from '@/utils/error'
import { ENV } from '@/constants/env'

export function usePlaceDetails(placeId: string | undefined) {
  return useQuery({
    queryKey: ['placeDetails', placeId],
    queryFn: async () => {
      if (!placeId) {
        throw new AppError({
          code: 'PLACE_DETAILS_INVALID_ID',
          message: 'Place ID is required',
          context: 'fetchPlaceDetails',
        })
      }

      const res = await fetch(
        `${ENV.apiBaseUrl}/api/maps/details?placeId=${placeId}`
      )
      const result = await res.json()

      const parsed = GooglePlaceDetailSchema.safeParse(result)
      if (!parsed.success) {
        throw new AppError({
          code: 'PLACE_DETAILS_VALIDATION_ERROR',
          message: 'Invalid place details response',
          debugMessage: parsed.error.message,
          context: 'fetchPlaceDetails',
        })
      }

      return parsed.data
    },
    enabled: Boolean(placeId),
    staleTime: 5 * 60 * 1000,
  })
}
```

### useMutation Pattern

```typescript
// src/hooks/usePlacesQuery.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PlaceSchema } from '@/types'
import { AppError } from '@/utils/error'

export function useAddPlaceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (placeData: Omit<Place, 'id'>) => {
      const validated = PlaceSchema.omit({ id: true }).safeParse(placeData)
      if (!validated.success) {
        throw new AppError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid place data',
          debugMessage: validated.error.message,
          context: 'addPlace',
        })
      }

      const { data, error } = await supabase
        .from('places')
        .insert({ ...validated.data })
        .select('id')
        .single()

      if (error) {
        throw new AppError({
          code: 'DATABASE_ERROR',
          message: 'Failed to save place',
          debugMessage: error.message,
          context: 'addPlace',
          cause: error,
        })
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places'] })
    },
    onError: (error) => {
      // AppError.from normalises any unknown error into AppError
      throw AppError.from(error, 'addPlace')
    },
  })
}
```

### useInfiniteQuery Pattern

Used for paginated lists (e.g. nearby places batched by type category).

```typescript
// src/hooks/useNearbyPlaces.ts
const nearbyQuery = useInfiniteQuery({
  queryKey: ['nearbyPlaces', latitude, longitude, radius],
  queryFn: ({ pageParam }) =>
    fetchNearbyBatch(latitude!, longitude!, radius, pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => {
    const nextBatch = lastPage.batchIndex + 1
    if (nextBatch >= TYPE_BATCHES.length) return undefined
    return nextBatch
  },
  enabled: hasCoords && !isTextSearch,
  staleTime: 5 * 60 * 1000,
})
```

### Query Key Conventions

Query keys are defined inline in each hook. No query key factory pattern is used.

| Resource | Key shape |
| --- | --- |
| Nearby places | `['nearbyPlaces', lat, lng, radius]` |
| Text search places | `['textSearchPlaces', lat, lng, radius, textQuery]` |
| Place details | `['placeDetails', placeId]` |
| All places (internal) | `['places']` |
| User's places | `['places', 'user', userId]` |
| Activities | `['activities']` |
| Moments | `['moments']` |
| User credit | `['credit', userId]` |

Rules:
1. First element is the resource name as a string literal.
2. Add identifying parameters after the resource name.
3. Use the same key shape everywhere you reference the same resource — for `invalidateQueries` to work correctly.

### Rules

1. **Always validate with Zod before any Supabase call.** Use `safeParse()`, never `parse()`. Throw `AppError` on failure.
2. **Never call Supabase directly from a component.** Supabase calls live inside `queryFn` or `mutationFn`.
3. **Never use `useEffect` + `fetch` for data fetching.** Every fetch belongs in a TanStack Query hook. Known violation: `useLocationAutocomplete` — to be migrated.
4. **Always invalidate related queries on mutation success.** Call `queryClient.invalidateQueries()` in `onSuccess`.
5. **Always return typed data.** Hook return types are inferred from the schema — never use `any`.
6. **Never throw unhandled errors to the UI.** Screens check `query.error` and render inline error states.

---

## Expo API Routes Standard

### Purpose

Expo API routes exist for one reason only: to proxy calls that require a server-only secret that must never be bundled into the client.

Current use: Google Maps Places API v1 — the `GOOGLE_MAPS_API_KEY` must never appear in the client bundle.

### File Structure

```
src/app/api/
  maps/
    nearby+api.ts
    autocomplete+api.ts
    details+api.ts
    photo+api.ts
    textsearch+api.ts
```

All API routes live under `src/app/api/`. Routes are named `[name]+api.ts` (Expo Router convention).

### Function Signature

```typescript
// src/app/api/maps/nearby+api.ts
import { ExpoRequest, ExpoResponse } from 'expo-router/server'

export async function GET(request: ExpoRequest): Promise<ExpoResponse> {
  const { searchParams } = new URL(request.url)
  const latitude = searchParams.get('latitude')
  const longitude = searchParams.get('longitude')

  if (!latitude || !longitude) {
    return ExpoResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'latitude and longitude are required' } },
      { status: 400 }
    )
  }

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
        'X-Goog-FieldMask': '...',
      },
      body: JSON.stringify({ ... }),
    })

    const data = await res.json()
    return ExpoResponse.json(data, { status: res.status })
  } catch (err) {
    return ExpoResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Maps request failed' } },
      { status: 500 }
    )
  }
}
```

### How clients call API routes

Client hooks call the route via `fetch` using `ENV.apiBaseUrl`:

```typescript
// src/hooks/useNearbyPlaces.ts
const res = await fetch(
  `${ENV.apiBaseUrl}/api/maps/nearby?latitude=${lat}&longitude=${lng}`
)
```

`ENV.apiBaseUrl` is `EXPO_PUBLIC_API_BASE_URL` — validated at startup via the Zod schema in `src/constants/env.ts`.

### Rules

1. **API routes are for secret proxying only.** Do not put business logic here.
2. **Always validate query params before forwarding.** Return 400 with a structured error if required params are missing.
3. **Never return the raw Google API error to the client.** Return a normalised error shape.
4. **Never put `GOOGLE_MAPS_API_KEY` in any client-side file.** Only `process.env.GOOGLE_MAPS_API_KEY` in `+api.ts` files.

---

## Supabase Edge Functions Standard

### When to create an Edge Function

- Scheduled background jobs (via pg_cron trigger)
- AI inference calls (OpenAI, Anthropic) that should not run on-device
- Third-party integrations that benefit from running close to the database
- Sending transactional emails (Resend, SendGrid)
- Payment processing hooks

### File Structure

```
supabase/
  functions/
    [function-name]/
      index.ts
```

### Function Signature

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // 1. Authenticate (for user-facing functions)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth header.' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  // 2. Process
  try {
    const body = await req.json()
    // ... logic
    return new Response(JSON.stringify({ success: true, data: {} }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Processing failed.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Error Handling Standard

### AppError Class

All errors are normalised through `AppError` defined in `src/utils/error.ts`. This is the single error type used across all hooks and utilities.

```typescript
// src/utils/error.ts
export class AppError extends Error {
  public readonly code: string
  public readonly debugMessage?: string
  public readonly context?: string
  public readonly cause?: unknown

  constructor(options: AppErrorOptions) {
    super(options.message)
    this.name = 'AppError'
    this.code = options.code
    this.debugMessage = options.debugMessage
    this.context = options.context
    this.cause = options.cause
  }

  static from(error: unknown, context?: string): AppError { ... }
  static isNetworkError(error: AppError): boolean { ... }
  static isValidationError(error: AppError): boolean { ... }
}
```

### Error Codes

| Code | Meaning |
| --- | --- |
| `VALIDATION_ERROR` | Zod safeParse failed on input |
| `DATABASE_ERROR` | Supabase returned an error |
| `NEARBY_FETCH_ERROR` | HTTP failure fetching nearby places |
| `NEARBY_API_ERROR` | Google API returned a non-2xx response |
| `TEXT_SEARCH_FETCH_ERROR` | HTTP failure on text search |
| `TEXT_SEARCH_API_ERROR` | Google API text search non-2xx |
| `PLACE_DETAILS_FETCH_ERROR` | HTTP failure fetching place details |
| `PLACE_DETAILS_VALIDATION_ERROR` | Zod validation failed on place details response |
| `PLACE_DETAILS_INVALID_ID` | placeId was undefined when the hook was called |
| `UNKNOWN_ERROR` | Catch-all from `AppError.from()` |

### How errors surface in the UI

Screens check `query.error` directly and render an inline retry state. There is no global toast system.

```typescript
// src/features/place/PlaceScreen.tsx
if (nearbyQuery.error) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Failed to load nearby places</Text>
      <TouchableOpacity onPress={() => nearbyQuery.refetch()}>
        <Text>Retry</Text>
      </TouchableOpacity>
    </View>
  )
}
```

### Rules

1. **Always throw `AppError` from `queryFn` and `mutationFn`.** Never throw raw errors or plain strings.
2. **Use `AppError.from(error, context)` in catch blocks.** Normalises any unknown error.
3. **Never expose `debugMessage` or `cause` to the user.** These are for logs only.
4. **Map known Supabase error codes explicitly.** `23505` → conflict, `42501` → forbidden, etc.

### Supabase Error Code Mapping

| Postgres ERRCODE | Meaning | AppError code |
| --- | --- | --- |
| `23505` | Unique constraint violation | `CONFLICT` |
| `23503` | Foreign key violation | `DATABASE_ERROR` |
| `42501` | RLS / permission denied | `FORBIDDEN` |
| `P0002` | No rows found (RPC) | `NOT_FOUND` |
| `22023` | Invalid parameter (RPC) | `VALIDATION_ERROR` |

---

## Validation Standard

**Library:** Zod v4. No alternatives.

### Rules

1. **Always `safeParse()`, never `parse()`.** The one allowed exception is mock data helpers that are intended to crash early — must be replaced when real Supabase integration is wired.
2. **Name schemas after the resource and suffix with `Schema`.** e.g. `PlaceSchema`, `GooglePlaceDetailSchema`, `UserDataSchema`.
3. **Domain schemas live in `src/types/index.ts`.** API response schemas live in `src/types/[api-name].ts` (e.g. `googlePlace.ts`).
4. **Validate API responses, not just inputs.** Every external API response (Google Maps, Edge Function) must be parsed through a Zod schema before use.
5. **Export inferred types alongside schemas.** `export type Place = z.infer<typeof PlaceSchema>`.

```typescript
// src/types/index.ts — domain schema example
export const PlaceSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  category: z.string().min(1),
  image: z.string().url(),
  rating: z.number().min(0).max(5),
})
export type Place = z.infer<typeof PlaceSchema>

// Usage in a hook
const parsed = PlaceSchema.safeParse(rawData)
if (!parsed.success) {
  throw new AppError({
    code: 'VALIDATION_ERROR',
    message: 'Invalid place data',
    debugMessage: parsed.error.message,
    context: 'fetchPlace',
  })
}
const place = parsed.data
```

---

## Auth Standard

### Current state (prototype)

Auth is mock-only. `UserContext` stores login state in memory + AsyncStorage. `supabase.auth` is not yet wired into any screen. Session restore is disabled. See `src/contexts/UserContext.tsx`.

### Target state (production)

When real auth is implemented, it must follow this pattern:

```typescript
// src/lib/supabase.ts — already correct
export const supabase = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
  auth: {
    storage: getStorage(),   // AsyncStorage on native, localStorage on web
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

```typescript
// src/contexts/UserContext.tsx — target pattern
useEffect(() => {
  // Subscribe to auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        setIsLoggedIn(true)
        // fetch profile from supabase to get accountType
      } else {
        setIsLoggedIn(false)
      }
      setIsRestoring(false)
    }
  )
  return () => subscription.unsubscribe()
}, [])
```

### Route protection

No middleware is available in Expo Router for server-side redirects. Auth guards are implemented at the layout level:

```typescript
// src/app/(tabs)/_layout.tsx — target pattern
const { isLoggedIn, isRestoring } = useUser()

if (isRestoring) return <SplashScreen />
if (!isLoggedIn) {
  router.replace('/(auth)')
  return null
}
```

### Rules

1. **Never use service_role key in client code.** Only `supabase.auth.anon` key (`EXPO_PUBLIC_SUPABASE_KEY`).
2. **Session storage:** AsyncStorage on native, `window.localStorage` on web. Never store tokens in plain memory only.
3. **Auth guard must be added to `(tabs)` and `(business-tabs)` layouts before production.** Current prototype has no guard.
4. **Business user mode is determined by `accountType` on the user profile in Supabase**, not by email string matching (prototype workaround must be replaced).

---

## Environment Variables Standard

Validated at startup in `src/constants/env.ts`. The app throws with a clear message before rendering if any required var is missing.

```typescript
// src/constants/env.ts
const envSchema = z.object({
  supabaseUrl: z.string().url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL'),
  supabaseAnonKey: z.string().min(1, 'EXPO_PUBLIC_SUPABASE_KEY is required'),
  apiBaseUrl: z.string().min(1, 'EXPO_PUBLIC_API_BASE_URL is required'),
})
```

| Variable | Type | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_KEY` | Client | Supabase anon key |
| `EXPO_PUBLIC_API_BASE_URL` | Client | Base URL for all Expo API route calls |
| `GOOGLE_MAPS_API_KEY` | Server-only | Google Maps Places API v1 — Expo API routes only |

---

## Logging Standard

Use `src/utils/telemetry.ts` for all logging and performance tracking. This wraps `console` and provides structured output.

```typescript
// src/utils/telemetry.ts — available helpers
safeLog(level, message, context?)   // structured log
measureAsync(label, fn)             // async perf measurement
measure(label, fn)                  // sync perf measurement
```

### What must always be logged

| Event | Level | Required context |
| --- | --- | --- |
| Unexpected catch block hit | `error` | hook/function name, error code, raw error |
| Supabase error returned | `error` | function name, `error.code`, `error.message` |
| External API failure | `error` | function name, status code |
| Auth state change | `info` | event type |

### What must never be logged

- Passwords, tokens, API keys, or secrets
- User email addresses or phone numbers
- Full JWT tokens or session cookies
- Health data or any PII

**Safe to log:** UUIDs, error codes, HTTP status codes, timestamps, operation names.

---

## Decisions Log

| Decision | Choice | Rationale |
| --- | --- | --- |
| Primary data fetching layer | TanStack Query (useQuery / useMutation) | React Native has no Server Components or Server Actions |
| Server-only secret proxy | Expo API Routes | GOOGLE_MAPS_API_KEY must never be bundled to the client |
| Background / scheduled / AI | Supabase Edge Functions | Decoupled from mobile app lifecycle, runs close to DB |
| Validation library | Zod v4 | Type inference, reusable across hooks and API response parsing |
| Error type | `AppError` class extending `Error` | Normalises all errors; carries code, debugMessage, context, cause |
| Auth state storage | AsyncStorage (native) / localStorage (web) | Supabase recommended storage adapter for React Native |
| Styling | StyleSheet.create only (no NativeWind) | Project-level override — NativeWind not used in Weeknd Core |
| QueryClient defaults | staleTime 5min, gcTime 10min, refetchOnWindowFocus false | Standard for mobile app with moderate freshness requirements |
| Photo resolution | useEffect + setState (known tech debt) | Temporary workaround for second-pass photo URL resolution — to be migrated to TanStack Query |
| Google Maps pagination | Type-batch pagination (not cursor-based) | Google Places v1 does not expose a stable cursor for nearby search |
