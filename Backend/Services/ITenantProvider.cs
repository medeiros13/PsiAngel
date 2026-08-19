namespace Backend.Services
{
    public interface ITenantProvider
    {
        Guid TenantId { get; }
    }
}
