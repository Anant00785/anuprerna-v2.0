import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./auth.store";

describe("auth.store", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
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
});
