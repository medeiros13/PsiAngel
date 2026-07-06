using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Aqui dizemos ao EF Core quais tabelas ele deve criar
    public DbSet<Patient> Patients { get; set; }
    public DbSet<TherapySession> TherapySessions { get; set; }
}