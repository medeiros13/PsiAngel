using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Models;
using Backend.Models.DTOs;

namespace Backend.Controllers;

[ApiController]
[Route("api/therapy-sessions")]
public class TherapySessionController : ControllerBase
{
    private readonly AppDbContext _db;

    public TherapySessionController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TherapySession>>> GetTherapySessions()
    {
        return await _db.TherapySessions.Include(s => s.Patient).ToListAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TherapySession>> GetTherapySessionById(Guid id)
    {
        var session = await _db.TherapySessions.Include(s => s.Patient).FirstOrDefaultAsync(s => s.Id == id);
        if (session is null) return NotFound();
        return Ok(session);
    }

    [HttpPost]
    public async Task<ActionResult<TherapySession>> CreateTherapySession(TherapySessionRequestDto request)
    {
        if (!await _db.Patients.AnyAsync(p => p.Id == request.PatientId))
        {
            return BadRequest("Patient not found.");
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

        _db.TherapySessions.Add(session);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTherapySessionById), new { id = session.Id }, session);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTherapySession(Guid id, TherapySessionRequestDto request)
    {
        var session = await _db.TherapySessions.FindAsync(id);
        if (session is null) return NotFound();

        if (!await _db.Patients.AnyAsync(p => p.Id == request.PatientId))
        {
            return BadRequest("Patient not found.");
        }

        session.PatientId = request.PatientId;
        session.SessionStart = request.SessionStart;
        session.ExpectedSessionEnd = request.ExpectedSessionEnd;
        session.EventColor = request.EventColor;
        session.Confirmed = request.Confirmed;
        session.Notes = request.Notes;
        session.MedicalRecordHistory = request.MedicalRecordHistory;
        session.AudioRecordingPath = request.AudioRecordingPath;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTherapySession(Guid id)
    {
        var session = await _db.TherapySessions.FindAsync(id);
        if (session is null) return NotFound();

        _db.TherapySessions.Remove(session);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
