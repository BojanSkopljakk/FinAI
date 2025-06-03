using System.ComponentModel.DataAnnotations;

namespace FinAIAPI.Models
{
    public class Notification
    {
        public int Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string Message { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;

        public string UniqueKey { get; set; }
    }
}
