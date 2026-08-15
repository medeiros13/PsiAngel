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

export const PaymentType = {
    PerSession: 1,
    Package: 2
} as const;
export type PaymentType = typeof PaymentType[keyof typeof PaymentType];

export const Currency = {
    BRL: 1,
    USD: 2,
    EUR: 3
} as const;
export type Currency = typeof Currency[keyof typeof Currency];

export const PaymentMethod = {
    CreditCard: 1,
    Pix: 2,
    Cash: 3,
    Transfer: 4
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PackageType = {
    Monthly: 1,
    PerSessions: 2
} as const;
export type PackageType = typeof PackageType[keyof typeof PackageType];

export const BillingStartDateType = {
    CurrentMonth: 1,
    CustomDate: 2
} as const;
export type BillingStartDateType = typeof BillingStartDateType[keyof typeof BillingStartDateType];

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
    
    // Gestão Financeira
    paymentType?: PaymentType;
    currency?: Currency;
    sessionPrice?: number;
    paymentMethod?: PaymentMethod;
    packageType?: PackageType;
    billingStartDateType?: BillingStartDateType;
    customBillingDate?: string;
    sessionQuantity?: number;
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
    emergencyContacts: [],
    currency: Currency.BRL // Padrão BRL
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

const formatCurrency = (value: number | undefined, currency: Currency | undefined) => {
    if (value === undefined || isNaN(value)) return '';
    
    if (currency === Currency.USD) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    } else if (currency === Currency.EUR) {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    }
    // Default BRL
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const parseCurrency = (formattedValue: string) => {
    const digits = formattedValue.replace(/\D/g, '');
    if (!digits) return undefined;
    return parseInt(digits, 10) / 100;
};

export function DashboardPage() {
    const authContext = useContext(AuthContext);
    const user = authContext?.user;

    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
    const [sortDesc, setSortDesc] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPatient, setNewPatient] = useState<Patient>(emptyPatient);

    // View/Edit Modal states
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPatients();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [currentPage, searchTerm, sortBy, sortDesc]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isModalOpen) setIsModalOpen(false);
                if (isViewModalOpen) {
                    setIsViewModalOpen(false);
                    setIsEditMode(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, isViewModalOpen]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10'
            });
            if (searchTerm) {
                queryParams.append('search', searchTerm);
            }
            queryParams.append('sortBy', sortBy);
            queryParams.append('sortDesc', sortDesc.toString());
            
            const response = await fetch(`${ENV.API_URL}/patients?${queryParams.toString()}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setPatients(data.items || []);
                setTotalPages(data.totalPages || 1);
                setTotalItems(data.totalItems || 0);
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

    // O filtro local não é mais necessário pois é feito no backend.
    const filteredPatients = patients;

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

            <h3 style={styles.sectionTitle}>Gestão Financeira</h3>
            <div style={{ ...styles.formGrid, gridTemplateColumns: '1fr' }}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Tipo de Pagamento</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: (!isEditMode && isUpdating) ? 'not-allowed' : 'pointer' }}>
                            <input 
                                type="radio" 
                                name="paymentType" 
                                value={PaymentType.PerSession}
                                checked={patient.paymentType === PaymentType.PerSession}
                                onChange={() => setPatient({ ...patient, paymentType: PaymentType.PerSession, packageType: undefined })}
                                disabled={!isEditMode && isUpdating}
                            />
                            Por sessão
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: (!isEditMode && isUpdating) ? 'not-allowed' : 'pointer' }}>
                            <input 
                                type="radio" 
                                name="paymentType" 
                                value={PaymentType.Package}
                                checked={patient.paymentType === PaymentType.Package}
                                onChange={() => setPatient({ ...patient, paymentType: PaymentType.Package })}
                                disabled={!isEditMode && isUpdating}
                            />
                            Por pacote
                        </label>
                    </div>
                </div>
            </div>

            {patient.paymentType === PaymentType.PerSession && (
                <div style={styles.formGrid}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Moeda</label>
                        <select 
                            style={styles.input} 
                            value={patient.currency || Currency.BRL} 
                            onChange={e => setPatient({...patient, currency: Number(e.target.value) as Currency})} 
                            disabled={!isEditMode && isUpdating}
                        >
                            <option value={Currency.BRL}>BRL (R$)</option>
                            <option value={Currency.USD}>USD ($)</option>
                            <option value={Currency.EUR}>EUR (€)</option>
                        </select>
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Valor da sessão</label>
                        <input 
                            style={styles.input} 
                            value={patient.sessionPrice !== undefined ? formatCurrency(patient.sessionPrice, patient.currency || Currency.BRL) : ''}
                            onChange={e => setPatient({...patient, sessionPrice: parseCurrency(e.target.value)})} 
                            disabled={!isEditMode && isUpdating} 
                            placeholder="0,00"
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Meio de pagamento</label>
                        <select 
                            style={styles.input} 
                            value={patient.paymentMethod || ''} 
                            onChange={e => setPatient({...patient, paymentMethod: Number(e.target.value) as PaymentMethod})} 
                            disabled={!isEditMode && isUpdating}
                        >
                            <option value="">Selecione...</option>
                            <option value={PaymentMethod.CreditCard}>Cartão de crédito</option>
                            <option value={PaymentMethod.Pix}>Pix</option>
                            <option value={PaymentMethod.Cash}>Dinheiro</option>
                            <option value={PaymentMethod.Transfer}>Transferência</option>
                        </select>
                    </div>
                </div>
            )}

            {patient.paymentType === PaymentType.Package && (
                <>
                    <div style={{ ...styles.formGrid, gridTemplateColumns: '1fr', marginTop: '1rem' }}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Tipo de Pacote</label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: (!isEditMode && isUpdating) ? 'not-allowed' : 'pointer' }}>
                                    <input 
                                        type="radio" 
                                        name="packageType" 
                                        value={PackageType.Monthly}
                                        checked={patient.packageType === PackageType.Monthly}
                                        onChange={() => setPatient({ ...patient, packageType: PackageType.Monthly, sessionQuantity: undefined })}
                                        disabled={!isEditMode && isUpdating}
                                    />
                                    Mensal
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: (!isEditMode && isUpdating) ? 'not-allowed' : 'pointer' }}>
                                    <input 
                                        type="radio" 
                                        name="packageType" 
                                        value={PackageType.PerSessions}
                                        checked={patient.packageType === PackageType.PerSessions}
                                        onChange={() => setPatient({ ...patient, packageType: PackageType.PerSessions, billingStartDateType: undefined, customBillingDate: undefined })}
                                        disabled={!isEditMode && isUpdating}
                                    />
                                    Por sessões
                                </label>
                            </div>
                        </div>
                    </div>

                    {patient.packageType === PackageType.Monthly && (
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Início da cobrança</label>
                                <select 
                                    style={styles.input} 
                                    value={patient.billingStartDateType || ''} 
                                    onChange={e => setPatient({...patient, billingStartDateType: Number(e.target.value) as BillingStartDateType})} 
                                    disabled={!isEditMode && isUpdating}
                                >
                                    <option value="">Selecione...</option>
                                    <option value={BillingStartDateType.CurrentMonth}>Mensalidade atual</option>
                                    <option value={BillingStartDateType.CustomDate}>Definir data</option>
                                </select>
                            </div>
                            
                            {patient.billingStartDateType === BillingStartDateType.CustomDate && (
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Data da cobrança</label>
                                    <input 
                                        type="date"
                                        style={styles.input} 
                                        value={patient.customBillingDate || ''} 
                                        onChange={e => setPatient({...patient, customBillingDate: e.target.value})} 
                                        disabled={!isEditMode && isUpdating}
                                    />
                                </div>
                            )}

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Moeda</label>
                                <select 
                                    style={styles.input} 
                                    value={patient.currency || Currency.BRL} 
                                    onChange={e => setPatient({...patient, currency: Number(e.target.value) as Currency})} 
                                    disabled={!isEditMode && isUpdating}
                                >
                                    <option value={Currency.BRL}>BRL (R$)</option>
                                    <option value={Currency.USD}>USD ($)</option>
                                    <option value={Currency.EUR}>EUR (€)</option>
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Valor</label>
                                <input 
                                    style={styles.input} 
                                    value={patient.sessionPrice !== undefined ? formatCurrency(patient.sessionPrice, patient.currency || Currency.BRL) : ''}
                                    onChange={e => setPatient({...patient, sessionPrice: parseCurrency(e.target.value)})} 
                                    disabled={!isEditMode && isUpdating} 
                                    placeholder="0,00"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Meio de pagamento</label>
                                <select 
                                    style={styles.input} 
                                    value={patient.paymentMethod || ''} 
                                    onChange={e => setPatient({...patient, paymentMethod: Number(e.target.value) as PaymentMethod})} 
                                    disabled={!isEditMode && isUpdating}
                                >
                                    <option value="">Selecione...</option>
                                    <option value={PaymentMethod.CreditCard}>Cartão de crédito</option>
                                    <option value={PaymentMethod.Pix}>Pix</option>
                                    <option value={PaymentMethod.Cash}>Dinheiro</option>
                                    <option value={PaymentMethod.Transfer}>Transferência</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {patient.packageType === PackageType.PerSessions && (
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Moeda</label>
                                <select 
                                    style={styles.input} 
                                    value={patient.currency || Currency.BRL} 
                                    onChange={e => setPatient({...patient, currency: Number(e.target.value) as Currency})} 
                                    disabled={!isEditMode && isUpdating}
                                >
                                    <option value={Currency.BRL}>BRL (R$)</option>
                                    <option value={Currency.USD}>USD ($)</option>
                                    <option value={Currency.EUR}>EUR (€)</option>
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Valor</label>
                                <input 
                                    style={styles.input} 
                                    value={patient.sessionPrice !== undefined ? formatCurrency(patient.sessionPrice, patient.currency || Currency.BRL) : ''}
                                    onChange={e => setPatient({...patient, sessionPrice: parseCurrency(e.target.value)})} 
                                    disabled={!isEditMode && isUpdating} 
                                    placeholder="0,00"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Quantidade de sessões</label>
                                <input 
                                    type="number"
                                    min="1"
                                    style={styles.input} 
                                    value={patient.sessionQuantity || ''}
                                    onChange={e => setPatient({...patient, sessionQuantity: parseInt(e.target.value, 10)})} 
                                    disabled={!isEditMode && isUpdating} 
                                    placeholder="Ex: 4"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Meio de pagamento</label>
                                <select 
                                    style={styles.input} 
                                    value={patient.paymentMethod || ''} 
                                    onChange={e => setPatient({...patient, paymentMethod: Number(e.target.value) as PaymentMethod})} 
                                    disabled={!isEditMode && isUpdating}
                                >
                                    <option value="">Selecione...</option>
                                    <option value={PaymentMethod.CreditCard}>Cartão de crédito</option>
                                    <option value={PaymentMethod.Pix}>Pix</option>
                                    <option value={PaymentMethod.Cash}>Dinheiro</option>
                                    <option value={PaymentMethod.Transfer}>Transferência</option>
                                </select>
                            </div>
                        </div>
                    )}
                </>
            )}

            {(!isUpdating || isEditMode || (patient.emergencyContacts && patient.emergencyContacts.length > 0)) && (
                <>
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
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        <div style={styles.sortContainer}>
                            <select 
                                style={styles.sortSelect} 
                                value={sortBy} 
                                onChange={e => {
                                    setSortBy(e.target.value as 'date' | 'name');
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="date">Início tratamento</option>
                                <option value="name">Nome</option>
                            </select>
                            <button 
                                type="button"
                                style={styles.sortDirectionBtn} 
                                onClick={() => {
                                    setSortDesc(!sortDesc);
                                    setCurrentPage(1);
                                }}
                                title={sortDesc ? "Ordem Decrescente" : "Ordem Crescente"}
                            >
                                <svg 
                                    width="24" 
                                    height="24" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    style={{
                                        transform: sortDesc ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <path d="M12 19V5M5 12l7-7 7 7"/>
                                </svg>
                            </button>
                        </div>
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
                                            <div style={styles.patientDetail}>Início: {new Date(p.treatmentStartDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
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
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div style={styles.paginationContainer}>
                                <button 
                                    style={currentPage === 1 ? styles.paginationBtnDisabled : styles.paginationBtn} 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </button>
                                <span style={styles.paginationText}>
                                    Página {currentPage} de {totalPages} ({totalItems} pacientes)
                                </span>
                                <button 
                                    style={currentPage === totalPages ? styles.paginationBtnDisabled : styles.paginationBtn} 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Próxima
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
                <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={{ ...styles.modalTitle, marginBottom: 0 }}>Adicionar Novo Paciente</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={styles.iconActionBtn} title="Fechar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddPatient} style={styles.modalForm}>
                            {renderPatientFormFields(newPatient, setNewPatient, false)}
                            
                            <div style={{ ...styles.modalActions, justifyContent: 'flex-end', marginTop: '2rem' }}>
                                <button type="submit" style={styles.saveBtn}>Salvar Paciente</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Visualização/Edição de Paciente */}
            {isViewModalOpen && selectedPatient && (
                <div style={styles.modalOverlay} onClick={() => { setIsViewModalOpen(false); setIsEditMode(false); }}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={{ ...styles.modalTitle, marginBottom: 0 }}>{isEditMode ? 'Editar Paciente' : 'Detalhes do Paciente'}</h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={handleDeletePatient} style={styles.iconActionBtn} title="Excluir">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                                <button type="button" onClick={() => setIsEditMode(!isEditMode)} style={styles.iconActionBtn} title={isEditMode ? 'Cancelar Edição' : 'Editar'}>
                                    {isEditMode ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                    )}
                                </button>
                                <button type="button" onClick={() => { setIsViewModalOpen(false); setIsEditMode(false); }} style={styles.iconActionBtn} title="Fechar">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>
                        </div>
                        
                        <form onSubmit={handleUpdatePatient} style={styles.modalForm}>
                            {renderPatientFormFields(selectedPatient, setSelectedPatient, true)}
                            
                            {isEditMode && (
                                <div style={{ ...styles.modalActions, justifyContent: 'flex-end', marginTop: '2rem' }}>
                                    <button type="submit" style={styles.saveBtn}>Salvar Alterações</button>
                                </div>
                            )}
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
        backgroundColor: 'var(--color-background)',
        backgroundImage: 'radial-gradient(circle at 10% 20%, var(--color-pink-light-2) 0%, var(--color-background) 90%)',
        fontFamily: 'var(--sans)',
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column' as const,
    },
    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.8rem 2rem',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--color-pink-light-1)',
    },
    logo: {
        fontSize: '1.8rem',
        fontFamily: 'var(--casual)',
        fontWeight: 'bold',
        color: 'var(--color-secondary)',
    },
    navLinks: {
        display: 'flex',
        gap: '2rem',
    },
    navLink: {
        cursor: 'pointer',
        color: 'var(--color-text)',
        fontWeight: 500,
    },
    activeNavLink: {
        cursor: 'pointer',
        color: 'var(--color-primary)',
        fontWeight: 700,
        borderBottom: '2px solid var(--color-secondary)',
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
        color: 'var(--color-text)',
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
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(15px)',
        borderRadius: '24px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
        boxShadow: '0 8px 32px rgba(221, 78, 119, 0.05)',
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
        fontFamily: 'var(--sans)',
    },
    sortContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    sortSelect: {
        padding: '0.6rem 1.2rem',
        borderRadius: '20px',
        border: 'none',
        background: 'rgba(255, 255, 255, 0.7)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        fontSize: '0.95rem',
        fontWeight: 500,
        outline: 'none',
        fontFamily: 'var(--sans)',
        color: 'var(--color-primary)',
        cursor: 'pointer',
    },
    sortDirectionBtn: {
        background: 'transparent',
        border: 'none',
        color: 'var(--color-magenta)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem',
        transition: 'opacity 0.2s ease',
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
        color: 'var(--color-primary)',
        fontFamily: 'var(--sans)',
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
        background: 'linear-gradient(135deg, var(--color-magenta), var(--color-pink-medium))',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(221, 78, 119, 0.3)',
        fontFamily: 'var(--sans)',
    },
    patientsListContainer: {
        flex: 1,
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(221, 78, 119, 0.05)',
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
        background: 'var(--color-pink-light-2)',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
        color: 'var(--color-magenta)',
    },
    emptyStateTitle: {
        fontSize: '1.8rem',
        color: 'var(--color-primary)',
        marginBottom: '1rem',
        fontFamily: 'var(--heading)',
    },
    emptyStateDesc: {
        color: 'var(--color-text)',
        lineHeight: 1.5,
        marginBottom: '2rem',
    },
    addPatientButton: {
        padding: '0.8rem 1.5rem',
        borderRadius: '24px',
        border: 'none',
        background: 'var(--color-magenta)',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(221, 78, 119, 0.3)',
        fontFamily: 'var(--sans)',
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
        background: 'var(--color-pink-light-2)',
        color: 'var(--color-primary)',
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
        color: 'var(--color-primary)',
        fontFamily: 'var(--heading)',
    },
    patientDetail: {
        fontSize: '0.85rem',
        color: 'var(--color-text)',
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
        color: 'var(--color-primary)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
    },
    vacationBtn: {
        background: 'linear-gradient(135deg, var(--color-pink-light-1), var(--color-pink-medium))',
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
        color: 'var(--color-primary)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
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
        border: '1px solid var(--color-pink-light-1)',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        cursor: 'pointer',
        color: 'var(--color-primary)',
    },
    calendarTitle: {
        fontWeight: 'bold',
        color: 'var(--color-primary)',
        fontFamily: 'var(--heading)',
    },
    viewToggle: {
        display: 'flex',
        background: 'var(--color-pink-baby)',
        borderRadius: '20px',
        padding: '0.2rem',
    },
    viewToggleBtn: {
        background: 'none',
        border: 'none',
        padding: '0.4rem 0.8rem',
        borderRadius: '16px',
        cursor: 'pointer',
        color: 'var(--color-primary)',
        fontSize: '0.85rem',
        fontFamily: 'var(--sans)',
    },
    activeViewBtn: {
        background: 'var(--color-magenta)',
        color: 'white',
        fontWeight: 'bold',
    },
    calendarGridPlaceholder: {
        flex: 1,
        border: '1px dashed var(--color-pink-light-1)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-pink-baby)',
    },
    calendarEmptyText: {
        color: 'var(--color-magenta)',
        fontFamily: 'var(--casual)',
        fontSize: '1.5rem',
    },
    modalOverlay: {
        position: 'fixed' as const,
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(20, 38, 69, 0.5)',
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
        color: 'var(--color-primary)',
        fontFamily: 'var(--heading)',
    },
    editToggleBtn: {
        padding: '0.5rem 1rem',
        borderRadius: '16px',
        border: '1px solid var(--color-magenta)',
        background: 'transparent',
        color: 'var(--color-magenta)',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
    },
    sectionTitle: {
        fontSize: '1.1rem',
        color: 'var(--color-secondary)',
        borderBottom: '1px solid var(--color-pink-light-1)',
        paddingBottom: '0.5rem',
        marginTop: '1.5rem',
        marginBottom: '1rem',
        fontFamily: 'var(--heading)',
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
        color: 'var(--color-primary)',
        fontWeight: 'bold',
        fontFamily: 'var(--sans)',
    },
    input: {
        padding: '0.7rem',
        borderRadius: '12px',
        border: '1px solid var(--color-pink-light-1)',
        fontSize: '0.95rem',
        outline: 'none',
        background: '#fff',
        fontFamily: 'var(--sans)',
        color: 'var(--color-text)',
    },
    emergencyContactCard: {
        border: '1px solid var(--color-pink-light-2)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        background: 'var(--color-pink-baby)',
    },
    addContactBtn: {
        padding: '0.6rem 1rem',
        borderRadius: '12px',
        border: '1px dashed var(--color-magenta)',
        background: 'transparent',
        color: 'var(--color-magenta)',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '0.5rem',
        alignSelf: 'flex-start' as const,
        fontFamily: 'var(--sans)',
    },
    removeContactBtn: {
        padding: '0.4rem 0.8rem',
        borderRadius: '8px',
        border: 'none',
        background: '#fff0f0',
        color: '#d9534f',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '1rem',
        fontFamily: 'var(--sans)',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        marginTop: '2rem',
    },
    iconActionBtn: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '1px solid var(--color-pink-light-1)',
        background: 'var(--color-pink-baby)',
        color: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    cancelBtn: {
        padding: '0.8rem 1.5rem',
        borderRadius: '24px',
        border: '1px solid var(--color-pink-light-1)',
        background: 'var(--color-pink-baby)',
        color: 'var(--color-primary)',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
    },
    saveBtn: {
        padding: '0.8rem 1.5rem',
        borderRadius: '24px',
        border: 'none',
        background: 'var(--color-magenta)',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
    },
    deleteBtn: {
        padding: '0.8rem 1.5rem',
        borderRadius: '24px',
        border: 'none',
        background: '#fff0f0',
        color: '#d9534f',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
    },
    paginationContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '1.5rem',
        padding: '1rem 0',
        borderTop: '1px solid var(--color-pink-light-1)',
    },
    paginationBtn: {
        padding: '0.5rem 1rem',
        borderRadius: '16px',
        border: '1px solid var(--color-magenta)',
        background: 'transparent',
        color: 'var(--color-magenta)',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
        transition: 'all 0.2s ease',
    },
    paginationBtnDisabled: {
        padding: '0.5rem 1rem',
        borderRadius: '16px',
        border: '1px solid var(--color-pink-light-1)',
        background: 'var(--color-pink-baby)',
        color: 'var(--color-text)',
        cursor: 'not-allowed',
        fontFamily: 'var(--sans)',
        opacity: 0.6,
    },
    paginationText: {
        fontSize: '0.9rem',
        color: 'var(--color-text)',
        fontFamily: 'var(--sans)',
        fontWeight: 500,
    }
};