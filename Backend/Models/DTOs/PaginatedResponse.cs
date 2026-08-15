namespace Backend.Models.DTOs;

public class PaginatedResponse<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int TotalItems { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
}
