import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  // Until we verify if a token already exists (at app loading),
  // we display a loading state rather than redirecting too quickly
  if (loading) return <p>Chargement...</p>;

  // If no user is logged in → redirect to /login
  if (!user) return <Navigate to="/login" replace />;

  // User is logged in → display the requested page
  return <>{children}</>;
}
