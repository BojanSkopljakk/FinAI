using FinAIAPI.Data;
using FinAIAPI.DTOs;
using FinAIAPI.Models;
using FinAIAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FinAIAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SavingGoalsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public SavingGoalsController(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateGoal(CreateSavingGoalDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var goal = new SavingGoal
            {
                UserId = Guid.Parse(userId),
                Title = dto.Title,
                TargetAmount = dto.TargetAmount,
                Deadline = dto.Deadline,
                CreatedAt = DateTime.UtcNow
            };

            await _context.SavingGoals.AddAsync(goal);
            await _context.SaveChangesAsync();
            return Ok(goal);
        }

        [HttpGet]
        public async Task<IActionResult> GetGoals()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var goals = await _context.SavingGoals
                .Where(g => g.UserId == userId)
                .ToListAsync();

            foreach (var goal in goals)
            {
                var percentSaved = goal.CurrentAmount / goal.TargetAmount * 100;

                if (percentSaved >= 100)
                {
                    await _notificationService.CreateNotificationAsync(userId,
                        $"🎉 You've reached your saving goal: {goal.Title}!",
                        $"savings-{goal.Id}-100");
                }
                else if (percentSaved >= 75)
                {
                    await _notificationService.CreateNotificationAsync(userId,
                        $"💰 You're {percentSaved:F0}% of the way to your goal: {goal.Title}.",
                        $"savings-{goal.Id}-75");
                }
            }

            return Ok(goals);
        }


        [HttpPut("{id}/contribute")]
        public async Task<IActionResult> ContributeToGoal(int id, [FromBody] decimal amount)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var goal = await _context.SavingGoals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);

            if (goal == null) return NotFound();

            goal.CurrentAmount += amount;
            await _context.SaveChangesAsync();

            return Ok(goal);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGoal(int id)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var goal = await _context.SavingGoals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);

            if (goal == null) return NotFound();

            _context.SavingGoals.Remove(goal);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

