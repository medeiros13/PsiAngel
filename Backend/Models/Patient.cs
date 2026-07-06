namespace Backend.Models;

public class Patient
{
	public Guid Id { get; set; } = Guid.NewGuid();

	// Dados Pessoais
	public string FullName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string Phone { get; set; } = string.Empty;
	public DateTime DateOfBirth { get; set; }
	public string? Cpf { get; set; } // Opcional

	// Informações Gerais
	public DateTime TreatmentStartDate { get; set; } = DateTime.UtcNow;
	public string Gender { get; set; } = string.Empty;
	public string Profession { get; set; } = string.Empty;
	public string CountryOfResidence { get; set; } = string.Empty;

	// Recorrência (Usamos uma string simples por enquanto, mas pode virar um Enum: "Semanal", "Quinzenal", "Mensal")
	public string Frequency { get; set; } = string.Empty;

	// Contatos de Emergência (Vamos salvar em formato JSON simples para facilitar, ou poderíamos criar outra tabela)
	public string? PrimaryEmergencyContact { get; set; }
	public string? SecondaryEmergencyContact { get; set; }
}