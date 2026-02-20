import { Route, Routes } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Auth from './pages/Auth'
import Menu from './pages/Menu'
import Overview from './pages/overview/Overview'
import Substep from './pages/substep/Substep'

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/substep/:stepId/:substepId" element={<Substep />} />
      </Routes>
    </>
  )
}

export default App
