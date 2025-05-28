using System.ComponentModel.DataAnnotations;

namespace FinAIAPI.Models
{
    public class User
    {
        public Guid Id { get; set; }
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }
    }

}
