namespace FinAIAPI.Services
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(Guid userId, string message, string uniqueKey);
    }
}
