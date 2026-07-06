namespace Backend.Models;

public class TherapySession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Relacionamento com o Paciente
    public Guid PatientId { get; set; }
    public Patient? Patient { get; set; }

    // Dados da Agenda (Integração Google Calendar depois)
    public DateTime SessionStart { get; set; }
    public DateTime ExpectedSessionEnd { get; set; }
    public string EventColor { get; set; } = "blue";
    public bool Confirmed { get; set; } = false;

    // Prontuário e Evolução (Sessão em Andamento)
    public string? Notes { get; set; }
    public string? MedicalRecordHistory { get; set; }

    // Caminho onde o áudio ficará salvo (no disco local ou em um storage)
    public string? AudioRecordingPath { get; set; }
}