import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FlowDay from "./pages/FlowDay";
import Habits from "./pages/Habits";
import Calendar from "./pages/Calendar";

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  // At first app render, we check if a token already exists
  // (e.g., the user had an existing session open)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
          {/* MindShelf, SparkTime, Calendar, Settings viendront plus tard */}
          <Route path="/calendar" element={<Calendar />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
