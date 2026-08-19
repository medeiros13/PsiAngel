using Backend.Configurations;
using Backend.Helpers;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

public class AppDbContext : DbContext
{
    private readonly IConfiguration _configuration;
    private readonly ITenantProvider? _tenantProvider;

    public AppDbContext(DbContextOptions<AppDbContext> options, IConfiguration configuration, ITenantProvider? tenantProvider = null) : base(options)
    {
        _configuration = configuration;
        _tenantProvider = tenantProvider;
    }

    public DbSet<Patient> Patients { get; set; }
    public DbSet<TherapySession> TherapySessions { get; set; }
    public DbSet<Psychologist> Psychologists { get; set; }

    public Guid CurrentTenantId => _tenantProvider?.TenantId ?? Guid.Empty;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var encryptionKey = _configuration["ENCRYPTION_TOKENS_KEY"]
            ?? throw new InvalidOperationException("Chave de criptografia 'ENCRYPTION_TOKENS_KEY' não encontrada.");

        modelBuilder.ApplyConfiguration(new PsychologistConfiguration(encryptionKey));

        // Global Query Filters (RLS application level)
        modelBuilder.Entity<Patient>().HasQueryFilter(p => CurrentTenantId == Guid.Empty || p.PsychologistId == CurrentTenantId);
        modelBuilder.Entity<TherapySession>().HasQueryFilter(ts => CurrentTenantId == Guid.Empty || ts.PsychologistId == CurrentTenantId);
        modelBuilder.Entity<EmergencyContact>().HasQueryFilter(c => CurrentTenantId == Guid.Empty || c.Patient.PsychologistId == CurrentTenantId);

        // AES-GCM Encryption for Patient
        var stringEncryptor = new AesGcmValueConverter<string>(encryptionKey);
        var dateTimeEncryptor = new AesGcmValueConverter<DateTime>(encryptionKey);
        var nullableDateTimeEncryptor = new AesGcmValueConverter<DateTime?>(encryptionKey);
        var genderEncryptor = new AesGcmValueConverter<Gender>(encryptionKey);
        var frequencyEncryptor = new AesGcmValueConverter<PatientFrequency>(encryptionKey);
        
        var paymentTypeEncryptor = new AesGcmValueConverter<PaymentType?>(encryptionKey);
        var currencyEncryptor = new AesGcmValueConverter<Currency?>(encryptionKey);
        var decimalEncryptor = new AesGcmValueConverter<decimal?>(encryptionKey);
        var paymentMethodEncryptor = new AesGcmValueConverter<PaymentMethod?>(encryptionKey);
        var packageTypeEncryptor = new AesGcmValueConverter<PackageType?>(encryptionKey);
        var billingStartDateTypeEncryptor = new AesGcmValueConverter<BillingStartDateType?>(encryptionKey);
        var intEncryptor = new AesGcmValueConverter<int?>(encryptionKey);

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.Property(p => p.SocialName).HasConversion(stringEncryptor);
            entity.Property(p => p.Email).HasConversion(stringEncryptor);
            entity.Property(p => p.PhoneNumber).HasConversion(stringEncryptor);
            entity.Property(p => p.DateOfBirth).HasConversion(dateTimeEncryptor);
            entity.Property(p => p.Cpf).HasConversion(stringEncryptor);
            entity.Property(p => p.Gender).HasConversion(genderEncryptor);
            entity.Property(p => p.Profession).HasConversion(stringEncryptor);
            entity.Property(p => p.CountryOfResidence).HasConversion(stringEncryptor);
            entity.Property(p => p.Frequency).HasConversion(frequencyEncryptor);

            entity.Property(p => p.PaymentType).HasConversion(paymentTypeEncryptor);
            entity.Property(p => p.Currency).HasConversion(currencyEncryptor);
            entity.Property(p => p.SessionPrice).HasConversion(decimalEncryptor);
            entity.Property(p => p.PaymentMethod).HasConversion(paymentMethodEncryptor);
            entity.Property(p => p.PackageType).HasConversion(packageTypeEncryptor);
            entity.Property(p => p.BillingStartDateType).HasConversion(billingStartDateTypeEncryptor);
            entity.Property(p => p.CustomBillingDate).HasConversion(nullableDateTimeEncryptor);
            entity.Property(p => p.SessionQuantity).HasConversion(intEncryptor);
        });

        // AES-GCM Encryption for TherapySession
        modelBuilder.Entity<TherapySession>(entity =>
        {
            entity.Property(t => t.Notes).HasConversion(stringEncryptor);
            entity.Property(t => t.MedicalRecordHistory).HasConversion(stringEncryptor);
        });

        // AES-GCM Encryption for EmergencyContact
        var contactTypeEncryptor = new AesGcmValueConverter<ContactType>(encryptionKey);
        modelBuilder.Entity<EmergencyContact>(entity =>
        {
            entity.Property(e => e.Name).HasConversion(stringEncryptor);
            entity.Property(e => e.PhoneNumber).HasConversion(stringEncryptor);
            entity.Property(e => e.Type).HasConversion(contactTypeEncryptor);
        });

        modelBuilder.Entity<EmergencyContact>()
            .HasOne(c => c.Patient)
            .WithMany(p => p.EmergencyContacts)
            .HasForeignKey(c => c.PatientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Patient>()
            .HasOne(p => p.Psychologist)
            .WithMany(psy => psy.Patients)
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