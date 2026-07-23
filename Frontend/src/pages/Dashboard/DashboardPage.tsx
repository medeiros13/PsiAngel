import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
    // O useNavigate é um "gancho" (hook) do React Router.
    // Ele nos permite mudar a URL da página via código, como ao clicar em um botão.
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>Bem-vindo(a) ao seu Consultório</h1>
                <p>Selecione uma das opções abaixo para começar.</p>
            </header>

            <main style={styles.cardContainer}>
                {/* Cartão de Pacientes */}
                <div style={styles.card}>
                    <h2>👥 Meus Pacientes</h2>
                    <p>Cadastre novos pacientes, visualize históricos e gerencie prontuários.</p>
                    <button 
                        style={styles.button} 
                        onClick={() => navigate('/pacientes')}
                    >
                        Gerenciar Pacientes
                    </button>
                </div>

                {/* Cartão de Agenda */}
                <div style={styles.card}>
                    <h2>📅 Minha Agenda</h2>
                    <p>Visualize suas consultas, crie novas sessões e acesse os links do Google Meet.</p>
                    <button 
                        style={styles.button} 
                        onClick={() => navigate('/agenda')}
                    >
                        Acessar Agenda
                    </button>
                </div>
            </main>
        </div>
    );
}

// Estilos simples embutidos para facilitar a visualização inicial.
// No futuro, podemos mover isso para um arquivo .css separado ou usar Tailwind!
const styles = {
    container: {
        padding: '2rem',
        fontFamily: 'sans-serif',
        maxWidth: '900px',
        margin: '0 auto'
    },
    header: {
        marginBottom: '2rem',
        textAlign: 'center' as const
    },
    cardContainer: {
        display: 'flex',
        gap: '2rem',
        justifyContent: 'center'
    },
    card: {
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '2rem',
        width: '300px',
        textAlign: 'center' as const,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    button: {
        marginTop: '1rem',
        padding: '0.75rem 1.5rem',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold'
    }
};