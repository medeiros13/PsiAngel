import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated, login } = useAuth(); // Pegamos nosso estado global

    // useEffect é um hook que roda quando a tela é montada.
    // Aqui verificamos: se a pessoa tentou acessar "/", mas já está logada,
    // nós a "expulsamos" para o dashboard.
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleLoginSuccess = (credentialResponse: any) => {
        console.log("Login com Google bem-sucedido!");
        
        // No futuro enviaremos isso ao C# e pegaremos nosso próprio JWT.
        // Por hora, vamos simular salvando o token do Google no LocalStorage
        if (credentialResponse.credential) {
            login(credentialResponse.credential);
            // O redirecionamento acontecerá automaticamente pelo useEffect acima!
        }
    };

    const handleLoginError = () => {
        console.error("Falha ao autenticar com o Google.");
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>PsiAngel</h1>
                <p style={styles.subtitle}>Acesse o seu consultório digital</p>
                
                <div style={styles.buttonWrapper}>
                    <GoogleLogin 
                        onSuccess={handleLoginSuccess} 
                        onError={handleLoginError} 
                        useOneTap={false}
                    />
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' },
    card: { backgroundColor: '#ffffff', padding: '3rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', textAlign: 'center' as const, width: '100%', maxWidth: '400px' },
    title: { margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '2rem' },
    subtitle: { margin: '0 0 2rem 0', color: '#6b7280' },
    buttonWrapper: { display: 'flex', justifyContent: 'center' }
};