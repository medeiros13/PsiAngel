using System.Text.Json.Serialization;

namespace Backend.Models;

public enum Gender
{
    Male = 1,
    Female = 2,
    Others = 3
}

public class Patient
{
    public Guid Id { get; set; }
    public required string FullName { get; set; }
    public string? SocialName { get; set; }
    public string? Email { get; set; }
    public required string PhoneNumber { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string? Cpf { get; set; }
    public DateTime TreatmentStartDate { get; set; }
    public Gender Gender { get; set; }
    public string? Profession { get; set; }
    public string? CountryOfResidence { get; set; }
    public PatientFrequency Frequency { get; set; }
    public ICollection<EmergencyContact> EmergencyContacts { get; set; } = [];
    public Guid PsychologistId { get; set; }
    [JsonIgnore]
    public Psychologist? Psychologist { get; set; }
}