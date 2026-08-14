import { createContext, useState, useEffect, type ReactNode } from 'react';
import { ENV } from '../config/env';

// 1. Tipagem para ajudar o VS Code (e você) a saber o que tem dentro do Contexto
interface AuthContextType {
    user: any; // Usaremos 'any' por enquanto, até desenharmos a entidade no C#
    login: (code: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${ENV.API_URL}/auth/me`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                }
            } catch (error) {
                console.error("Erro ao verificar autenticação", error);
            }
        };
        checkAuth();
    }, []);

    const login = async (code: string) => {
        // Envia o Authorization Code para a nossa API C#
        const response = await fetch(`${ENV.API_URL}/auth/google-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ credential: code }), // Mandamos como um objeto JSON
        });

        if (!response.ok) {
            // Se o backend retornar 400 ou 500, estouramos um erro para o LoginPage capturar
            throw new Error('Falha na autenticação com o backend');
        }

        // Depois do login, buscamos os dados do usuário usando o cookie recebido
        try {
            const meResponse = await fetch(`${ENV.API_URL}/auth/me`, { credentials: 'include' });
            if (meResponse.ok) {
                const meData = await meResponse.json();
                setUser(meData);
            } else {
                // Fallback caso /me falhe logo após login
                const data = await response.json();
                setUser(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const logout = async () => {
        try {
            await fetch(`${ENV.API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            setUser(null);
        } catch (error) {
            console.error("Erro ao fazer logout", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};