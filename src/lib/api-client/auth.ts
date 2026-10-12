/**
 * Platform-owned auth calls against the linked API service — do NOT edit.
 * Mirrors src/auth/routes.ts in the API. Tokens returned by login / signup /
 * refresh are kept in memory for Bearer use; the API also sets httpOnly
 * cookies, which is what same-site web requests rely on.
 */
import { clearTokens, request, setAccessToken, setRefreshToken, type ApiResult } from "./core";

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
}

export interface AuthTokens {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function remember(result: ApiResult<AuthTokens>): ApiResult<AuthTokens> {
  if (result.success) {
    setAccessToken(result.data.accessToken);
    setRefreshToken(result.data.refreshToken);
  }
  return result;
}

export const authApi = {
  async session(): Promise<AuthUser | null> {
    const res = await request<{ user: AuthUser | null }>("GET", "/api/auth/session");
    return res.success ? res.data.user : null;
  },
  async login(email: string, password: string): Promise<ApiResult<AuthTokens>> {
    return remember(
      await request<AuthTokens>("POST", "/api/auth/login", {
        body: { email, password },
        noRefresh: true,
      }),
    );
  },
  async signup(email: string, password: string, name?: string): Promise<ApiResult<AuthTokens>> {
    return remember(
      await request<AuthTokens>("POST", "/api/auth/signup", {
        body: { email, password, ...(name ? { name } : {}) },
        noRefresh: true,
      }),
    );
  },
  async logout(): Promise<void> {
    await request("POST", "/api/auth/logout", { body: {}, noRefresh: true });
    clearTokens();
  },
  async refresh(): Promise<ApiResult<AuthTokens>> {
    return remember(await request<AuthTokens>("POST", "/api/auth/refresh", { body: {}, noRefresh: true }));
  },
  forgotPassword(email: string): Promise<ApiResult<{ ok: true }>> {
    return request<{ ok: true }>("POST", "/api/auth/forgot-password", {
      body: { email },
      noRefresh: true,
    });
  },
  resetPassword(token: string, password: string): Promise<ApiResult<{ ok: true }>> {
    return request<{ ok: true }>("POST", "/api/auth/reset-password", {
      body: { token, password },
      noRefresh: true,
    });
  },
};
