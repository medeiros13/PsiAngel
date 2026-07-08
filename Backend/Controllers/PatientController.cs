using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/patients")]
public class PatientController : ControllerBase
{
    private readonly AppDbContext _db;

    public PatientController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Patient>>> GetPatients()
    {
        return await _db.Patients.Include(p => p.EmergencyContacts).ToListAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Patient>> GetPatientById(Guid id)
    {
        var patient = await _db.Patients.Include(p => p.EmergencyContacts).FirstOrDefaultAsync(p => p.Id == id);
        if (patient is null) return NotFound();
        return Ok(patient);
    }

    [HttpPost]
    public async Task<ActionResult<Patient>> CreatePatient(Patient patient)
    {
        patient.Id = Guid.NewGuid();

        patient.TreatmentStartDate = patient.TreatmentStartDate.ToUniversalTime();
        patient.DateOfBirth = patient.DateOfBirth.ToUniversalTime();

        if (patient.EmergencyContacts != null)
        {
            foreach (var contact in patient.EmergencyContacts)
            {
                contact.Id = Guid.NewGuid();
                contact.PatientId = patient.Id;
            }
        }

        _db.Patients.Add(patient);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPatientById), new { id = patient.Id }, patient);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePatient(Guid id, Patient inputPatient)
    {
        var patient = await _db.Patients.Include(p => p.EmergencyContacts).FirstOrDefaultAsync(p => p.Id == id);
        if (patient is null) return NotFound();

        patient.FullName = inputPatient.FullName;
        patient.SocialName = inputPatient.SocialName;
        patient.Email = inputPatient.Email;
        patient.PhoneNumber = inputPatient.PhoneNumber;
        patient.DateOfBirth = inputPatient.DateOfBirth.ToUniversalTime();
        patient.Cpf = inputPatient.Cpf;
        patient.TreatmentStartDate = inputPatient.TreatmentStartDate.ToUniversalTime();
        patient.Gender = inputPatient.Gender;
        patient.Profession = inputPatient.Profession;
        patient.CountryOfResidence = inputPatient.CountryOfResidence;
        patient.Frequency = inputPatient.Frequency;

        // Update emergency contacts robustly
        var existingContacts = patient.EmergencyContacts.ToList();
        var incomingContacts = inputPatient.EmergencyContacts ?? new List<EmergencyContact>();

        // 1. Remove contacts not in the incoming list
        foreach (var existing in existingContacts)
        {
            if (!incomingContacts.Any(c => c.Id == existing.Id))
            {
                patient.EmergencyContacts.Remove(existing);
            }
        }

        // 2. Add or update incoming contacts
        foreach (var incoming in incomingContacts)
        {
            if (incoming.Id == Guid.Empty)
            {
                // Add new contact
                var newContact = new EmergencyContact
                {
                    Id = Guid.NewGuid(),
                    Name = incoming.Name,
                    SocialName = incoming.SocialName,
                    PhoneNumber = incoming.PhoneNumber,
                    Email = incoming.Email,
                    Type = incoming.Type,
                    PatientId = patient.Id
                };
                patient.EmergencyContacts.Add(newContact);
                _db.Entry(newContact).State = EntityState.Added;
            }
            else
            {
                // Update existing contact
                var existing = patient.EmergencyContacts.FirstOrDefault(c => c.Id == incoming.Id);
                if (existing != null)
                {
                    existing.Name = incoming.Name;
                    existing.SocialName = incoming.SocialName;
                    existing.PhoneNumber = incoming.PhoneNumber;
                    existing.Email = incoming.Email;
                    existing.Type = incoming.Type;
                }
            }
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePatient(Guid id)
    {
        var patient = await _db.Patients.FindAsync(id);
        if (patient is null) return NotFound();

        _db.Patients.Remove(patient);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
