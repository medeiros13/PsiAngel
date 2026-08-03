using System.Text.Json.Serialization;

namespace Backend.Models;

public class TherapySession
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    [JsonIgnore]
    public Patient? Patient { get; set; }
    public DateTime SessionStart { get; set; }
    public DateTime ExpectedSessionEnd { get; set; }
    public string EventColor { get; set; } = "blue";
    public bool Confirmed { get; set; }
    public string? Notes { get; set; }
    public string? MedicalRecordHistory { get; set; }
    public string? AudioRecordingPath { get; set; }
    public Guid PsychologistId { get; set; }
    [JsonIgnore]
    public Psychologist? Psychologist { get; set; }
}