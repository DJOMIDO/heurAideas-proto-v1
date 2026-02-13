import { Route, Routes } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Auth from './pages/Auth'
import Menu from './pages/Menu'

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/menu" element={<Menu />} />
      </Routes>
    </>
  )
}

export default App
