import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Este componente é o nosso [Authorize] do React!
// Ele recebe os componentes "filhos" e decide se os renderiza ou se joga o usuário pro Login.
function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        // Se não tem token, joga pro "/"
        return <Navigate to="/" replace />;
    }

    // Se está autenticado, renderiza a página que ele pediu
    return children;
}

function App() {
    return (
        // O AuthProvider envolve tudo para que qualquer tela tenha acesso ao contexto de login
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Rota Pública */}
                    <Route path="/" element={<LoginPage />} />
                    
                    {/* Rotas Protegidas */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/pacientes" element={
                        <ProtectedRoute>
                            <div style={{ padding: '2rem' }}>
                                <h2>Página de Pacientes em construção... 🚧</h2>
                            </div>
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/agenda" element={
                        <ProtectedRoute>
                            <div style={{ padding: '2rem' }}>
                                <h2>Página da Agenda em construção... 🚧</h2>
                            </div>
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;