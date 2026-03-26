export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

export type ActionError = {
  code: ActionErrorCode;
  message: string;
  details?: Record<string, string[]> | unknown;
};

export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "DATABASE_ERROR"
  | "EXTERNAL_ERROR"
  | "INTERNAL_ERROR";
