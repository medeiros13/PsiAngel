import React, { createContext, useState, type ReactNode } from 'react';
import { ENV } from '../config/env';

// 1. Tipagem para ajudar o VS Code (e você) a saber o que tem dentro do Contexto
interface AuthContextType {
    user: any; // Usaremos 'any' por enquanto, até desenharmos a entidade no C#
    login: (code: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState(null);

    const login = async (code: string) => {
        // Envia o Authorization Code para a nossa API C#
        const response = await fetch(`${ENV.API_URL}/auth/google-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credential: code }), // Mandamos como um objeto JSON
        });

        if (!response.ok) {
            // Se o backend retornar 400 ou 500, estouramos um erro para o LoginPage capturar
            throw new Error('Falha na autenticação com o backend');
        }

        const data = await response.json();
        setUser(data);
    };

    return (
        <AuthContext.Provider value={{ user, login }}>
            {children}
        </AuthContext.Provider>
    );
};