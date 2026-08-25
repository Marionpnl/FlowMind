import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import FlowDay from "./pages/FlowDay";
import Habits from "./pages/Habits";
import MindShelf from "./pages/MindShelf";
import SparkTime from "./pages/SparkTime";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const animatedTransitions = useAuthStore(
    (s) => s.user?.preferences?.animatedTransitions ?? true,
  );
  const compactDensity = useAuthStore(
    (s) => s.user?.preferences?.compactDensity ?? false,
  );

  // At first app render, we check if a token already exists
  // (e.g., the user had an existing session open)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Applique les réglages "Apparence" (Paramètres) au niveau du <html> —
  // voir index.css pour les règles CSS globales que ces classes déclenchent.
  useEffect(() => {
    document.documentElement.classList.toggle(
      "no-animations",
      !animatedTransitions,
    );
  }, [animatedTransitions]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "density-compact",
      compactDensity,
    );
  }, [compactDensity]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/flowday" element={<FlowDay />} />
          <Route path="/flowday/habits" element={<Habits />} />
          <Route path="/mindshelf" element={<MindShelf />} />
          <Route path="/sparktime" element={<SparkTime />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/calendar" element={<Calendar />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
