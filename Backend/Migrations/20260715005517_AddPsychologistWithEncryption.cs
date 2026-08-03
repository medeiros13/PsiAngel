using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPsychologistWithEncryption : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Psychologists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    GoogleAccountId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PictureUrl = table.Column<string>(type: "text", nullable: true),
                    GoogleAccessToken = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    GoogleRefreshToken = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    TokenExpiration = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Psychologists", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Psychologists_Email",
                table: "Psychologists",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Psychologists_GoogleAccountId",
                table: "Psychologists",
                column: "GoogleAccountId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Psychologists");
        }
    }
}
