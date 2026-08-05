import { create } from "zustand";
import apiCall from "../lib/api";
import type { IUser } from "@shared/types";

// Response type for login/register API calls
interface AuthResponse {
  success: boolean;
  token: string;
  user: IUser;
}

// Definition of the complete store: data + actions
interface AuthState {
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  // --- Initial State ---
  user: null,
  loading: true, // true until we have checked if a token exists already

  // --- Actions ---

  // Called at app startup: checks if a token is already stored
  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const res = await apiCall<{ success: boolean; data: IUser }>(
        "/api/auth/me",
        { auth: true },
      );
      set({ user: res.data, loading: false });
    } catch {
      // If token is invalid or expired: clear it
      localStorage.removeItem("token");
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const res = await apiCall<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", res.token);
    set({ user: res.user });
  },

  register: async (name, email, password) => {
    const res = await apiCall<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem("token", res.token);
    set({ user: res.user });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null });
  },
}));
