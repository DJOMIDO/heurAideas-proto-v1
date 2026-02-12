import { Route, Routes } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Auth from './pages/Auth';

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </>
  )
}

export default App
