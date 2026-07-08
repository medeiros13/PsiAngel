using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class EmergencyContact
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public string? SocialName { get; set; }
        public required string PhoneNumber { get; set; }
        public string? Email { get; set; }
        public ContactType Type { get; set; }
        public Guid PatientId { get; set; }

        [JsonIgnore]
        public Patient? Patient { get; set; }
    }
}
