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
    await db.Patients.ToListAsync())
    .WithName("GetPatients");

app.MapGet("/api/patients/{id:guid}", async (Guid id, AppDbContext db) =>
    await db.Patients.FindAsync(id) is Patient patient
        ? Results.Ok(patient)
        : Results.NotFound())
    .WithName("GetPatientById");

app.MapPost("/api/patients", async (Patient patient, AppDbContext db) =>
{
    patient.Id = Guid.NewGuid();

    patient.TreatmentStartDate = patient.TreatmentStartDate.ToUniversalTime();
    patient.DateOfBirth = patient.DateOfBirth.ToUniversalTime();
    db.Patients.Add(patient);
    await db.SaveChangesAsync();
    return Results.Created($"/api/patients/{patient.Id}", patient);
})
    .WithName("CreatePatient");

app.MapPut("/api/patients/{id:guid}", async (Guid id, Patient inputPatient, AppDbContext db) =>
{
    var patient = await db.Patients.FindAsync(id);
    if (patient is null) return Results.NotFound();

    patient.FullName = inputPatient.FullName;
    patient.Email = inputPatient.Email;
    patient.Phone = inputPatient.Phone;
    patient.DateOfBirth = inputPatient.DateOfBirth;
    patient.Cpf = inputPatient.Cpf;
    patient.TreatmentStartDate = inputPatient.TreatmentStartDate;
    patient.Gender = inputPatient.Gender;
    patient.Profession = inputPatient.Profession;
    patient.CountryOfResidence = inputPatient.CountryOfResidence;
    patient.Frequency = inputPatient.Frequency;
    patient.PrimaryEmergencyContact = inputPatient.PrimaryEmergencyContact;
    patient.SecondaryEmergencyContact = inputPatient.SecondaryEmergencyContact;

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


