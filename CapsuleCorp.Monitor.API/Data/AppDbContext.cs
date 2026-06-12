using Microsoft.EntityFrameworkCore;
using CapsuleCorp.Monitor.API.Models;

namespace CapsuleCorp.Monitor.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<TelemetryLog> TelemetryHistories { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<TelemetryLog>(entity =>
            {
                entity.ToTable("TelemetryHistories");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.EquipmentId, e.Timestamp });
            });
        }
    }
}