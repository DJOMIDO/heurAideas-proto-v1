import { Route, Routes } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Auth from './pages/Auth'
import Menu from './pages/Menu'
import Overview from './pages/overview/Overview'
import Substep from './pages/substep/Substep'
import SubstepCommentsPage from "@/pages/substep-comments/SubstepCommentsPage";
import DocumentManager from './pages/documents/DocumentManager'
import './styles/animations.css';

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/documents" element={<DocumentManager />} />
        <Route path="/substep/:projectId/:stepId/:substepId" element={<Substep />} />
        <Route path="/substep/:projectId/:stepId/:substepId/comments" element={<SubstepCommentsPage />} />
      </Routes>
    </>
  )
}

export default App
