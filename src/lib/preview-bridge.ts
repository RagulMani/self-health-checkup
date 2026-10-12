/**
 * Platform preview bridge — do NOT edit. Imported once from src/main.tsx.
 *
 * Forwards uncaught errors and unhandled rejections to the workbench that
 * embeds this preview (`__AS_RUNTIME_ERROR__`) and reports client-side route
 * changes (`ROUTE_NAVIGATED`) so the page switcher stays in sync. Inert when
 * the page is not inside an iframe.
 */
declare global {
  interface Window {
    __AS_ERROR_FORWARD__?: boolean;
  }
}

function post(message: Record<string, unknown>): void {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, "*");
    }
  } catch {
    /* ignore */
  }
}

export function reportRoute(pathname: string): void {
  post({ type: "ROUTE_NAVIGATED", route: pathname || "/" });
}

function send(message: string, stack?: string): void {
  if (!message.trim()) return;
  post({
    type: "__AS_RUNTIME_ERROR__",
    message: message.slice(0, 2500),
    stack,
    route: window.location.pathname,
  });
}

// __AS_ERROR_FORWARD_V1__ (vite) — install at module load, before React mounts.
if (typeof window !== "undefined" && !window.__AS_ERROR_FORWARD__) {
  window.__AS_ERROR_FORWARD__ = true;
  window.addEventListener("error", (e: ErrorEvent) => {
    const message =
      e.error instanceof Error && e.error.message ? e.error.message : e.message;
    send(
      message + (e.filename ? `\n  at ${e.filename}:${e.lineno}` : ""),
      (e.error as Error | undefined)?.stack,
    );
  });
  window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
    const reason: unknown = e.reason;
    send(
      reason instanceof Error ? reason.message : String(reason),
      (reason as Error | undefined)?.stack,
    );
  });
}

export {};
