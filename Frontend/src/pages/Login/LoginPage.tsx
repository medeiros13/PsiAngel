import React, { useContext } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    if (!authContext) {
        throw new Error("AuthContext deve ser usado dentro de um AuthProvider");
    }

    const { login } = authContext;

    const loginWithGoogle = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async (codeResponse) => {
            console.log("Authorization Code recebido! Enviando para o C#...", codeResponse);

            try {
                await login(codeResponse.code);

                navigate('/dashboard');
            } catch (error) {
                console.error("Falha ao comunicar com o servidor", error);
                alert("Não foi possível concluir o login.");
            }
        },
        onError: (errorResponse) => {
            console.error('Erro no popup do Google:', errorResponse);
        }
    });

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'var(--color-background)',
            backgroundImage: 'radial-gradient(circle at 10% 20%, var(--color-pink-light-2) 0%, var(--color-background) 90%)',
            fontFamily: 'var(--sans)',
            color: 'var(--color-text)',
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                padding: '3rem',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(221, 78, 119, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    fontSize: '2.5rem',
                    fontFamily: 'var(--casual)',
                    fontWeight: 'bold',
                    color: 'var(--color-secondary)',
                    marginBottom: '1rem'
                }}>PsiAngel</div>

                <h1 style={{
                    fontFamily: 'var(--heading)',
                    color: 'var(--color-primary)',
                    fontSize: '1.8rem',
                    marginBottom: '0.5rem',
                    marginTop: '0'
                }}>
                    Acesso do Psicólogo
                </h1>

                <p style={{
                    color: 'var(--color-text)',
                    marginBottom: '2rem',
                    lineHeight: '1.5'
                }}>
                    Faça login para gerenciar seus pacientes e sessões de forma integrada e segura.
                </p>

                <button
                    onClick={() => loginWithGoogle()}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: 'white',
                        color: '#555',
                        border: '1px solid var(--color-pink-light-1)',
                        borderRadius: '24px',
                        fontFamily: 'var(--sans)',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        width: '100%',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        transition: 'transform 0.1s, boxShadow 0.1s'
                    }}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Entrar com Google
                </button>
            </div>
        </div>
    );
};