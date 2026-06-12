using CapsuleCorp.Auth.Models;
using Microsoft.EntityFrameworkCore;

namespace CapsuleCorp.Auth.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configura PK composta para UserRole
            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany()
                .HasForeignKey(ur => ur.RoleId);

            // Opcional: seed inicial de roles
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Name = "Admin" },
                new Role { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Name = "Viewer" },
                new Role { Id = Guid.Parse("00000000-0000-0000-0000-000000000003"), Name = "Editor" }
            );
        }
    }
}