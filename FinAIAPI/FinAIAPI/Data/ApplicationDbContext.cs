using FinAIAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace FinAIAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions options) : base(options) { }

        public DbSet<User> Users { get; set; }
    }
}
