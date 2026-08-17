import { create } from "zustand";
import apiCall from "../lib/api";
import type { IUser, IUserPreferences, ThemeChoice } from "@shared/types";

// Response type for login/register API calls
interface AuthResponse {
  success: boolean;
  token: string;
  user: IUser;
}

// Definition of the complete store: data + actions
export interface ProfileUpdateInput {
  name?: string;
  location?: string;
  timezone?: string;
  language?: string;
  theme?: ThemeChoice;
  preferences?: Partial<IUserPreferences>;
}

interface AuthState {
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (updates: ProfileUpdateInput) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  exportData: () => Promise<Record<string, unknown> | null>;
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

  updateProfile: async (updates) => {
    try {
      const res = await apiCall<{ success: boolean; data: IUser }>(
        "/api/auth/me",
        { method: "PUT", auth: true, body: JSON.stringify(updates) },
      );
      set({ user: res.data });
      return true;
    } catch {
      return false;
    }
  },

  deleteAccount: async () => {
    try {
      await apiCall<{ success: boolean }>("/api/auth/me", {
        method: "DELETE",
        auth: true,
      });
      localStorage.removeItem("token");
      set({ user: null });
      return true;
    } catch {
      return false;
    }
  },

  exportData: async () => {
    try {
      const res = await apiCall<{
        success: boolean;
        data: Record<string, unknown>;
      }>("/api/auth/export", { auth: true });
      return res.data;
    } catch {
      return null;
    }
  },
}));
