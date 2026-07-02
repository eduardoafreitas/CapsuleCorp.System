using System.ComponentModel.DataAnnotations;

namespace CapsuleCorp.Auth.DTOs
{
    public class UpdateUserRolesDto
    {
        [Required]
        [MinLength(1)]
        public IList<string> Roles { get; set; } = new List<string>();
    }
}
