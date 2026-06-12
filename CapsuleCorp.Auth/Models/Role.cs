using System.ComponentModel.DataAnnotations;

namespace CapsuleCorp.Auth.Models
{
    public class Role
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
    }
}