using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPsychologistRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PsychologistId",
                table: "TherapySessions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "PsychologistId",
                table: "Patients",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_TherapySessions_PsychologistId",
                table: "TherapySessions",
                column: "PsychologistId");

            migrationBuilder.CreateIndex(
                name: "IX_Patients_PsychologistId",
                table: "Patients",
                column: "PsychologistId");

            migrationBuilder.AddForeignKey(
                name: "FK_Patients_Psychologists_PsychologistId",
                table: "Patients",
                column: "PsychologistId",
                principalTable: "Psychologists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TherapySessions_Psychologists_PsychologistId",
                table: "TherapySessions",
                column: "PsychologistId",
                principalTable: "Psychologists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Patients_Psychologists_PsychologistId",
                table: "Patients");

            migrationBuilder.DropForeignKey(
                name: "FK_TherapySessions_Psychologists_PsychologistId",
                table: "TherapySessions");

            migrationBuilder.DropIndex(
                name: "IX_TherapySessions_PsychologistId",
                table: "TherapySessions");

            migrationBuilder.DropIndex(
                name: "IX_Patients_PsychologistId",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "PsychologistId",
                table: "TherapySessions");

            migrationBuilder.DropColumn(
                name: "PsychologistId",
                table: "Patients");
        }
    }
}
