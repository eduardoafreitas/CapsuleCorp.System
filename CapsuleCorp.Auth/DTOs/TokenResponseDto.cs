using System;

namespace CapsuleCorp.Auth.DTOs
{
    public class TokenResponseDto
    {
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? AccessExpiresAt { get; set; }
        public DateTime? RefreshExpiresAt { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }
}