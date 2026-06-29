// frontend/src/components/ProtectedRoute.tsx

import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth";

export function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/menu" replace />;
  }
  return <Outlet />;
}
