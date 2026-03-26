type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

function formatEntry(level: LogLevel, message: string, context?: LogContext) {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
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
  },
};
