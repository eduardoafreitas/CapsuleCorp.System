namespace CapsuleCorp.Auth.DTOs
{
    public class UserResponseDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public DateTime CreateDate { get; set; }

        public DateTime? LastUpdateDate { get; set; }
    }
}
