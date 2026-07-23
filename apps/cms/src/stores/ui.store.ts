import { create } from "zustand";

// EXAMPLE Zustand store — CLIENT UI state only (sidebar, open modals, filters).
// Auth/session is validated server-side in middleware.ts. Never store secrets or
// server data here; fetch server data via lib/api.ts in Server Components.
type UIState = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
