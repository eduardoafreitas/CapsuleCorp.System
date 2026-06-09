using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CapsuleCorp.Auth.Models
{
    public class RefreshToken
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string Token { get; set; } = string.Empty;

        public DateTime Expires { get; set; }

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public DateTime? Revoked { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        public bool IsActive => Revoked == null && !IsExpired;

        public bool IsExpired => DateTime.UtcNow >= Expires;
    }
}