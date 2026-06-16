// Captures unhandled SSR errors so the error page can surface them.
let lastError: unknown = null;

export function captureError(err: unknown) {
  lastError = err;
}

export function consumeLastCapturedError(): unknown {
  const e = lastError;
  lastError = null;
  return e;
}

if (typeof process !== "undefined" && process.on) {
  try {
    process.on?.("unhandledRejection", (e) => captureError(e));
    process.on?.("uncaughtException", (e) => captureError(e));
  } catch {
    // ignore — runtime may not support process listeners
  }
}
