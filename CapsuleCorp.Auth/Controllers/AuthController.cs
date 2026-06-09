using CapsuleCorp.Auth.DTOs;
using CapsuleCorp.Auth.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CapsuleCorp.Auth.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        private static UserResponseDto MapToDto(CapsuleCorp.Auth.Models.User user) =>
            new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                CreateDate = user.CreateDate,
                LastUpdateDate = user.LastUpdateDate
            };

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserDto registerDto)
        {
            try
            {
                var user = await _authService.RegisterAsync(registerDto);
                var dto = MapToDto(user);
                return Created(string.Empty, new { message = "Usuário cadastrado com sucesso!", user = dto });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var token = await _authService.LoginAsync(loginDto);

            if (token == null)
            {
                return Unauthorized(new { message = "E-mail ou senha inválidos." });
            }

            return Ok(new { token = token });
        }

        [Authorize]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { message = "Identificador do usuário não encontrado no token." });

                var userId = Guid.Parse(userIdClaim);
                var updatedUser = await _authService.UpdateUserAsync(userId, dto);

                var dtoResp = MapToDto(updatedUser);

                var fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
                var dataLocal = TimeZoneInfo.ConvertTimeFromUtc(updatedUser.LastUpdateDate ?? DateTime.UtcNow, fusoBrasilia);

                return Ok(new
                {
                    message = "Perfil atualizado com sucesso!",
                    user = dtoResp,
                    updatedAtLocal = dataLocal.ToString("yyyy-MM-dd HH:mm:ss.fffffff")
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Identificador do usuário não encontrado no token." });

            var userId = Guid.Parse(userIdClaim);
            var user = await _authService.GetByIdAsync(userId);

            if (user == null) return NotFound(new { message = "Usuário não encontrado." });

            return Ok(MapToDto(user));
        }

        [HttpGet]
        [Authorize]
        public IActionResult GetDadosProtegidos()
        {
            return Ok("Você só vê isso porque o Program.cs validou seu Token!");
        }
    }
}
