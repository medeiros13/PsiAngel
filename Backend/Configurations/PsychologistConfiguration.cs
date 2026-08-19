using Backend.Helpers;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Configurations
{
    public class PsychologistConfiguration : IEntityTypeConfiguration<Psychologist>
    {
        private readonly string _encryptionKey;

        public PsychologistConfiguration(string encryptionKey)
        {
            _encryptionKey = encryptionKey;
        }

        public void Configure(EntityTypeBuilder<Psychologist> builder)
        {
            builder.ToTable("Psychologists");
            builder.HasKey(p => p.Id);

            builder.Property(p => p.Name).IsRequired().HasMaxLength(150);
            builder.Property(p => p.Email).IsRequired().HasMaxLength(255);
            builder.Property(p => p.GoogleAccountId).IsRequired().HasMaxLength(255);

            builder.HasIndex(p => p.Email).IsUnique();
            builder.HasIndex(p => p.GoogleAccountId).IsUnique();

            var converter = new AesGcmValueConverter<string>(_encryptionKey);

            builder.Property(p => p.GoogleAccessToken).HasConversion(converter).HasMaxLength(2048);
            builder.Property(p => p.GoogleRefreshToken).HasConversion(converter).HasMaxLength(2048);
        }
    }
}