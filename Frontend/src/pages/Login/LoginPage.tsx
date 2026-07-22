import { useGoogleLogin } from '@react-oauth/google';

export function LoginPage() {
  
  // Aqui inicializamos o fluxo de Authorization Code
  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        const authCode = codeResponse.code;

        if (!authCode) {
          console.error("Código de autorização não foi recebido.");
          return;
        }

        console.log("Código recebido! Enviando para o C#...");

        // Requisição POST utilizando o fetch nativo
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // ATUALIZAÇÃO: Enviamos a propriedade "code" conforme o DTO do C#
          body: JSON.stringify({
            code: authCode 
          })
        });

        if (!response.ok) {
          throw new Error(`Erro na API. Status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('Login realizado com sucesso no nosso sistema!', data);
        
      } catch (error) {
        console.error('Erro ao autenticar no nosso backend:', error);
      }
    },
    onError: (error) => {
      console.error('Falha na autenticação com o Google:', error);
    }
  });

  return (
    <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        backgroundColor: '#f3f4f6' 
    }}>
      <div style={{ 
          padding: '2.5rem', 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
      }}>
        <h1 style={{ color: '#1f2937', marginBottom: '0.5rem', fontSize: '2rem' }}>PsiAngel</h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Portal exclusivo para Psicólogos
        </p>

        {/* Nosso botão customizado que aciona a função de login */}
        <button 
          onClick={() => login()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            color: '#374151',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
          {/* Ícone simples do Google em SVG */}
          <svg style={{ width: '20px', height: '20px', marginRight: '10px' }} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar com o Google
        </button>
      </div>
    </div>
  );
}