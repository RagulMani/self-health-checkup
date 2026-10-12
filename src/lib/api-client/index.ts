/**
 * Platform-owned typed API client — do NOT edit. See ./core.ts for the
 * transport, ./auth.ts for the auth calls.
 */
export * from "./core";
export { authApi, type AuthUser, type AuthTokens } from "./auth";
