using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientFinancialFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BillingStartDateType",
                table: "Patients",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Currency",
                table: "Patients",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CustomBillingDate",
                table: "Patients",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PackageType",
                table: "Patients",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymentMethod",
                table: "Patients",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymentType",
                table: "Patients",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SessionPrice",
                table: "Patients",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionQuantity",
                table: "Patients",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BillingStartDateType",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "CustomBillingDate",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "PackageType",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "PaymentType",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "SessionPrice",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "SessionQuantity",
                table: "Patients");
        }
    }
}
