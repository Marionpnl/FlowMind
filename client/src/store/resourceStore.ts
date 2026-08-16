import { create } from "zustand";
import apiCall from "@/lib/api";
import type { IResource, ResourceStatus, ResourceType } from "@shared/types";

interface ResourcesResponse {
  success: boolean;
  data: IResource[];
}

interface ResourceResponse {
  success: boolean;
  data: IResource;
}

interface BookLookupResponse {
  success: boolean;
  data: { title: string; author?: string; coverUrl?: string };
}

interface BookSearchResult {
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
}

interface BookSearchResponse {
  success: boolean;
  data: BookSearchResult[];
}

export interface ThematicConnection {
  resourceIdA: string;
  resourceIdB: string;
  theme: string;
  explanation: string;
}

interface ConnectionsResponse {
  success: boolean;
  data: ThematicConnection[];
}

export interface RediscoverySuggestion {
  resourceId: string;
  reason: string;
}

interface RediscoveryResponse {
  success: boolean;
  data: RediscoverySuggestion;
}

interface CreateResourceInput {
  type: ResourceType;
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
  status?: ResourceStatus;
  tags?: string[];
}

interface ResourceState {
  resources: IResource[];
  loading: boolean;
  error: string | null;
  fetchResources: (filters?: {
    type?: string;
    status?: string;
    tag?: string;
  }) => Promise<void>;
  addResource: (data: CreateResourceInput) => Promise<IResource | null>;
  updateResource: (id: string, updates: Partial<IResource>) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  addNote: (
    resourceId: string,
    content: string,
    isQuote: boolean,
    page?: string,
  ) => Promise<void>;
  deleteNote: (resourceId: string, noteId: string) => Promise<void>;
  lookupISBN: (
    isbn: string,
  ) => Promise<{ title: string; author?: string; coverUrl?: string } | null>;
  searchByTitle: (query: string) => Promise<BookSearchResult[]>;
  fetchConnections: () => Promise<ThematicConnection[]>;
  fetchRediscovery: () => Promise<RediscoverySuggestion | null>;
}

export const useResourceStore = create<ResourceState>((set, get) => ({
  resources: [],
  loading: false,
  error: null,

  fetchResources: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.tag) params.set("tag", filters.tag);
      const query = params.toString() ? `?${params.toString()}` : "";

      const res = await apiCall<ResourcesResponse>(`/api/resources${query}`, {
        auth: true,
      });
      set({ resources: res.data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Loading error";
      set({ error: message, loading: false });
    }
  },

  addResource: async (data) => {
    set({ error: null });
    try {
      const res = await apiCall<ResourceResponse>("/api/resources", {
        method: "POST",
        auth: true,
        body: JSON.stringify(data),
      });
      set({ resources: [res.data, ...get().resources] });
      return res.data; // Return the newly created resource
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error adding resource";
      set({ error: message });
      return null;
    }
  },

  updateResource: async (id, updates) => {
    const previousResources = get().resources;
    set({
      resources: previousResources.map((r) =>
        r._id === id ? { ...r, ...updates } : r,
      ),
    });

    try {
      const res = await apiCall<ResourceResponse>(`/api/resources/${id}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify(updates),
      });
      set({
        resources: get().resources.map((r) => (r._id === id ? res.data : r)),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update error";
      set({ resources: previousResources, error: message });
    }
  },

  deleteResource: async (id) => {
    const previousResources = get().resources;
    set({ resources: previousResources.filter((r) => r._id !== id) });

    try {
      await apiCall(`/api/resources/${id}`, { method: "DELETE", auth: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete error";
      set({ resources: previousResources, error: message });
    }
  },

  addNote: async (resourceId, content, isQuote, page) => {
    try {
      const res = await apiCall<ResourceResponse>(
        `/api/resources/${resourceId}/notes`,
        {
          method: "POST",
          auth: true,
          body: JSON.stringify({ content, isQuote, page }),
        },
      );
      set({
        resources: get().resources.map((r) =>
          r._id === resourceId ? res.data : r,
        ),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error adding note";
      set({ error: message });
    }
  },

  deleteNote: async (resourceId, noteId) => {
    try {
      const res = await apiCall<ResourceResponse>(
        `/api/resources/${resourceId}/notes/${noteId}`,
        { method: "DELETE", auth: true },
      );
      set({
        resources: get().resources.map((r) =>
          r._id === resourceId ? res.data : r,
        ),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la suppression";
      set({ error: message });
    }
  },

  lookupISBN: async (isbn) => {
    try {
      const res = await apiCall<BookLookupResponse>(
        `/api/resources/lookup/${isbn}`,
        {
          auth: true,
        },
      );
      return res.data;
    } catch {
      return null;
    }
  },

  searchByTitle: async (query) => {
    try {
      const res = await apiCall<BookSearchResponse>(
        `/api/resources/search/${encodeURIComponent(query)}`,
        {
          auth: true,
        },
      );
      return res.data;
    } catch {
      return [];
    }
  },

  fetchConnections: async () => {
    try {
      const res = await apiCall<ConnectionsResponse>(
        "/api/resources/connections",
        { method: "POST", auth: true },
      );
      return res.data;
    } catch {
      return [];
    }
  },

  fetchRediscovery: async () => {
    try {
      const res = await apiCall<RediscoveryResponse>(
        "/api/resources/rediscover",
        { method: "POST", auth: true },
      );
      return res.data;
    } catch {
      return null;
    }
  },
}));
