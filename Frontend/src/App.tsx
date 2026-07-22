import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/Login/LoginPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Quando a URL for apenas "/", renderizamos a página de Login */}
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;