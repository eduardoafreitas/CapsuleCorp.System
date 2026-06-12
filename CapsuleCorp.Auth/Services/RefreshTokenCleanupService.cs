using CapsuleCorp.Auth.API.Data;

namespace CapsuleCorp.Auth.Services
{
    public class RefreshTokenCleanupService
    {
        private readonly AppDbContext _context;
        public RefreshTokenCleanupService(AppDbContext context) => _context = context;

        public async Task PurgeExpiredAsync()
        {
            var cutoff = DateTime.UtcNow.AddDays(-30);
            var toRemove = _context.RefreshTokens
                .Where(r => r.Expires < DateTime.UtcNow || (r.Revoked != null && r.Revoked < cutoff));
            _context.RefreshTokens.RemoveRange(toRemove);
            await _context.SaveChangesAsync();
        }
    }
}