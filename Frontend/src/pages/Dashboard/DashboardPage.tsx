import React, { useState, useEffect, useContext } from 'react';
import { ENV } from '../../config/env';
import { AuthContext } from '../../contexts/AuthContext';

export const Gender = {
    Male: 1,
    Female: 2,
    Others: 3
} as const;
export type Gender = typeof Gender[keyof typeof Gender];

export const PatientFrequency = {
    Weekly: 0,
    BiWeekly: 1,
    Monthly: 2
} as const;
export type PatientFrequency = typeof PatientFrequency[keyof typeof PatientFrequency];

export const ContactType = {
    Primary: 1,
    Secondary: 2,
    LegalRepresentative: 3,
    Psychiatrist: 4,
    Other: 5
} as const;
export type ContactType = typeof ContactType[keyof typeof ContactType];

export interface EmergencyContact {
    id?: string;
    name: string;
    socialName?: string;
    phoneNumber: string;
    email?: string;
    type: ContactType;
}

export interface Patient {
    id?: string;
    fullName: string;
    socialName?: string;
    email?: string;
    phoneNumber: string;
    dateOfBirth: string;
    cpf?: string;
    treatmentStartDate: string;
    gender: Gender;
    profession?: string;
    countryOfResidence?: string;
    frequency: PatientFrequency;
    emergencyContacts: EmergencyContact[];
}

const emptyPatient: Patient = {
    fullName: '',
    phoneNumber: '',
    treatmentStartDate: '',
    dateOfBirth: '',
    email: '',
    socialName: '',
    cpf: '',
    gender: Gender.Others,
    profession: '',
    countryOfResidence: '',
    frequency: PatientFrequency.Weekly,
    emergencyContacts: []
};

// Funções Utilitárias para Máscaras
const formatCpf = (value: string) => {
    return value
        .replace(/\D/g, '') // Remove tudo o que não for número
        .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto
        .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto
        .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Adiciona hífen
        .replace(/(-\d{2})\d+?$/, '$1'); // Limita o tamanho
};

const formatPhone = (value: string) => {
    // Permite que o usuário digite '+' no começo para números internacionais, ignorando a máscara local
    if (value.startsWith('+')) return value; 
    
    const v = value.replace(/\D/g, '');
    if (v.length <= 10) {
        return v
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 14); // Padrão: (99) 9999-9999
    }
    return v
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 15); // Padrão: (99) 99999-9999
};

export function DashboardPage() {
    const authContext = useContext(AuthContext);
    const user = authContext?.user;

    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPatient, setNewPatient] = useState<Patient>(emptyPatient);

    // View/Edit Modal states
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

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
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newPatient)
            });
            
            if (response.ok) {
                setIsModalOpen(false);
                fetchPatients(); // Recarrega a lista
                setNewPatient(emptyPatient);
            } else {
                console.error("Falha ao salvar paciente");
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
        }
    };

    const handleUpdatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient?.id) return;
        try {
            const response = await fetch(`${ENV.API_URL}/patients/${selectedPatient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(selectedPatient)
            });
            
            if (response.ok) {
                setIsViewModalOpen(false);
                setIsEditMode(false);
                fetchPatients();
            } else {
                console.error("Falha ao atualizar paciente");
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
        }
    };

    const handleDeletePatient = async () => {
        if (!selectedPatient?.id) return;
        if (!window.confirm('Tem certeza que deseja remover este paciente? Esta ação não pode ser desfeita.')) return;
        
        try {
            const response = await fetch(`${ENV.API_URL}/patients/${selectedPatient.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                setIsViewModalOpen(false);
                fetchPatients();
            } else {
                console.error("Falha ao remover paciente");
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
        }
    };

    const openViewModal = (patient: Patient) => {
        // Formatar datas para o input type="date" (YYYY-MM-DD)
        const formatForDateInput = (isoDate: string) => isoDate ? isoDate.split('T')[0] : '';
        
        setSelectedPatient({
            ...patient,
            dateOfBirth: formatForDateInput(patient.dateOfBirth),
            treatmentStartDate: formatForDateInput(patient.treatmentStartDate),
        });
        setIsEditMode(false);
        setIsViewModalOpen(true);
    };

    const handleAddEmergencyContact = (isUpdating: boolean) => {
        const newContact: EmergencyContact = {
            name: '',
            phoneNumber: '',
            type: ContactType.Primary
        };
        
        if (isUpdating && selectedPatient) {
            setSelectedPatient({
                ...selectedPatient,
                emergencyContacts: [...(selectedPatient.emergencyContacts || []), newContact]
            });
        } else {
            setNewPatient({
                ...newPatient,
                emergencyContacts: [...(newPatient.emergencyContacts || []), newContact]
            });
        }
    };

    const handleRemoveEmergencyContact = (index: number, isUpdating: boolean) => {
        if (isUpdating && selectedPatient) {
            const contacts = [...(selectedPatient.emergencyContacts || [])];
            contacts.splice(index, 1);
            setSelectedPatient({ ...selectedPatient, emergencyContacts: contacts });
        } else {
            const contacts = [...(newPatient.emergencyContacts || [])];
            contacts.splice(index, 1);
            setNewPatient({ ...newPatient, emergencyContacts: contacts });
        }
    };

    const handleEmergencyContactChange = (index: number, field: keyof EmergencyContact, value: any, isUpdating: boolean) => {
        if (isUpdating && selectedPatient) {
            const contacts = [...(selectedPatient.emergencyContacts || [])];
            contacts[index] = { ...contacts[index], [field]: value };
            setSelectedPatient({ ...selectedPatient, emergencyContacts: contacts });
        } else {
            const contacts = [...(newPatient.emergencyContacts || [])];
            contacts[index] = { ...contacts[index], [field]: value };
            setNewPatient({ ...newPatient, emergencyContacts: contacts });
        }
    };

    const filteredPatients = patients.filter(p =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.socialName && p.socialName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Reusable Form Fields component to avoid duplication between Create and Edit modals
    const renderPatientFormFields = (patient: Patient, setPatient: (p: Patient) => void, isUpdating: boolean) => (
        <>
            <h3 style={styles.sectionTitle}>Dados Pessoais</h3>
            <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Nome Completo *</label>
                    <input required style={styles.input} value={patient.fullName} onChange={e => setPatient({...patient, fullName: e.target.value})} disabled={!isEditMode && isUpdating} />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Nome Social</label>
                    <input style={styles.input} value={patient.socialName || ''} onChange={e => setPatient({...patient, socialName: e.target.value})} disabled={!isEditMode && isUpdating} />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>E-mail</label>
                    <input type="email" style={styles.input} value={patient.email || ''} onChange={e => setPatient({...patient, email: e.target.value})} disabled={!isEditMode && isUpdating} />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Telefone *</label>
                    <input required style={styles.input} value={patient.phoneNumber} onChange={e => setPatient({...patient, phoneNumber: formatPhone(e.target.value)})} disabled={!isEditMode && isUpdating} placeholder="(11) 99999-9999 ou +1..." />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Data de Nascimento *</label>
                    <input type="date" required style={styles.input} value={patient.dateOfBirth} onChange={e => setPatient({...patient, dateOfBirth: e.target.value})} disabled={!isEditMode && isUpdating} />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>CPF</label>
                    <input style={styles.input} value={patient.cpf || ''} onChange={e => setPatient({...patient, cpf: formatCpf(e.target.value)})} disabled={!isEditMode && isUpdating} placeholder="000.000.000-00" />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Gênero</label>
                    <select style={styles.input} value={patient.gender} onChange={e => setPatient({...patient, gender: Number(e.target.value) as Gender})} disabled={!isEditMode && isUpdating}>
                        <option value={Gender.Male}>Masculino</option>
                        <option value={Gender.Female}>Feminino</option>
                        <option value={Gender.Others}>Outros</option>
                    </select>
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Profissão</label>
                    <input style={styles.input} value={patient.profession || ''} onChange={e => setPatient({...patient, profession: e.target.value})} disabled={!isEditMode && isUpdating} />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>País de Residência</label>
                    <input style={styles.input} value={patient.countryOfResidence || ''} onChange={e => setPatient({...patient, countryOfResidence: e.target.value})} disabled={!isEditMode && isUpdating} />
                </div>
            </div>

            <h3 style={styles.sectionTitle}>Dados do Tratamento</h3>
            <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Início do Tratamento *</label>
                    <input type="date" required style={styles.input} value={patient.treatmentStartDate} onChange={e => setPatient({...patient, treatmentStartDate: e.target.value})} disabled={!isEditMode && isUpdating} />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Frequência</label>
                    <select style={styles.input} value={patient.frequency} onChange={e => setPatient({...patient, frequency: Number(e.target.value) as PatientFrequency})} disabled={!isEditMode && isUpdating}>
                        <option value={PatientFrequency.Weekly}>Semanal</option>
                        <option value={PatientFrequency.BiWeekly}>Quinzenal</option>
                        <option value={PatientFrequency.Monthly}>Mensal</option>
                    </select>
                </div>
            </div>

            <h3 style={styles.sectionTitle}>Contatos de Emergência</h3>
            {(patient.emergencyContacts || []).map((contact, index) => (
                <div key={index} style={styles.emergencyContactCard}>
                    <div style={styles.formGrid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Nome *</label>
                            <input required style={styles.input} value={contact.name} onChange={e => handleEmergencyContactChange(index, 'name', e.target.value, isUpdating)} disabled={!isEditMode && isUpdating} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Telefone *</label>
                            <input required style={styles.input} value={contact.phoneNumber} onChange={e => handleEmergencyContactChange(index, 'phoneNumber', formatPhone(e.target.value), isUpdating)} disabled={!isEditMode && isUpdating} placeholder="(11) 99999-9999" />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Tipo</label>
                            <select style={styles.input} value={contact.type} onChange={e => handleEmergencyContactChange(index, 'type', Number(e.target.value) as ContactType, isUpdating)} disabled={!isEditMode && isUpdating}>
                                <option value={ContactType.Primary}>Primário</option>
                                <option value={ContactType.Secondary}>Secundário</option>
                                <option value={ContactType.LegalRepresentative}>Responsável Legal</option>
                                <option value={ContactType.Psychiatrist}>Psiquiatra</option>
                                <option value={ContactType.Other}>Outro</option>
                            </select>
                        </div>
                    </div>
                    {(!isUpdating || isEditMode) && (
                        <button type="button" style={styles.removeContactBtn} onClick={() => handleRemoveEmergencyContact(index, isUpdating)}>Remover Contato</button>
                    )}
                </div>
            ))}
            {(!isUpdating || isEditMode) && (
                <button type="button" style={styles.addContactBtn} onClick={() => handleAddEmergencyContact(isUpdating)}>+ Adicionar Contato de Emergência</button>
            )}
        </>
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
                                    <div key={p.id} style={{...styles.patientCard, cursor: 'pointer'}} onClick={() => openViewModal(p)}>
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
                            {renderPatientFormFields(newPatient, setNewPatient, false)}
                            
                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
                                <button type="submit" style={styles.saveBtn}>Salvar Paciente</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Visualização/Edição de Paciente */}
            {isViewModalOpen && selectedPatient && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h2 style={{ ...styles.modalTitle, marginBottom: 0 }}>{isEditMode ? 'Editar Paciente' : 'Detalhes do Paciente'}</h2>
                            <button type="button" onClick={() => setIsEditMode(!isEditMode)} style={styles.editToggleBtn}>
                                {isEditMode ? 'Cancelar Edição' : 'Editar'}
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdatePatient} style={styles.modalForm}>
                            {renderPatientFormFields(selectedPatient, setSelectedPatient, true)}
                            
                            <div style={{ ...styles.modalActions, justifyContent: 'space-between', marginTop: '2rem' }}>
                                <button type="button" onClick={handleDeletePatient} style={styles.deleteBtn}>Excluir Paciente</button>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" onClick={() => { setIsViewModalOpen(false); setIsEditMode(false); }} style={styles.cancelBtn}>Fechar</button>
                                    {isEditMode && <button type="submit" style={styles.saveBtn}>Salvar Alterações</button>}
                                </div>
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
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
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
        width: '600px',
        maxHeight: '90vh',
        overflowY: 'auto' as const,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
    },
    modalTitle: {
        marginTop: 0,
        color: '#333',
        fontFamily: "'Playfair Display', serif",
    },
    editToggleBtn: {
        padding: '0.5rem 1rem',
        borderRadius: '16px',
        border: '1px solid #6b4c9a',
        background: 'transparent',
        color: '#6b4c9a',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    sectionTitle: {
        fontSize: '1.1rem',
        color: '#6b4c9a',
        borderBottom: '1px solid #eee',
        paddingBottom: '0.5rem',
        marginTop: '1.5rem',
        marginBottom: '1rem',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
    },
    modalForm: {
        display: 'flex',
        flexDirection: 'column' as const,
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.4rem',
    },
    label: {
        fontSize: '0.85rem',
        color: '#555',
        fontWeight: 'bold',
    },
    input: {
        padding: '0.7rem',
        borderRadius: '12px',
        border: '1px solid #ddd',
        fontSize: '0.95rem',
        outline: 'none',
        background: '#fcfcfc',
    },
    emergencyContactCard: {
        border: '1px solid #eee',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        background: '#f9f9fa',
    },
    addContactBtn: {
        padding: '0.6rem 1rem',
        borderRadius: '12px',
        border: '1px dashed #6b4c9a',
        background: 'transparent',
        color: '#6b4c9a',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '0.5rem',
        alignSelf: 'flex-start' as const,
    },
    removeContactBtn: {
        padding: '0.4rem 0.8rem',
        borderRadius: '8px',
        border: 'none',
        background: '#ffeeee',
        color: '#d9534f',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '1rem',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        marginTop: '2rem',
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
    deleteBtn: {
        padding: '0.8rem 1.5rem',
        borderRadius: '24px',
        border: 'none',
        background: '#fff0f0',
        color: '#d9534f',
        fontWeight: 'bold',
        cursor: 'pointer',
    }
};