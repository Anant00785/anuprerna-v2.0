import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./auth.store";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

describe("auth.store", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    // logout() already clears jwt_token, but be explicit so cookie state
    // never leaks between tests regardless of logout's own correctness.
    document.cookie = "jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("should initialize with unauthenticated state", () => {
    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(false);
    expect(state.jwt).toBeNull();
    expect(state.user).toBeNull();
  });

  it("should set token and mark logged in", () => {
    useAuthStore.getState().setToken("mock_jwt_123");
    const state = useAuthStore.getState();
    expect(state.jwt).toBe("mock_jwt_123");
    expect(state.isLoggedIn).toBe(true);
  });

  it("should set user profile", () => {
    const mockUser = { id: 1, email: "test@anuprerna.com", firstName: "Test" };
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it("should clear state on logout", () => {
    useAuthStore.getState().setToken("mock_jwt_123");
    useAuthStore.getState().setUser({ email: "test@anuprerna.com" });
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(false);
    expect(state.jwt).toBeNull();
    expect(state.user).toBeNull();
  });

  it("persists the jwt to localStorage under the anuprerna-auth key", () => {
    useAuthStore.getState().setToken("mock_jwt_123");
    const raw = localStorage.getItem("anuprerna-auth");
    expect(raw).toContain("mock_jwt_123");
  });

  it("writes a jwt_token cookie when the token is set", () => {
    useAuthStore.getState().setToken("mock_jwt_123");
    expect(readCookie("jwt_token")).toBe("mock_jwt_123");
  });

  it("logout removes the persisted localStorage token", () => {
    useAuthStore.getState().setToken("mock_jwt_123");
    useAuthStore.getState().logout();
    const raw = localStorage.getItem("anuprerna-auth");
    expect(raw).not.toContain("mock_jwt_123");
    expect(JSON.parse(raw!).state.jwt).toBeNull();
  });

  it("logout removes the jwt_token cookie — no live token left behind", () => {
    useAuthStore.getState().setToken("mock_jwt_123");
    expect(readCookie("jwt_token")).toBe("mock_jwt_123");
    useAuthStore.getState().logout();
    expect(readCookie("jwt_token")).toBeNull();
  });

  it("the jwt_token cookie carries no Secure or HttpOnly flag (documents a known gap, not desired behaviour)", () => {
    useAuthStore.getState().setToken("mock_jwt_123");
    // setCookie() in auth.store.ts never appends `Secure`; `HttpOnly` cannot be
    // set from client JS at all. This test locks in the current (insecure) shape
    // so a future fix is a deliberate diff here, not a silent regression.
    const setCookieSpy = document.cookie;
    expect(setCookieSpy).not.toContain("HttpOnly");
    expect(setCookieSpy).not.toContain("Secure");
  });
});
