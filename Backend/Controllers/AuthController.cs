using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            _httpClient = new HttpClient();
        }

        [HttpPost("google-login")]
        public async Task<ActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto request)
        {
            var clientId = _configuration["VITE_GOOGLE_CLIENT_ID"];
            var clientSecret = _configuration["GOOGLE_CLIENT_SECRET"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
                return StatusCode(500, "Configuração do Google OAuth ausente no servidor.");

            var tokenResponse = await ExchangeCodeForTokensAsync(request.Credential, clientId, clientSecret);

            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
                return BadRequest("Falha ao trocar o código de autorização do Google.");

            var userInfo = await GetGoogleUserInfoAsync(tokenResponse.AccessToken);

            if (userInfo == null || string.IsNullOrEmpty(userInfo.Id))
                return BadRequest("Falha ao obter dados do perfil do Google.");

            var psychologist = await _context.Psychologists.FirstOrDefaultAsync(p => p.GoogleAccountId == userInfo.Id);

            if (psychologist == null)
            {
                psychologist = new Psychologist(userInfo.Name ?? "Usuário sem nome", userInfo.Email ?? "", userInfo.Id, userInfo.Picture);

                _context.Psychologists.Add(psychologist);
            }

            psychologist.UpdateGoogleTokens(tokenResponse.AccessToken, tokenResponse.RefreshToken, DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn));

            await _context.SaveChangesAsync();

            var jwt = GenerateJwtToken(psychologist);
            Response.Cookies.Append("jwt", jwt, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new { Message = "Login realizado com sucesso", PsychologistId = psychologist.Id });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult> GetMe()
        {
            var psychologistIdStr = User.FindFirstValue("PsychologistId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            
            if (string.IsNullOrEmpty(psychologistIdStr) || !Guid.TryParse(psychologistIdStr, out var psychologistId))
                return Unauthorized();

            var psychologist = await _context.Psychologists.FindAsync(psychologistId);
            if (psychologist == null) return NotFound();

            return Ok(new { 
                Id = psychologist.Id,
                Name = psychologist.Name,
                Email = psychologist.Email,
                PictureUrl = psychologist.PictureUrl 
            });
        }

        [HttpPost("logout")]
        public ActionResult Logout()
        {
            Response.Cookies.Delete("jwt", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None
            });
            return Ok(new { Message = "Logout realizado com sucesso" });
        }

        private async Task<GoogleUserInfo?> GetGoogleUserInfoAsync(string accessToken)
        {
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            var response = await _httpClient.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");

            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<GoogleUserInfo>(json);
        }

        public async Task<GoogleTokenResponse> ExchangeCodeForTokensAsync(string authCode, string clientId, string clientSecret)
        {
            using var httpClient = new HttpClient();

            var values = new Dictionary<string, string>
            {
                { "code", authCode },
                { "client_id", clientId },
                { "client_secret", clientSecret },
                { "redirect_uri", "postmessage" },
                { "grant_type", "authorization_code" }
            };

            var content = new FormUrlEncodedContent(values);

            // Faz a requisição para o Google
            var response = await httpClient.PostAsync("https://oauth2.googleapis.com/token", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                // Se ainda der erro, o responseContent vai detalhar o motivo exato!
                throw new HttpRequestException($"Erro do Google: {responseContent}");
            }

            // Mapeia o JSON retornado para uma classe C#
            var tokenData = JsonConvert.DeserializeObject<GoogleTokenResponse>(responseContent);
            return tokenData;
        }

        private string GenerateJwtToken(Psychologist psychologist)
        {
            var jwtKey = _configuration["JWT_SECRET"] ?? Environment.GetEnvironmentVariable("JWT_SECRET");
            var issuer = _configuration["JWT_ISSUER"] ?? Environment.GetEnvironmentVariable("JWT_ISSUER");
            var audience = _configuration["JWT_AUDIENCE"] ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey ?? throw new InvalidOperationException("JWT_SECRET is missing")));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, psychologist.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, psychologist.Email),
                new Claim(JwtRegisteredClaimNames.Name, psychologist.Name),
                new Claim("PsychologistId", psychologist.Id.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer ?? "PsiAngelIssuer",
                audience: audience ?? "PsiAngelAudience",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
