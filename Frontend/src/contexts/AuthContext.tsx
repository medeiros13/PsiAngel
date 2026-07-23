import { createContext, useContext, useState, ReactNode } from 'react';

// Definimos o que o nosso contexto vai fornecer para o resto da aplicação
interface AuthContextType {
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

// Criação do Contexto
const AuthContext = createContext<AuthContextType | null>(null);

// O Provider é o componente que vai "envelopar" nossa aplicação
export function AuthProvider({ children }: { children: ReactNode }) {
    // Ao iniciar a aplicação, tentamos ler o token do LocalStorage do navegador.
    // Isso é o que garante que o F5 não deslogue o usuário.
    const [token, setToken] = useState<string | null>(localStorage.getItem('@PsiAngel:token'));

    const login = (newToken: string) => {
        localStorage.setItem('@PsiAngel:token', newToken); // Salva no navegador
        setToken(newToken); // Atualiza o estado da aplicação
    };

    const logout = () => {
        localStorage.removeItem('@PsiAngel:token'); // Remove do navegador
        setToken(null);
    };

    // Fornecemos essas funções e a variável isAuthenticated para a aplicação
    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook customizado para facilitar o uso nos outros componentes
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};