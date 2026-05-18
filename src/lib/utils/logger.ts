/**
 * Secure logger utility
 * - Prevents sensitive data from being logged
 * - Provides structured logging
 * - Respects LOG_LEVEL environment variable
 */

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    // Don't log stack traces in production (could contain sensitive info)
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Get current log level from environment
 */
function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL as LogLevel;
  return LOG_LEVELS[level] !== undefined ? level : "info";
}

/**
 * Check if a given level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

/**
 * Sanitize error to prevent leaking sensitive information
 */
function sanitizeError(error: unknown): LogEntry["error"] {
  if (error instanceof Error) {
    const sanitized: LogEntry["error"] = {
      name: error.name,
      message: error.message,
    };

    // Only include stack trace in non-production environments
    if (process.env.NODE_ENV !== "production" && error.stack) {
      sanitized.stack = error.stack;
    }

    return sanitized;
  }

  return {
    name: "Unknown",
    message: typeof error === "string" ? error : "An unknown error occurred",
  };
}

/**
 * Sanitize context to remove sensitive fields
 */
function sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) return undefined;

  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
    "access_token",
    "refresh_token",
    "api_key",
    "apiKey",
  ];

  const sanitized = { ...context };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "***REDACTED***";
    }
  }

  return sanitized;
}

/**
 * Main logging function
 */
function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: unknown
) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: sanitizeContext(context),
  };

  if (error) {
    entry.error = sanitizeError(error);
  }

  // Use appropriate console method
  switch (level) {
    case "error":
      console.error(JSON.stringify(entry));
      break;
    case "warn":
      console.warn(JSON.stringify(entry));
      break;
    case "info":
      console.info(JSON.stringify(entry));
      break;
    case "debug":
      console.debug(JSON.stringify(entry));
      break;
  }
}

/**
 * Export logger methods
 */
export const logger = {
  error: (message: string, context?: Record<string, unknown>, error?: unknown) =>
    log("error", message, context, error),

  warn: (message: string, context?: Record<string, unknown>, error?: unknown) =>
    log("warn", message, context, error),

  info: (message: string, context?: Record<string, unknown>, error?: unknown) =>
    log("info", message, context, error),

  debug: (message: string, context?: Record<string, unknown>, error?: unknown) =>
    log("debug", message, context, error),
};

/**
 * Create a request-scoped logger with default context
 */
export function createRequestLogger(defaultContext: Record<string, unknown>) {
  return {
    error: (message: string, context?: Record<string, unknown>, error?: unknown) =>
      log("error", message, { ...defaultContext, ...context }, error),

    warn: (message: string, context?: Record<string, unknown>, error?: unknown) =>
      log("warn", message, { ...defaultContext, ...context }, error),

    info: (message: string, context?: Record<string, unknown>, error?: unknown) =>
      log("info", message, { ...defaultContext, ...context }, error),

    debug: (message: string, context?: Record<string, unknown>, error?: unknown) =>
      log("debug", message, { ...defaultContext, ...context }, error),
  };
}
