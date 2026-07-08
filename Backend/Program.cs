using Scalar.AspNetCore;
using Backend.Models;
using Microsoft.EntityFrameworkCore;


var builder = WebApplication.CreateBuilder(args);

// Adiciona o contexto do banco de dados usando o PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();



// ==========================================
// CRUDEndpoints - Patient
// ==========================================

app.MapGet("/api/patients", async (AppDbContext db) =>
    await db.Patients.Include(p => p.EmergencyContacts).ToListAsync())
    .WithName("GetPatients");

app.MapGet("/api/patients/{id:guid}", async (Guid id, AppDbContext db) =>
    await db.Patients.Include(p => p.EmergencyContacts).FirstOrDefaultAsync(p => p.Id == id) is Patient patient
        ? Results.Ok(patient)
        : Results.NotFound())
    .WithName("GetPatientById");

app.MapPost("/api/patients", async (Patient patient, AppDbContext db) =>
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

    db.Patients.Add(patient);
    await db.SaveChangesAsync();
    return Results.Created($"/api/patients/{patient.Id}", patient);
})
    .WithName("CreatePatient");

app.MapPut("/api/patients/{id:guid}", async (Guid id, Patient inputPatient, AppDbContext db) =>
{
    var patient = await db.Patients.Include(p => p.EmergencyContacts).FirstOrDefaultAsync(p => p.Id == id);
    if (patient is null) return Results.NotFound();

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
            db.Entry(newContact).State = EntityState.Added;
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

    await db.SaveChangesAsync();
    return Results.NoContent();
})
    .WithName("UpdatePatient");

app.MapDelete("/api/patients/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var patient = await db.Patients.FindAsync(id);
    if (patient is null) return Results.NotFound();

    db.Patients.Remove(patient);
    await db.SaveChangesAsync();
    return Results.NoContent();
})
    .WithName("DeletePatient");

// ==========================================
// CRUDEndpoints - TherapySession
// ==========================================

app.MapGet("/api/therapy-sessions", async (AppDbContext db) =>
    await db.TherapySessions.Include(s => s.Patient).ToListAsync())
    .WithName("GetTherapySessions");

app.MapGet("/api/therapy-sessions/{id:guid}", async (Guid id, AppDbContext db) =>
    await db.TherapySessions.Include(s => s.Patient).FirstOrDefaultAsync(s => s.Id == id) is TherapySession session
        ? Results.Ok(session)
        : Results.NotFound())
    .WithName("GetTherapySessionById");

app.MapPost("/api/therapy-sessions", async (TherapySessionRequestDto request, AppDbContext db) =>
{
    if (!await db.Patients.AnyAsync(p => p.Id == request.PatientId))
    {
        return Results.BadRequest("Patient not found.");
    }

    var session = new TherapySession
    {
        Id = Guid.NewGuid(),
        PatientId = request.PatientId,
        SessionStart = request.SessionStart,
        ExpectedSessionEnd = request.ExpectedSessionEnd,
        EventColor = request.EventColor,
        Confirmed = request.Confirmed,
        Notes = request.Notes,
        MedicalRecordHistory = request.MedicalRecordHistory,
        AudioRecordingPath = request.AudioRecordingPath
    };

    db.TherapySessions.Add(session);
    await db.SaveChangesAsync();
    return Results.Created($"/api/therapy-sessions/{session.Id}", session);
})
    .WithName("CreateTherapySession");

app.MapPut("/api/therapy-sessions/{id:guid}", async (Guid id, TherapySessionRequestDto request, AppDbContext db) =>
{
    var session = await db.TherapySessions.FindAsync(id);
    if (session is null) return Results.NotFound();

    if (!await db.Patients.AnyAsync(p => p.Id == request.PatientId))
    {
        return Results.BadRequest("Patient not found.");
    }

    session.PatientId = request.PatientId;
    session.SessionStart = request.SessionStart;
    session.ExpectedSessionEnd = request.ExpectedSessionEnd;
    session.EventColor = request.EventColor;
    session.Confirmed = request.Confirmed;
    session.Notes = request.Notes;
    session.MedicalRecordHistory = request.MedicalRecordHistory;
    session.AudioRecordingPath = request.AudioRecordingPath;

    await db.SaveChangesAsync();
    return Results.NoContent();
})
    .WithName("UpdateTherapySession");

app.MapDelete("/api/therapy-sessions/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var session = await db.TherapySessions.FindAsync(id);
    if (session is null) return Results.NotFound();

    db.TherapySessions.Remove(session);
    await db.SaveChangesAsync();
    return Results.NoContent();
})
    .WithName("DeleteTherapySession");

app.Run();


