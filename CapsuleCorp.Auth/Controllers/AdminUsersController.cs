using CapsuleCorp.Auth.API.Data;
using CapsuleCorp.Auth.DTOs;
using CapsuleCorp.Auth.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CapsuleCorp.Auth.Controllers
{
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Route("api/admin/users")]
    public class AdminUsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminUsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> ListUsers()
        {
            var users = await _context.Users
                .AsNoTracking()
                .Include(user => user.UserRoles)
                    .ThenInclude(userRole => userRole.Role)
                .OrderBy(user => user.Email)
                .Select(user => new AdminUserDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Roles = user.UserRoles
                        .Where(userRole => userRole.Role != null)
                        .Select(userRole => userRole.Role!.Name)
                        .OrderBy(roleName => roleName)
                        .ToList()
                })
                .ToListAsync();

            return Ok(new { data = users });
        }

        [HttpPut("{userId:guid}/roles")]
        public async Task<IActionResult> UpdateRoles(Guid userId, [FromBody] UpdateUserRolesDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var requestedRoleNames = dto.Roles
                .Where(role => !string.IsNullOrWhiteSpace(role))
                .Select(role => role.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (requestedRoleNames.Count == 0)
            {
                return BadRequest(new { message = "Informe ao menos uma role." });
            }

            var userExists = await _context.Users.AnyAsync(user => user.Id == userId);
            if (!userExists)
            {
                return NotFound(new { message = "Usuario nao encontrado." });
            }

            var roles = await _context.Roles
                .Where(role => requestedRoleNames.Contains(role.Name))
                .ToListAsync();

            var missingRoles = requestedRoleNames
                .Where(roleName => roles.All(role => !role.Name.Equals(roleName, StringComparison.OrdinalIgnoreCase)))
                .ToList();

            if (missingRoles.Count > 0)
            {
                return BadRequest(new { message = "Roles invalidas.", roles = missingRoles });
            }

            var currentRoles = await _context.UserRoles
                .Where(userRole => userRole.UserId == userId)
                .ToListAsync();

            _context.UserRoles.RemoveRange(currentRoles);

            _context.UserRoles.AddRange(roles.Select(role => new UserRole
            {
                UserId = userId,
                RoleId = role.Id
            }));

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Roles atualizadas com sucesso. O usuario deve refazer login para receber um novo token.",
                roles = roles.Select(role => role.Name).OrderBy(roleName => roleName).ToList()
            });
        }
    }
}
