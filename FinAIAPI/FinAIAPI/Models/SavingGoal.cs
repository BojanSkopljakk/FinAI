using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace FinAIAPI.Models
{
    public class SavingGoal
    {
        public int Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TargetAmount { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CurrentAmount { get; set; } = 0;

        public DateTime? Deadline { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
