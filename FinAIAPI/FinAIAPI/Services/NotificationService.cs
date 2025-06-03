using FinAIAPI.Data;
using FinAIAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace FinAIAPI.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;

        public NotificationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task CreateNotificationAsync(Guid userId, string message, string uniqueKey)
        {
            var exists = await _context.Notifications
                .AnyAsync(n => n.UserId == userId && n.UniqueKey == uniqueKey);

            if (exists) return;

            var notification = new Notification
            {
                UserId = userId,
                Message = message,
                UniqueKey = uniqueKey
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }



    }
}
