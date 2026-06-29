// frontend/src/App.tsx

import { Route, Routes, Navigate } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Menu from "./pages/Menu";
import Overview from "./pages/overview/Overview";
import Substep from "./pages/substep/Substep";
import SubstepCommentsPage from "@/pages/substep-comments/SubstepCommentsPage";
import DocumentManager from "./pages/documents/DocumentManager";
import { ProtectedRoute, GuestRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import Evaluation from "./pages/Evaluation";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome />} />

        <Route element={<GuestRoute />}>
          <Route path="/auth" element={<Auth />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/menu" element={<Menu />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/documents" element={<DocumentManager />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route
            path="/substep/:projectId/:stepId/:substepId"
            element={<Substep />}
          />
          <Route
            path="/substep/:projectId/:stepId/:substepId/comments"
            element={<SubstepCommentsPage />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
