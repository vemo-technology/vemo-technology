type Details = Record<string, unknown>;

const SENSITIVE_KEY = /password|secret|token|authorization|cookie|card|document|payload/i;

function sanitize(details: Details = {}) {
  return Object.fromEntries(Object.entries(details).map(([key, value]) => [
    key,
    SENSITIVE_KEY.test(key)
      ? "[REDACTED]"
      : value instanceof Error
        ? { name: value.name, message: "Internal error" }
        : value,
  ]));
}

export function logEvent(level: "info" | "warn" | "error", event: string, details: Details = {}) {
  const entry = JSON.stringify({ level, event, ...sanitize(details), timestamp: new Date().toISOString() });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}
