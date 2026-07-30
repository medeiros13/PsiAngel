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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

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
        options.WithTitle("API Gestão de Pacientes")
               .WithTheme(ScalarTheme.DeepSpace)
               .WithDefaultHttpClient(ScalarTarget.JavaScript, ScalarClient.Axios);
    });
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();