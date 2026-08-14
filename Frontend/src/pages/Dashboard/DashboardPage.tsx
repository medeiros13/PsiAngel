import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENV } from '../../config/env';
import { AuthContext } from '../../contexts/AuthContext';

interface Patient {
    id: string;
    fullName: string;
    socialName?: string;
    treatmentStartDate: string;
}

export function DashboardPage() {
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;

    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPatient, setNewPatient] = useState({
        fullName: '',
        phoneNumber: '',
        treatmentStartDate: '',
        dateOfBirth: ''
    });

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await fetch(`${ENV.API_URL}/patients`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setPatients(data);
            }
        } catch (error) {
            console.error("Erro ao buscar pacientes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${ENV.API_URL}/patients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(newPatient)
            });
            
            if (response.ok) {
                setIsModalOpen(false);
                fetchPatients(); // Recarrega a lista
                setNewPatient({
                    fullName: '',
                    phoneNumber: '',
                    treatmentStartDate: '',
                    dateOfBirth: ''
                });
            } else {
                console.error("Falha ao salvar paciente");
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.socialName && p.socialName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={styles.pageContainer}>
            <header style={styles.topBar}>
                <div style={styles.logo}>PsiAngel</div>
                <div style={styles.navLinks}>
                    <span style={styles.activeNavLink}>Pacientes</span>
                    <span style={styles.navLink}>Agendamentos</span>
                </div>
                <div style={styles.userProfile}>
                    {user && (
                        <div style={styles.userInfo}>
                            <span style={styles.userName}>{user.name}</span>
                            {user.pictureUrl && (
                                <img src={user.pictureUrl} alt="Perfil" style={styles.userPicture} />
                            )}
                        </div>
                    )}
                </div>
            </header>

            <main style={styles.mainContent}>
                {/* Lado Esquerdo: Pacientes */}
                <section style={styles.leftPane}>
                    <div style={styles.searchSection}>
                        <input
                            type="text"
                            placeholder="Busque seu paciente"
                            style={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={styles.listControls}>
                        <button style={styles.filterChip}>🎂 Aniversariantes</button>
                        <button style={styles.filterChip}>👤 Ativos</button>
                    </div>

                    <div style={styles.actionButtons}>
                        <button style={styles.primaryButton} onClick={() => setIsModalOpen(true)}>
                            + Adicionar
                        </button>
                    </div>

                    <div style={styles.patientsListContainer}>
                        {loading ? (
                            <div style={styles.emptyState}>Carregando...</div>
                        ) : filteredPatients.length > 0 ? (
                            <div style={styles.patientList}>
                                {filteredPatients.map(p => (
                                    <div key={p.id} style={styles.patientCard}>
                                        <div style={styles.patientAvatar}>{p.fullName.charAt(0).toUpperCase()}</div>
                                        <div style={styles.patientInfo}>
                                            <div style={styles.patientName}>{p.socialName || p.fullName}</div>
                                            <div style={styles.patientDetail}>Início: {new Date(p.treatmentStartDate).toLocaleDateString('pt-BR')}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={styles.emptyState}>
                                <div style={styles.emptyStateIcon}>👤</div>
                                <h2 style={styles.emptyStateTitle}>Comece pelo centro do cuidado.</h2>
                                <p style={styles.emptyStateDesc}>
                                    Cadastre o primeiro paciente para conectar agenda, sessões,
                                    prontuário e cobranças em uma rotina única.
                                </p>
                                <button style={styles.addPatientButton} onClick={() => setIsModalOpen(true)}>
                                    + Adicionar paciente
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Lado Direito: Agenda (Placeholder) */}
                <section style={styles.rightPane}>
                    <div style={styles.agendaTopControls}>
                        <button style={styles.agendaActionBtn}>+ Agendar</button>
                        <button style={styles.agendaActionBtn}>🔒 Bloquear</button>
                        <button style={{ ...styles.agendaActionBtn, ...styles.vacationBtn }}>✈️ Férias</button>
                    </div>
                    <div style={styles.agendaSubControls}>
                        <button style={styles.agendaSubBtn}>Google</button>
                        <button style={styles.agendaSubBtn}>Tela cheia</button>
                    </div>

                    <div style={styles.calendarContainer}>
                        <div style={styles.calendarHeader}>
                            <div style={styles.calendarNav}>
                                <button style={styles.navBtn}>{'<'}</button>
                                <button style={styles.navBtn}>{'>'}</button>
                            </div>
                            <div style={styles.calendarTitle}>Agosto de 2026</div>
                            <div style={styles.viewToggle}>
                                <button style={styles.viewToggleBtn}>mês</button>
                                <button style={{ ...styles.viewToggleBtn, ...styles.activeViewBtn }}>semana</button>
                                <button style={styles.viewToggleBtn}>dia</button>
                            </div>
                        </div>
                        <div style={styles.calendarGridPlaceholder}>
                            <div style={styles.calendarEmptyText}>Agenda Placeholder</div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Modal de Cadastro de Paciente */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>Adicionar Novo Paciente</h2>
                        <form onSubmit={handleAddPatient} style={styles.modalForm}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nome Completo *</label>
                                <input 
                                    required 
                                    style={styles.input} 
                                    value={newPatient.fullName} 
                                    onChange={e => setNewPatient({...newPatient, fullName: e.target.value})} 
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Telefone *</label>
                                <input 
                                    required 
                                    style={styles.input} 
                                    value={newPatient.phoneNumber} 
                                    onChange={e => setNewPatient({...newPatient, phoneNumber: e.target.value})} 
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Data de Nascimento *</label>
                                <input 
                                    type="date" 
                                    required 
                                    style={styles.input} 
                                    value={newPatient.dateOfBirth} 
                                    onChange={e => setNewPatient({...newPatient, dateOfBirth: e.target.value})} 
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Data de Início do Tratamento *</label>
                                <input 
                                    type="date" 
                                    required 
                                    style={styles.input} 
                                    value={newPatient.treatmentStartDate} 
                                    onChange={e => setNewPatient({...newPatient, treatmentStartDate: e.target.value})} 
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
                                <button type="submit" style={styles.saveBtn}>Salvar Paciente</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    pageContainer: {
        minHeight: '100vh',
        backgroundColor: '#eef2fb',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgb(238, 235, 255) 0%, rgb(240, 248, 255) 90%)',
        fontFamily: "'Inter', sans-serif",
        color: '#333',
        display: 'flex',
        flexDirection: 'column' as const,
    },
    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.8rem 2rem',
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
    },
    logo: {
        fontSize: '1.4rem',
        fontWeight: 'bold',
        color: '#6b4c9a',
    },
    navLinks: {
        display: 'flex',
        gap: '2rem',
    },
    navLink: {
        cursor: 'pointer',
        color: '#666',
        fontWeight: 500,
    },
    activeNavLink: {
        cursor: 'pointer',
        color: '#6b4c9a',
        fontWeight: 700,
        borderBottom: '2px solid #6b4c9a',
    },
    userProfile: {
        display: 'flex',
        alignItems: 'center',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
    },
    userName: {
        fontWeight: 'bold',
        fontSize: '0.95rem',
        color: '#555',
    },
    userPicture: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        objectFit: 'cover' as const,
        border: '2px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    mainContent: {
        display: 'flex',
        flex: 1,
        padding: '2rem',
        gap: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
    leftPane: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
    },
    rightPane: {
        flex: 1.2,
        background: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(15px)',
        borderRadius: '24px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
        boxShadow: '0 8px 32px rgba(107, 76, 154, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
    },
    searchSection: {
        display: 'flex',
        gap: '1rem',
    },
    searchInput: {
        flex: 1,
        padding: '0.8rem 1.5rem',
        borderRadius: '24px',
        border: 'none',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.05)',
        fontSize: '1rem',
        outline: 'none',
    },
    listControls: {
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
    },
    filterChip: {
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        border: 'none',
        background: 'rgba(255, 255, 255, 0.7)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        cursor: 'pointer',
        fontWeight: 500,
        color: '#555',
    },
    actionButtons: {
        display: 'flex',
        gap: '1rem',
    },
    primaryButton: {
        flex: 1,
        padding: '0.8rem',
        borderRadius: '24px',
        border: 'none',
        background: 'linear-gradient(135deg, #6b4c9a, #4a7ab5)',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(107, 76, 154, 0.3)',
    },
    patientsListContainer: {
        flex: 1,
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(107, 76, 154, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        display: 'flex',
        flexDirection: 'column' as const,
    },
    emptyState: {
        margin: 'auto',
        textAlign: 'center' as const,
        maxWidth: '400px',
    },
    emptyStateIcon: {
        fontSize: '3rem',
        background: '#e0d4f5',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
        color: '#6b4c9a',
    },
    emptyStateTitle: {
        fontSize: '1.8rem',
        color: '#333',
        marginBottom: '1rem',
        fontFamily: "'Playfair Display', serif",
    },
    emptyStateDesc: {
        color: '#666',
        lineHeight: 1.5,
        marginBottom: '2rem',
    },
    addPatientButton: {
        padding: '0.8rem 1.5rem',
        borderRadius: '24px',
        border: 'none',
        background: '#6b4c9a',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(107, 76, 154, 0.3)',
    },
    patientList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
    },
    patientCard: {
        background: 'white',
        padding: '1rem',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    },
    patientAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#e0d4f5',
        color: '#6b4c9a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontWeight: 'bold',
        color: '#333',
    },
    patientDetail: {
        fontSize: '0.85rem',
        color: '#888',
    },
    agendaTopControls: {
        display: 'flex',
        gap: '1rem',
    },
    agendaActionBtn: {
        flex: 1,
        padding: '0.8rem',
        borderRadius: '24px',
        border: 'none',
        background: 'white',
        fontWeight: 500,
        color: '#555',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        cursor: 'pointer',
    },
    vacationBtn: {
        background: 'linear-gradient(135deg, #a388d4, #8fa3d6)',
        color: 'white',
    },
    agendaSubControls: {
        display: 'flex',
        gap: '1rem',
    },
    agendaSubBtn: {
        flex: 1,
        padding: '0.6rem',
        borderRadius: '24px',
        border: 'none',
        background: 'white',
        fontWeight: 500,
        color: '#555',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        cursor: 'pointer',
    },
    calendarContainer: {
        background: 'white',
        borderRadius: '20px',
        padding: '1.5rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    },
    calendarHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    },
    calendarNav: {
        display: 'flex',
        gap: '0.5rem',
    },
    navBtn: {
        background: 'none',
        border: '1px solid #eee',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        cursor: 'pointer',
    },
    calendarTitle: {
        fontWeight: 'bold',
        color: '#333',
    },
    viewToggle: {
        display: 'flex',
        background: '#f5f5f5',
        borderRadius: '20px',
        padding: '0.2rem',
    },
    viewToggleBtn: {
        background: 'none',
        border: 'none',
        padding: '0.4rem 0.8rem',
        borderRadius: '16px',
        cursor: 'pointer',
        color: '#666',
        fontSize: '0.85rem',
    },
    activeViewBtn: {
        background: '#5a8dee',
        color: 'white',
        fontWeight: 'bold',
    },
    calendarGridPlaceholder: {
        flex: 1,
        border: '1px dashed #ccc',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
    },
    calendarEmptyText: {
        color: '#aaa',
    },
    modalOverlay: {
        position: 'fixed' as const,
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(5px)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '24px',
        width: '400px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    },
    modalTitle: {
        marginTop: 0,
        marginBottom: '1.5rem',
        color: '#333',
        fontFamily: "'Playfair Display', serif",
    },
    modalForm: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.4rem',
    },
    label: {
        fontSize: '0.9rem',
        color: '#555',
        fontWeight: 'bold',
    },
    input: {
        padding: '0.8rem',
        borderRadius: '12px',
        border: '1px solid #ccc',
        fontSize: '1rem',
        outline: 'none',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        marginTop: '1rem',
    },
    cancelBtn: {
        padding: '0.8rem 1.5rem',
        borderRadius: '24px',
        border: 'none',
        background: '#f0f0f0',
        color: '#555',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    saveBtn: {
        padding: '0.8rem 1.5rem',
        borderRadius: '24px',
        border: 'none',
        background: '#6b4c9a',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
};