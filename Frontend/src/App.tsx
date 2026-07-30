import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import './App.css';

function App() {
  return (
    // AuthProvider abraça toda a aplicação para que a "memória do usuário logado" fique global
    <AuthProvider>
      {/* BrowserRouter habilita a navegação de URLs na barra do navegador */}
      <BrowserRouter>
        <Routes>
          {/* Mapeamento de URL para Componente */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Se o usuário digitar qualquer URL que não exista, mandamos ele para o login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;