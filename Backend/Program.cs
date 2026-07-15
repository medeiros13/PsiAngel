using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using System.Text.Json.Serialization;
using DotNetEnv;

var builder = WebApplication.CreateBuilder(args);

var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env.local");
if (File.Exists(envPath))
{
    Env.Load(envPath);
    builder.Configuration.AddEnvironmentVariables();
}

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString) || connectionString == "Host=localhost;")
{
    var dbName = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "psiangel";
    var dbUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "postgres";
    var dbPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "postgres";

    connectionString = $"Host=localhost;Database={dbName};Username={dbUser};Password={dbPass}";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "API PsiAngel - Gestão para Psicólogos";
    });
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();