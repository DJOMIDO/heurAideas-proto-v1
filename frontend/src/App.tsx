// frontend/src/App.tsx
import { Route, Routes, Navigate } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Menu from "./pages/Menu";
import Overview from "./pages/overview/Overview";
import Substep from "./pages/substep/Substep";
import SubstepCommentsPage from "@/pages/substep-comments/SubstepCommentsPage";
import DocumentManager from "./pages/documents/DocumentManager";
import { ProtectedRoute, GuestRoute } from "@/components/ProtectedRoute"; // 🔑 引入路由守卫
import { Toaster } from "@/components/ui/sonner";
import "./styles/animations.css";

function App() {
  return (
    <>
      <Routes>
        {/* 公共路由：所有人（无论是否登录）都能访问 */}
        <Route path="/" element={<Welcome />} />

        {/* 访客专属路由：只有【未登录】用户才能访问 */}
        <Route element={<GuestRoute />}>
          <Route path="/auth" element={<Auth />} />
        </Route>

        {/* 受保护路由：只有【已登录】用户才能访问 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/menu" element={<Menu />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/documents" element={<DocumentManager />} />
          <Route
            path="/substep/:projectId/:stepId/:substepId"
            element={<Substep />}
          />
          <Route
            path="/substep/:projectId/:stepId/:substepId/comments"
            element={<SubstepCommentsPage />}
          />
        </Route>

        {/* 兜底路由：拦截所有未匹配的 URL，重定向到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
