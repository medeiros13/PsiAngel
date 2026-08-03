using Backend.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

public class AppDbContext : DbContext
{
    private readonly IConfiguration _configuration;
    public AppDbContext(DbContextOptions<AppDbContext> options, IConfiguration configuration) : base(options)
    {
        _configuration = configuration;
    }
    public DbSet<Patient> Patients { get; set; }
    public DbSet<TherapySession> TherapySessions { get; set; }
    public DbSet<Psychologist> Psychologists { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var encryptionKey = _configuration["ENCRYPTION_TOKENS_KEY"]
            ?? throw new InvalidOperationException("Chave de criptografia 'ENCRYPTION_TOKENS_KEY' não encontrada.");

        modelBuilder.ApplyConfiguration(new PsychologistConfiguration(encryptionKey));

        modelBuilder.Entity<EmergencyContact>()
            .HasOne(c => c.Patient)
            .WithMany(p => p.EmergencyContacts)
            .HasForeignKey(c => c.PatientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Patient>()
            .HasOne(p => p.Psychologist)
            .WithMany()
            .HasForeignKey(p => p.PsychologistId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TherapySession>()
            .HasOne(ts => ts.Patient)
            .WithMany()
            .HasForeignKey(ts => ts.PatientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TherapySession>()
            .HasOne(ts => ts.Psychologist)
            .WithMany()
            .HasForeignKey(ts => ts.PsychologistId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}