namespace Backend.Models;

public class TherapySession
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Patient? Patient { get; set; }
    public DateTime SessionStart { get; set; }
    public DateTime ExpectedSessionEnd { get; set; }
    public string EventColor { get; set; } = "blue";
    public bool Confirmed { get; set; }
    public string? Notes { get; set; }
    public string? MedicalRecordHistory { get; set; }
    public string? AudioRecordingPath { get; set; }
}