using System.Security.Claims;

namespace Backend.Services
{
    public class TenantProvider : ITenantProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TenantProvider(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid TenantId
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;
                if (user == null)
                    return Guid.Empty;

                var idStr = user.FindFirstValue("PsychologistId") 
                            ?? user.FindFirstValue(ClaimTypes.NameIdentifier) 
                            ?? user.FindFirstValue("sub");

                if (Guid.TryParse(idStr, out var id))
                {
                    return id;
                }

                return Guid.Empty;
            }
        }
    }
}
