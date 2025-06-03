using FinAIAPI.Data;
using FinAIAPI.DTOs;
using FinAIAPI.Models;
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

        public SavingGoalsController(ApplicationDbContext context)
        {
            _context = context;
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

