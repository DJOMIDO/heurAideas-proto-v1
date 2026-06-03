// frontend/src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth";

// 1. 保护需要登录的页面 (如 /menu, /overview)
export function ProtectedRoute() {
  if (!isAuthenticated()) {
    // 未登录，踢回登录页
    return <Navigate to="/auth" replace />;
  }
  // 已登录，正常渲染子路由
  return <Outlet />;
}

// 2. 保护只有“未登录”才能访问的页面 (如 /auth)
export function GuestRoute() {
  if (isAuthenticated()) {
    // 已登录却想访问登录页，直接踢回 Menu
    return <Navigate to="/menu" replace />;
  }
  return <Outlet />;
}
