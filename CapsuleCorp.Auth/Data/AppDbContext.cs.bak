using CapsuleCorp.Auth.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace CapsuleCorp.Auth.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Aqui você avisa ao Entity Framework que quer criar uma tabela de Usuarios
        public DbSet<User> Users { get; set; }
    }
}