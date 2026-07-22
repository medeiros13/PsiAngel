using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Text.Json;

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

        [HttpPost("google")]
        public async Task<ActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto request)
        {
            var clientId = _configuration["VITE_GOOGLE_CLIENT_ID"];
            var clientSecret = _configuration["GOOGLE_CLIENT_SECRET"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
                return StatusCode(500, "Configuração do Google OAuth ausente no servidor.");

            var tokenResponse = await ExchangeCodeForTokensAsync(request.Code, clientId, clientSecret);

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

            return Ok(new { Message = "Login realizado com sucesso", PsychologistId = psychologist.Id });
        }

        private async Task<GoogleTokenResponse?> ExchangeCodeForTokensAsync(string code, string clientId, string clientSecret)
        {
            var values = new Dictionary<string, string>
            {
                { "client_id", clientId },
                { "client_secret", clientSecret },
                { "code", code },
                { "grant_type", "authorization_code" },
                { "redirect_uri", "postmessage" }
            };

            var content = new FormUrlEncodedContent(values);
            var response = await _httpClient.PostAsync("https://oauth2.googleapis.com/token", content);

            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<GoogleTokenResponse>(json);

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
    }
}
