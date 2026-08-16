using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Models;
using Backend.Models.DTOs;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientController : ControllerBase
{
    private readonly AppDbContext _db;

    public PatientController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetPsychologistId()
    {
        var idStr = User.FindFirstValue("PsychologistId");
        if (Guid.TryParse(idStr, out var id)) return id;
        throw new UnauthorizedAccessException("Psychologist ID not found in token.");
    }

    private string? ValidateGestaoFinanceira(Patient patient)
    {
        if (patient.PaymentType == null) return "O Tipo de Pagamento é obrigatório.";
        
        if (patient.PaymentType == Models.PaymentType.PerSession)
        {
            if (patient.Currency == null) return "A Moeda é obrigatória.";
            if (patient.SessionPrice == null) return "O Valor da sessão é obrigatório.";
            if (patient.PaymentMethod == null) return "O Meio de pagamento é obrigatório.";
        }
        else if (patient.PaymentType == Models.PaymentType.Package)
        {
            if (patient.PackageType == null) return "O Tipo de Pacote é obrigatório.";
            
            if (patient.PackageType == Models.PackageType.Monthly)
            {
                if (patient.BillingStartDateType == null) return "O Início da cobrança é obrigatório.";
                if (patient.BillingStartDateType == Models.BillingStartDateType.CustomDate && patient.CustomBillingDate == null) return "A Data da cobrança é obrigatória.";
                if (patient.Currency == null) return "A Moeda é obrigatória.";
                if (patient.SessionPrice == null) return "O Valor é obrigatório.";
                if (patient.PaymentMethod == null) return "O Meio de pagamento é obrigatório.";
            }
            else if (patient.PackageType == Models.PackageType.PerSessions)
            {
                if (patient.Currency == null) return "A Moeda é obrigatória.";
                if (patient.SessionPrice == null) return "O Valor é obrigatório.";
                if (patient.SessionQuantity == null) return "A Quantidade de sessões é obrigatória.";
                if (patient.PaymentMethod == null) return "O Meio de pagamento é obrigatório.";
            }
        }
        return null;
    }

    private async Task<string?> ValidateCpfAsync(string? cpf, Guid psychologistId, Guid? patientId = null)
    {
        if (string.IsNullOrWhiteSpace(cpf)) return null;
        
        cpf = new string(cpf.Where(char.IsDigit).ToArray());
        
        if (!IsValidCpf(cpf)) return "O CPF informado é inválido.";

        var exists = await _db.Patients.AnyAsync(p => p.PsychologistId == psychologistId && p.Cpf == cpf && (patientId == null || p.Id != patientId));
        if (exists) return "Este CPF já está cadastrado para outro paciente seu.";

        return null;
    }

    private static bool IsValidCpf(string cpf)
    {
        if (cpf.Length != 11) return false;
        
        if (cpf.Distinct().Count() == 1) return false;

        int[] multiplier1 = new int[9] { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
        int[] multiplier2 = new int[10] { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };

        string tempCpf = cpf.Substring(0, 9);
        int sum = 0;

        for (int i = 0; i < 9; i++)
            sum += int.Parse(tempCpf[i].ToString()) * multiplier1[i];

        int remainder = sum % 11;
        if (remainder < 2)
            remainder = 0;
        else
            remainder = 11 - remainder;

        string digit = remainder.ToString();
        tempCpf = tempCpf + digit;
        sum = 0;

        for (int i = 0; i < 10; i++)
            sum += int.Parse(tempCpf[i].ToString()) * multiplier2[i];

        remainder = sum % 11;
        if (remainder < 2)
            remainder = 0;
        else
            remainder = 11 - remainder;

        digit = digit + remainder.ToString();
        return cpf.EndsWith(digit);
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<Patient>>> GetPatients([FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string? search = null, [FromQuery] string sortBy = "date", [FromQuery] bool sortDesc = true)
    {
        var psychologistId = GetPsychologistId();
        
        var query = _db.Patients
            .Include(p => p.EmergencyContacts)
            .Where(p => p.PsychologistId == psychologistId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowerSearch = search.ToLower();
            query = query.Where(p => p.FullName.ToLower().Contains(lowerSearch) || 
                                    (p.SocialName != null && p.SocialName.ToLower().Contains(lowerSearch)));
        }

        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)limit);

        if (sortBy.ToLower() == "name")
        {
            query = sortDesc 
                ? query.OrderByDescending(p => p.FullName).ThenByDescending(p => p.TreatmentStartDate) 
                : query.OrderBy(p => p.FullName).ThenByDescending(p => p.TreatmentStartDate);
        }
        else
        {
            // default is date
            query = sortDesc 
                ? query.OrderByDescending(p => p.TreatmentStartDate).ThenBy(p => p.FullName) 
                : query.OrderBy(p => p.TreatmentStartDate).ThenBy(p => p.FullName);
        }

        var patients = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(new PaginatedResponse<Patient>
        {
            Items = patients,
            TotalItems = totalItems,
            CurrentPage = page,
            TotalPages = totalPages
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Patient>> GetPatientById(Guid id)
    {
        var psychologistId = GetPsychologistId();
        var patient = await _db.Patients
            .Include(p => p.EmergencyContacts)
            .FirstOrDefaultAsync(p => p.Id == id && p.PsychologistId == psychologistId);
            
        if (patient is null) return NotFound();
        return Ok(patient);
    }

    [HttpPost]
    public async Task<ActionResult<Patient>> CreatePatient(Patient patient)
    {
        var validationError = ValidateGestaoFinanceira(patient);
        if (validationError != null) return BadRequest(new { message = validationError });

        var psychologistId = GetPsychologistId();
        var cpfError = await ValidateCpfAsync(patient.Cpf, psychologistId);
        if (cpfError != null) return BadRequest(new { message = cpfError });

        if (!string.IsNullOrWhiteSpace(patient.Cpf)) 
            patient.Cpf = new string(patient.Cpf.Where(char.IsDigit).ToArray());

        patient.Id = Guid.NewGuid();
        patient.PsychologistId = psychologistId;

        patient.TreatmentStartDate = patient.TreatmentStartDate.ToUniversalTime();
        patient.DateOfBirth = patient.DateOfBirth.ToUniversalTime();
        
        if (patient.CustomBillingDate.HasValue)
        {
            patient.CustomBillingDate = patient.CustomBillingDate.Value.ToUniversalTime();
        }

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
        var validationError = ValidateGestaoFinanceira(inputPatient);
        if (validationError != null) return BadRequest(new { message = validationError });

        var psychologistId = GetPsychologistId();
        var cpfError = await ValidateCpfAsync(inputPatient.Cpf, psychologistId, id);
        if (cpfError != null) return BadRequest(new { message = cpfError });

        if (!string.IsNullOrWhiteSpace(inputPatient.Cpf)) 
            inputPatient.Cpf = new string(inputPatient.Cpf.Where(char.IsDigit).ToArray());

        var patient = await _db.Patients
            .Include(p => p.EmergencyContacts)
            .FirstOrDefaultAsync(p => p.Id == id && p.PsychologistId == psychologistId);
            
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

        // Gestão Financeira
        patient.PaymentType = inputPatient.PaymentType;
        patient.Currency = inputPatient.Currency;
        patient.SessionPrice = inputPatient.SessionPrice;
        patient.PaymentMethod = inputPatient.PaymentMethod;
        patient.PackageType = inputPatient.PackageType;
        patient.BillingStartDateType = inputPatient.BillingStartDateType;
        if (inputPatient.CustomBillingDate.HasValue)
        {
            patient.CustomBillingDate = inputPatient.CustomBillingDate.Value.ToUniversalTime();
        }
        else
        {
            patient.CustomBillingDate = null;
        }
        patient.SessionQuantity = inputPatient.SessionQuantity;

        // Update emergency contacts robustly
        var existingContacts = patient.EmergencyContacts.ToList();
        var incomingContacts = inputPatient.EmergencyContacts ?? new List<EmergencyContact>();

        // 1. Remove contacts not in the incoming list
        foreach (var existing in existingContacts)
        {
            if (!incomingContacts.Any(c => c.Id == existing.Id))
            {
                _db.Remove(existing);
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
        var psychologistId = GetPsychologistId();
        var patient = await _db.Patients.FirstOrDefaultAsync(p => p.Id == id && p.PsychologistId == psychologistId);
        
        if (patient is null) return NotFound();

        _db.Patients.Remove(patient);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
