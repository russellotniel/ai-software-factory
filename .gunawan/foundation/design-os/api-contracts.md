# API Contracts

> Owner: System Architect
> Status: [ ] Draft [ ] In Review [ ] Approved
> Project:
> Date:

## Server Actions

### `actionName`
**File:** `src/modules/[module]/actions/[action].ts`
**Auth required:** yes
**Input:**
```typescript
{
  field: type // description
}
```
**Output:** `ActionResult<T>`
```typescript
{
  field: type // description
}
```
**Errors:**
- `UNAUTHORIZED` — user not authenticated
- `VALIDATION_ERROR` — input failed safeParse
- `[domain error]` — [description]

---

## RPCs

### `rpc_name`
**Purpose:**
**Parameters:**
**Returns:**
**Security:** SECURITY INVOKER

---

## Notes
<!-- Any contract constraints that consumers must know about -->
