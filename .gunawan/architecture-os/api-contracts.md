# API Contracts

**Status:** Active  
**Last Updated:** 2026-03-08  
**Scope:** All Next.js + Supabase projects

---

## Purpose

This document defines the contract for all server-side logic in this project: where it lives, how it is called, how errors are shaped, and how inputs are validated. Every developer and AI agent must follow these standards — no exceptions without a recorded decision.

---

## Layer Decision Framework

### The Four Layers

| Layer                                   | When to use                                                              | Who calls it                               |
| --------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------ |
| Server Component (direct Supabase call) | Reading data for a server-rendered page or layout                        | Server Components only                     |
| Server Action                           | Mutations from React components (create, update, delete)                 | Client and Server Components               |
| Route Handler (`/app/api/`)             | Webhooks, OAuth callbacks, external HTTP callers                         | External services, mobile apps             |
| Supabase Edge Function                  | Third-party integrations, background tasks, scheduled jobs, AI inference | pg_cron, external triggers, Supabase hooks |

### Decision Tree

```
Is this a READ for a server-rendered page or layout?
  → YES: Direct Supabase client call in the Server Component. No action. No route.

Is this a MUTATION called from a React component?
  → YES: Server Action. Always.

Does an external service need to call this via HTTP? (Stripe webhook, mobile app, third-party)
  → YES: Route Handler (/app/api/). Never expose a Server Action to external callers.

Does this need to run independently of the Next.js lifecycle?
(scheduled job, background processing, AI inference, third-party integration)
  → YES: Supabase Edge Function.

If none of the above apply, default to Server Action.
```

### What Each Layer Is NOT For

**Server Actions are NOT for:**

- Reading data on the client (use React Query + Route Handler or server-side fetch instead)
- Receiving webhooks from Stripe, GitHub, or any external service
- Endpoints shared with a mobile app or other client

**Route Handlers are NOT for:**

- Internal mutations from React components (use Server Actions)
- Logic that only your own frontend calls — this creates unnecessary HTTP overhead

**Supabase Edge Functions are NOT for:**

- Simple form submissions or UI mutations
- Logic that is tightly coupled to the Next.js request lifecycle

---

## Server Actions Standard

### File Structure

```
app/
  (features)/
    [feature]/
      actions.ts       ← Server Actions for this feature
      page.tsx
      components/
```

Group actions by feature. One `actions.ts` per feature domain. Never scatter actions inside component files.

### Function Signature

Every Server Action must follow this pattern:

```typescript
"use server";

import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/server";
import type { ActionResult } from "@/types/actions";

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional()
});

export async function createProject(
  input: z.infer<typeof CreateProjectSchema>
): Promise<ActionResult<{ id: string }>> {
  // 1. Authenticate
  const { user, tenantId } = await requireAuth();

  // 2. Validate
  const parsed = CreateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input.",
        details: parsed.error.flatten().fieldErrors
      }
    };
  }

  // 3. Execute
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      tenant_id: tenantId,
      name: parsed.data.name,
      description: parsed.data.description,
      created_by: user.id
    })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message: "Failed to create project."
      }
    };
  }

  // 4. Return
  return { success: true, data: { id: data.id } };
}
```

### Rules

1. **Always authenticate first.** Call `requireAuth()` before any Supabase operation. Never trust the client.
2. **Always validate with Zod.** Every action has a named Zod schema. Inline validation is not acceptable.
3. **Always return `ActionResult<T>`.** Never throw from a Server Action — thrown errors surface as unhandled exceptions on the client. Return the error shape instead.
4. **Never return sensitive data.** Do not return database error messages, stack traces, or internal IDs that were not deliberately included.
5. **Revalidate after mutations.** Use `revalidatePath()` or `revalidateTag()` after state-changing actions.

---

## Route Handlers Standard

### File Structure

```
app/
  api/
    webhooks/
      stripe/
        route.ts
      github/
        route.ts
    [other-external-endpoints]/
      route.ts
```

All Route Handlers live under `app/api/`. Webhook handlers are nested under `app/api/webhooks/`.

### Function Signature

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyStripeWebhook } from "@/lib/stripe/webhooks";
import type { ApiErrorResponse } from "@/types/api";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verify signature (webhooks) or authenticate (external APIs)
  const { event, error } = await verifyStripeWebhook(request);
  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid signature." }
      },
      { status: 401 }
    );
  }

  // 2. Process
  try {
    await handleStripeEvent(event);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Webhook processing failed." }
      },
      { status: 500 }
    );
  }
}
```

### Rules

1. **Always verify webhook signatures.** Never process an incoming webhook without verifying the signature from the source (Stripe, GitHub, etc.).
2. **Always return structured JSON.** Use `ApiErrorResponse` for errors, always include `success` field.
3. **Always set appropriate HTTP status codes.** 200 = success, 400 = bad input, 401 = unauthorised, 403 = forbidden, 404 = not found, 500 = server error.
4. **Do not call Route Handlers from your own frontend.** If a React component needs to trigger something, use a Server Action instead.

---

## Supabase Edge Functions Standard

### When to create an Edge Function

- Stripe payment processing logic that must run on Supabase infrastructure
- Scheduled background jobs (via pg_cron trigger)
- AI inference calls (OpenAI, Anthropic) that should not block the Next.js server
- Third-party integrations that benefit from running close to the database
- Sending transactional emails (Resend, SendGrid)

### File Structure

```
supabase/
  functions/
    [function-name]/
      index.ts
```

### Function Signature

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // 1. Authenticate (for user-facing functions)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Missing auth header." }
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  // 2. Process
  try {
    const body = await req.json();
    // ... logic
    return new Response(JSON.stringify({ success: true, data: {} }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Processing failed." }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

---

## Standard Error and Result Types

These types are defined once in `types/actions.ts` and `types/api.ts` and used across all layers.

### `types/actions.ts` — for Server Actions

```typescript
export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

export type ActionError = {
  code: ActionErrorCode;
  message: string;
  details?: Record<string, string[]> | unknown; // Zod field errors or custom details
};

export type ActionErrorCode =
  | "UNAUTHORIZED" // User is not authenticated
  | "FORBIDDEN" // User lacks permission
  | "NOT_FOUND" // Resource does not exist
  | "VALIDATION_ERROR" // Zod schema failed
  | "CONFLICT" // Duplicate / uniqueness violation
  | "DATABASE_ERROR" // Supabase/Postgres returned an error
  | "EXTERNAL_ERROR" // Third-party API failed
  | "INTERNAL_ERROR"; // Unexpected server error
```

### `types/api.ts` — for Route Handlers and Edge Functions

```typescript
export type ApiSuccessResponse<T = null> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T = null> = ApiSuccessResponse<T> | ApiErrorResponse;
```

### Error Code Mapping

| Situation             | Code               | HTTP Status (Route Handlers) | Postgres ERRCODE (RPC) |
| --------------------- | ------------------ | ---------------------------- | ---------------------- |
| Not authenticated     | `UNAUTHORIZED`     | 401                          | 42501                  |
| Lacks permission      | `FORBIDDEN`        | 403                          | 42501                  |
| Record not found      | `NOT_FOUND`        | 404                          | P0002                  |
| Zod validation failed | `VALIDATION_ERROR` | 400                          | 22023                  |
| Uniqueness conflict   | `CONFLICT`         | 409                          | 23505                  |
| Supabase/DB error     | `DATABASE_ERROR`   | 500                          | —                      |
| Third-party API error | `EXTERNAL_ERROR`   | 502                          | —                      |
| Unexpected error      | `INTERNAL_ERROR`   | 500                          | —                      |

---

## Validation Standard

**Library:** Zod. No alternatives.

### Rules

1. Every Server Action has a named Zod schema defined at the top of the file, outside the function.
2. Schema names follow the pattern: `{ActionName}Schema` (e.g., `CreateProjectSchema`, `UpdateProfileSchema`).
3. Use `safeParse()`, not `parse()`. Never let Zod throw — catch it and return the error shape.
4. Reuse schemas for the client-side form validation by exporting them from `actions.ts`.

```typescript
// actions.ts — schema is exported so the form can reuse it
export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500).optional()
});

// form.tsx — reuse the same schema
import { CreateProjectSchema } from "./actions";
const form = useForm({ resolver: zodResolver(CreateProjectSchema) });
```

---

## Authentication Helper

Every project must implement `requireAuth()` in `lib/auth/server.ts`. It is the single place that verifies a user is authenticated and extracts their active tenant context.

```typescript
// lib/auth/server.ts
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthContext = {
  user: { id: string; email: string };
  tenantId: string;
  role: string;
};

export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_tenant_id, global_role")
    .eq("id", user.id)
    .single();

  if (!profile?.active_tenant_id) {
    redirect("/onboarding");
  }

  return {
    user: { id: user.id, email: user.email! },
    tenantId: profile.active_tenant_id,
    role: profile.global_role
  };
}
```

---

## Consuming Server Actions on the Client

### Pattern: useActionState (React 19 / Next.js 16+)

Use `useActionState` for form-bound mutations. Use a manual `isPending` + `useState` pattern for programmatic mutations.

```typescript
// Form-bound mutation
'use client';
import { useActionState } from 'react';
import { createProject } from './actions';
import type { ActionResult } from '@/types/actions';

const initialState: ActionResult<{ id: string }> = null as any;

export function CreateProjectForm() {
  const [state, formAction, isPending] = useActionState(createProject, initialState);

  return (
    <form action={formAction}>
      <input name="name" />
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
}
```

```typescript
// Programmatic mutation (button click, not a form)
'use client';
import { useState, useTransition } from 'react';
import { deleteProject } from './actions';

export function DeleteButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProject({ projectId });
      if (!result.success) {
        setError(result.error.message);
      }
    });
  };

  return (
    <>
      <button onClick={handleDelete} disabled={isPending}>Delete</button>
      {error && <p className="text-red-500">{error}</p>}
    </>
  );
}
```

---

## Error Handling and Try-Catch Standard

### The Rule

**Never let an unexpected error escape unhandled from a Server Action, Route Handler, or Edge Function.** Every async boundary must have a try-catch. Errors are caught, logged, and returned as `INTERNAL_ERROR` — they are never thrown to the caller.

### Server Action Pattern

Wrap the entire action body in a try-catch. Auth and validation happen before the try block so their failures return structured errors directly. The try block covers all Supabase calls and business logic.

```typescript
"use server";

export async function createProject(
  input: z.infer<typeof CreateProjectSchema>
): Promise<ActionResult<{ id: string }>> {
  // Auth — outside try (redirect throws internally, that's fine)
  const { user, tenantId } = await requireAuth();

  // Validation — outside try, returns structured error
  const parsed = CreateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input.",
        details: parsed.error.flatten().fieldErrors
      }
    };
  }

  // Everything else — inside try
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("projects")
      .insert({
        tenant_id: tenantId,
        name: parsed.data.name,
        created_by: user.id
      })
      .select("id")
      .single();

    if (error) {
      // Known Supabase errors — map to specific codes
      if (error.code === "23505") {
        return {
          success: false,
          error: {
            code: "CONFLICT",
            message: "A project with this name already exists."
          }
        };
      }
      logger.error("createProject: supabase insert failed", {
        error: error.message,
        tenantId
      });
      return {
        success: false,
        error: { code: "DATABASE_ERROR", message: "Failed to create project." }
      };
    }

    return { success: true, data: { id: data.id } };
  } catch (err) {
    logger.error("createProject: unexpected error", { err, tenantId });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred."
      }
    };
  }
}
```

### Supabase Error Code Mapping

When Supabase returns a `PostgrestError`, map known `error.code` values before falling through to `DATABASE_ERROR`:

| Postgres ERRCODE | Meaning                     | ActionErrorCode    |
| ---------------- | --------------------------- | ------------------ |
| `23505`          | Unique constraint violation | `CONFLICT`         |
| `23503`          | Foreign key violation       | `DATABASE_ERROR`   |
| `42501`          | RLS / permission denied     | `FORBIDDEN`        |
| `P0002`          | No rows found (RPC)         | `NOT_FOUND`        |
| `22023`          | Invalid parameter (RPC)     | `VALIDATION_ERROR` |

### Route Handler Pattern

```typescript
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify / authenticate
    const { event, error } = await verifySignature(request);
    if (error) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Invalid signature." }
        },
        { status: 401 }
      );
    }

    // 2. Process
    await handleEvent(event);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error("POST /api/webhooks/stripe: unexpected error", { err });
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Request failed." }
      },
      { status: 500 }
    );
  }
}
```

### Rules

1. **Every async function at a layer boundary has a try-catch.** Server Actions, Route Handlers, Edge Functions — all of them.
2. **Log before returning an error.** If you're returning `DATABASE_ERROR` or `INTERNAL_ERROR`, a `logger.error()` call must come first.
3. **Never expose internal error messages to the client.** Supabase error details, stack traces, and query information stay in the log. The client gets only the `message` field.
4. **Map known Postgres error codes explicitly.** Don't fall through everything to `DATABASE_ERROR` — a conflict should surface as `CONFLICT`.
5. **Do not catch errors you cannot handle.** If `requireAuth()` calls `redirect()`, that's a Next.js internal throw — don't wrap it in try-catch.

---

## Logging Standard

### Philosophy

Log structured data at every error boundary. Never log PII. Write logs so that a developer who has never seen this codebase can diagnose a production failure from the log entry alone, without needing to ask the user what happened.

Infrastructure (where logs are routed, retention, log drain configuration) is defined in `deployment-os/environments.md`. This section covers code-level standards only.

### Logger Abstraction

All projects use a thin logger abstraction at `lib/logger.ts`. This wraps `console` today and is swappable to Pino, Winston, or a log drain with no changes to call sites.

```typescript
// lib/logger.ts

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function formatEntry(level: LogLevel, message: string, context?: LogContext) {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context
  });
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatEntry("debug", message, context));
    }
  },
  info: (message: string, context?: LogContext) => {
    console.log(formatEntry("info", message, context));
  },
  warn: (message: string, context?: LogContext) => {
    console.warn(formatEntry("warn", message, context));
  },
  error: (message: string, context?: LogContext) => {
    console.error(formatEntry("error", message, context));
  }
};
```

**To swap to Pino in the future:** replace the internals of `lib/logger.ts` only. Every call site stays identical.

### Log Levels

| Level   | When to use                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------------- |
| `debug` | Development-only. Verbose state, query parameters, intermediate values. Never appears in production. |
| `info`  | Significant business events. User completed onboarding. Webhook received and processed.              |
| `warn`  | Unexpected but recoverable. Retrying a failed third-party call. Missing optional config.             |
| `error` | Something failed and the user was affected or an operation did not complete.                         |

### Log Entry Shape

Every log entry is a JSON object. Minimum required fields:

```json
{
  "level": "error",
  "message": "createProject: supabase insert failed",
  "timestamp": "2026-03-08T10:22:11.000Z",
  "action": "createProject",
  "tenantId": "uuid",
  "userId": "uuid",
  "errorCode": "DATABASE_ERROR",
  "error": "duplicate key value violates unique constraint"
}
```

Include as much context as needed to diagnose the failure. At minimum: the action or handler name, tenantId, and the error value.

### What Must Always Be Logged

| Event                                       | Level   | Required context                                     |
| ------------------------------------------- | ------- | ---------------------------------------------------- |
| Unexpected catch block hit                  | `error` | action/handler name, tenantId, userId, raw error     |
| Supabase error returned                     | `error` | action name, tenantId, `error.code`, `error.message` |
| External API failure (Stripe, OpenAI, etc.) | `error` | function name, tenantId, status code, response body  |
| Webhook received                            | `info`  | handler name, event type, source                     |
| Background job started / completed          | `info`  | function name, tenantId, record counts               |
| Auth failure (missing token, invalid JWT)   | `warn`  | handler name, reason                                 |

### What Must Never Be Logged

This is non-negotiable. Projects handling health or genomic data (Gene-X) are subject to additional regulatory scrutiny if PII appears in logs.

**Never log:**

- Passwords, tokens, API keys, or secrets of any kind
- Full JWT tokens or session cookies
- User email addresses or phone numbers
- User full names
- Health data, diagnoses, genomic data, or any clinical values
- Any field prefixed with `health_`, `genomic_`, `dna_`, `medical_`
- Credit card numbers or payment details
- The full request body (log field names only, never values, when in doubt)

**Safe to log:**

- UUIDs (user IDs, tenant IDs, record IDs)
- Error codes and error messages from your own system
- HTTP status codes
- Timestamps and durations
- Event types and operation names

### Usage in Actions and Handlers

```typescript
// ✅ Correct — logs context, no PII
logger.error("updateProfile: supabase update failed", {
  action: "updateProfile",
  userId: user.id, // UUID only — safe
  tenantId,
  errorCode: error.code,
  error: error.message
});

// ❌ Wrong — logs PII
logger.error("updateProfile failed", {
  email: user.email, // Never log email
  fullName: input.name, // Never log user names
  error: error.message
});

// ❌ Wrong — logs secrets
logger.info("calling OpenAI", {
  apiKey: process.env.OPENAI_API_KEY // Never log secrets
});
```

---

## Decisions Log

| Decision                    | Choice                                                    | Rationale                                                                                                      |
| --------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Primary mutation layer      | Server Actions                                            | Type-safe, CSRF protected, no boilerplate                                                                      |
| External HTTP endpoints     | Route Handlers only                                       | Server Actions must not be called by external services                                                         |
| Background / scheduled / AI | Supabase Edge Functions                                   | Decoupled from Next.js lifecycle, runs close to DB                                                             |
| Validation library          | Zod                                                       | Type inference, reusable across client and server                                                              |
| Error handling              | Return `ActionResult<T>`, never throw                     | Thrown errors surface poorly on the client                                                                     |
| Error shape                 | `{ success, error: { code, message, details? } }`         | Consistent across all layers — actions, routes, edge functions                                                 |
| Auth helper                 | `requireAuth()` in `lib/auth/server.ts`                   | Single entry point, fail fast on every action                                                                  |
| Schema location             | Defined and exported from `actions.ts`                    | Shared between server action and client form validation                                                        |
| Try-catch placement         | Auth + validation outside try, all else inside            | Auth redirects are intentional throws; Zod errors are structured — only Supabase/business logic needs catching |
| Postgres error mapping      | Explicit mapping before falling through to DATABASE_ERROR | Conflicts and permission errors have meaningful codes the client can act on                                    |
| Logger abstraction          | `lib/logger.ts` wrapping console                          | Swappable to Pino/log drain with no call site changes                                                          |
| Log format                  | Structured JSON                                           | Machine-parseable in production; human-readable in dev                                                         |
| debug level                 | Suppressed in production                                  | Avoid verbose noise and accidental PII in prod logs                                                            |
| PII in logs                 | Strictly prohibited                                       | Health and genomic data projects have regulatory exposure; UUIDs only for user/tenant identity                 |
| Log infrastructure          | Deferred to Deployment OS                                 | Code-level standard is here; routing and retention live in deployment-os/environments.md                       |
