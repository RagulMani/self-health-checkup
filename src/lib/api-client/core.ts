/**
 * Platform-owned typed API client — do NOT edit.
 *
 * The ONLY way this app talks to its linked API service. Never call
 * `fetch('/api/…')` directly: every route you need exists in the API's
 * openapi.json, and the platform regenerates typed wrappers here from it at
 * sync time (TODO: generated per-route functions from openapi.json land
 * beside this file as `./generated.ts`).
 *
 *   import { api } from "@/lib/api-client";
 *   const res = await api.get<Project[]>("/api/projects");
 *   if (res.success) render(res.data); else toast.error(res.error);
 *
 * - Base URL: `VITE_API_URL` (split deploys) or "" — same origin, which
 *   in the sandbox is Vite's `server.proxy["/api"]` to the API on :3002.
 * - `credentials: "include"` so the API's httpOnly session cookies flow.
 * - Bearer token: when a token is set (`setAccessToken`), it is sent as
 *   `Authorization: Bearer` too — needed when the API lives on another origin.
 * - 401 → one transparent `POST /api/auth/refresh` and a retry; if that fails
 *   the `onUnauthorized` listeners fire (AuthSessionProvider uses this).
 */

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: string; status: number };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Skip the automatic refresh-and-retry on 401 (used by the auth calls themselves). */
  noRefresh?: boolean;
}

export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

let accessToken: string | null = null;
let refreshToken: string | null = null;
const unauthorizedListeners = new Set<() => void>();
let refreshInFlight: Promise<boolean> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
export function getAccessToken(): string | null {
  return accessToken;
}
/** Kept in memory only; the httpOnly `as_refresh` cookie is the durable copy. */
export function setRefreshToken(token: string | null): void {
  refreshToken = token;
}
export function getRefreshToken(): string | null {
  return refreshToken;
}
export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}

/** Called when a request stays 401 after a refresh attempt. Returns an unsubscribe. */
export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

/** Absolute URL for an API path (`/api/...`). */
export function apiUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  let url = `${API_BASE_URL}${normalized}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  return url;
}

async function parseResponse<T>(res: Response): Promise<ApiResult<T>> {
  let payload: unknown = null;
  const text = await res.text().catch(() => "");
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }
  const envelope = payload as { success?: boolean; data?: T; error?: string } | null;
  if (res.ok && envelope && envelope.success !== false) {
    return { success: true, data: (envelope.data ?? (payload as T)) as T };
  }
  const error =
    (envelope && typeof envelope.error === "string" && envelope.error) ||
    (res.ok ? "Malformed response" : `${res.status} ${res.statusText || "Request failed"}`);
  return { success: false, error, status: res.status };
}

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(apiUrl("/api/auth/refresh"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(refreshToken ? { refreshToken } : {}),
        });
        const parsed = await parseResponse<{ accessToken: string; refreshToken: string }>(res);
        if (!parsed.success) return false;
        accessToken = parsed.data.accessToken;
        refreshToken = parsed.data.refreshToken;
        return true;
      } catch {
        return false;
      } finally {
        // Let the next 401 start a fresh attempt.
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      }
    })();
  }
  return refreshInFlight;
}

export async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
  const hasBody = options.body !== undefined && method !== "GET";
  if (hasBody && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (accessToken && !headers.Authorization) headers.Authorization = `Bearer ${accessToken}`;

  const send = () =>
    fetch(apiUrl(path, options.query), {
      method,
      credentials: "include",
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });

  try {
    let res = await send();
    if (res.status === 401 && !options.noRefresh) {
      const refreshed = await refreshSession();
      if (refreshed) {
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        res = await send();
      }
      if (res.status === 401) {
        clearTokens();
        unauthorizedListeners.forEach((listener) => listener());
      }
    }
    return await parseResponse<T>(res);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    };
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, { ...options, body }),
  del: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("DELETE", path, options),
};
