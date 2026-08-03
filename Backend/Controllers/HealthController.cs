using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        [Route("/health")]
        public IActionResult CheckHealth()
        {
            return Ok("Healthy");
        }
    }
}