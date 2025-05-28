using FinAIAPI.Models;

namespace FinAIAPI.Services
{
    public interface IAuthService
    {
        Task<User> RegisterAsync(string email, string password);
        Task<string> LoginAsync(string email, string password);
    }
}
