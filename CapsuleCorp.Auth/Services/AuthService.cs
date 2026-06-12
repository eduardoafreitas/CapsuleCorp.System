using CapsuleCorp.Auth.API.Data;
using CapsuleCorp.Auth.DTOs;
using CapsuleCorp.Auth.Interfaces;
using CapsuleCorp.Auth.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace CapsuleCorp.Auth.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService>? _logger;

        private readonly int _accessTokenExpirationMinutes;
        private readonly int _refreshTokenDays;

        private static readonly Guid RoleAdminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        private static readonly Guid RoleViewerId = Guid.Parse("00000000-0000-0000-0000-000000000002");
        private static readonly Guid RoleEditorId = Guid.Parse("00000000-0000-0000-0000-000000000003");

        public AuthService(AppDbContext context, IConfiguration configuration, ILogger<AuthService>? logger = null)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            _logger = logger;

            _accessTokenExpirationMinutes = _configuration.GetValue<int?>("Jwt:AccessTokenExpirationMinutes") ?? 30;
            _refreshTokenDays = _configuration.GetValue<int?>("Jwt:RefreshTokenDays") ?? 15;
        }

        public async Task<User> RegisterAsync(RegisterUserDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                throw new InvalidOperationException("Este e-mail já está em uso.");

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                CreateDate = DateTime.UtcNow,
                UserRoles = new List<UserRole>
                {
                    new UserRole { RoleId = RoleViewerId }
                }
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<string?> LoginAsync(LoginDto loginDto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash)) return null;

            var accessToken = CreateToken(user);
            var refresh = GenerateRefreshToken();

            var refreshEntity = new RefreshToken
            {
                Token = refresh.Token,
                Expires = refresh.Expires,
                Created = refresh.Created,
                UserId = user.Id
            };

            _context.RefreshTokens.Add(refreshEntity);
            await _context.SaveChangesAsync();

            _logger?.LogInformation("Refresh token criado para UserId={UserId}", user.Id);

            return accessToken;
        }

        public async Task<TokenResponseDto?> LoginWithTokensAsync(LoginDto loginDto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash)) return null;

            var accessToken = CreateToken(user);
            var refresh = GenerateRefreshToken();

            var refreshEntity = new RefreshToken
            {
                Token = refresh.Token,
                Expires = refresh.Expires,
                Created = refresh.Created,
                UserId = user.Id
            };

            _context.RefreshTokens.Add(refreshEntity);
            await _context.SaveChangesAsync();

            return new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refresh.Token,
                // 💡 CORRIGIDO: Alterado para AddMinutes de forma síncrona com a configuração
                AccessExpiresAt = DateTime.UtcNow.AddMinutes(_accessTokenExpirationMinutes),
                RefreshExpiresAt = refresh.Expires
            };
        }

        public async Task<User> UpdateUserAsync(Guid userId, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new KeyNotFoundException("Usuário não encontrado.");

            if (user.Email != dto.Email && await _context.Users.AnyAsync(u => u.Email == dto.Email))
                throw new InvalidOperationException("Este e-mail já está em uso por outra conta.");

            user.Name = dto.Name;
            user.Email = dto.Email;
            user.LastUpdateDate = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(dto.CurrentPassword) && !string.IsNullOrEmpty(dto.NewPassword))
            {
                if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                    throw new ArgumentException("A senha atual informada está incorreta.");

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<User?> GetByIdAsync(Guid userId)
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);
        }

        public async Task<TokenResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            var existing = await _context.RefreshTokens
                .Include(r => r.User)
                    .ThenInclude(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            if (existing == null || !existing.IsActive || existing.User == null)
                return null;

            existing.Revoked = DateTime.UtcNow;
            _context.RefreshTokens.Update(existing);

            var newRefresh = GenerateRefreshToken();
            var newEntity = new RefreshToken
            {
                Token = newRefresh.Token,
                Expires = newRefresh.Expires,
                Created = newRefresh.Created,
                UserId = existing.UserId
            };

            _context.RefreshTokens.Add(newEntity);
            await _context.SaveChangesAsync();

            var accessToken = CreateToken(existing.User);

            return new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = newRefresh.Token,
                // 💡 CORRIGIDO: Alterado para AddMinutes
                AccessExpiresAt = DateTime.UtcNow.AddMinutes(_accessTokenExpirationMinutes),
                RefreshExpiresAt = newRefresh.Expires
            };
        }

        public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
        {
            var existing = await _context.RefreshTokens.FirstOrDefaultAsync(r => r.Token == refreshToken);
            if (existing == null || existing.Revoked != null) return false;

            existing.Revoked = DateTime.UtcNow;
            _context.RefreshTokens.Update(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        // --- Helpers ---
        private (string Token, DateTime Expires, DateTime Created) GenerateRefreshToken()
        {
            var randomBytes = RandomNumberGenerator.GetBytes(64);
            var token = Convert.ToBase64String(randomBytes);
            var created = DateTime.UtcNow;
            // 💡 CORRIGIDO: Alterado de AddMinutes para AddDays para bater com a regra de negócio
            var expires = created.AddDays(_refreshTokenDays);
            return (token, expires, created);
        }

        private string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name)
            };

            if (user.UserRoles != null && user.UserRoles.Any())
            {
                foreach (var userRole in user.UserRoles)
                {
                    if (userRole.Role != null && !string.IsNullOrEmpty(userRole.Role.Name))
                    {
                        claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Name));
                    }
                }
            }

            var jwtKey = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("A chave 'Jwt:Key' não foi configurada corretamente.");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                // 💡 CORRIGIDO: Alterado para AddMinutes de forma estrita
                Expires = DateTime.UtcNow.AddMinutes(_accessTokenExpirationMinutes),
                SigningCredentials = creds,
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}