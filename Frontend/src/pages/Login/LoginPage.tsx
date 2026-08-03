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

    // O hook useGoogleLogin permite configurar o fluxo de Autorização
    const loginWithGoogle = useGoogleLogin({
        flow: 'auth-code', // ESSA É A MÁGICA! Agora o Google vai devolver um 'code'
        onSuccess: async (codeResponse) => {
            console.log("Authorization Code recebido! Enviando para o C#...", codeResponse);
            
            try {
                // codeResponse.code contém o código temporário que o backend precisa
                await login(codeResponse.code);
                
                // Se o login der sucesso (não cair no catch), redirecionamos o usuário
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
            <h1>Acesso do Psicólogo</h1>
            <p>Faça login para gerenciar seus pacientes e sessões.</p>
            
            {/* Um botão HTML padrão que aciona a função do hook */}
            <button 
                onClick={() => loginWithGoogle()}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    backgroundColor: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                }}
            >
                Entrar com Google
            </button>
        </div>
    );
};