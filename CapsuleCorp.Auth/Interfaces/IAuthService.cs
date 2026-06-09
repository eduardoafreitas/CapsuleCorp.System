using CapsuleCorp.Auth.DTOs;
using CapsuleCorp.Auth.Models;

namespace CapsuleCorp.Auth.Interfaces
{
    public interface IAuthService
    {
        Task<User> RegisterAsync(RegisterUserDto registrationDto);

        Task<string?> LoginAsync(LoginDto loginDto);

        Task<User> UpdateUserAsync(Guid userId, UpdateUserDto dto);

        Task<User?> GetByIdAsync(Guid userId);
    }
}
