namespace Backend.Models
{
    public class Psychologist
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string GoogleAccountId { get; set; }
        public string? PictureUrl { get; set; }
        public string? GoogleAccessToken { get; set; }
        public string? GoogleRefreshToken { get; set; }
        public DateTime? TokenExpiration { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; }
        public Psychologist() { }

        public Psychologist(string name, string email, string googleAccountId, string? pictureUrl)
        {
            Id = Guid.NewGuid();
            Name = name;
            Email = email;
            GoogleAccountId = googleAccountId;
            PictureUrl = pictureUrl;
            CreatedAt = DateTime.UtcNow;
            IsActive = true;
        }

        public void UpdateGoogleTokens(string accessToken, string? refreshToken, DateTime expiration)
        {
            GoogleAccessToken = accessToken;
            if (!string.IsNullOrWhiteSpace(refreshToken))
            {
                GoogleRefreshToken = refreshToken;
            }
            TokenExpiration = expiration;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
