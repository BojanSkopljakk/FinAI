using FinAIAPI.Data;
using FinAIAPI.DTOs;
using FinAIAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FinAIAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BudgetsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BudgetsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> SetBudget(CreateBudgetDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            var userId = Guid.Parse(userIdClaim);

            // Check for existing budget for this category + month
            var existing = await _context.Budgets
                .FirstOrDefaultAsync(b => b.UserId == userId && b.Category == dto.Category && b.Month == dto.Month);

            if (existing != null)
            {
                return BadRequest($"Budget already exists for category '{dto.Category}' and month '{dto.Month}'.");
            }

            if (existing != null)
            {
                existing.Amount = dto.Amount;
            }
            else
            {
                var budget = new Budget
                {
                    UserId = userId,
                    Category = dto.Category,
                    Amount = dto.Amount,
                    Month = dto.Month
                };
                await _context.Budgets.AddAsync(budget);
            }

            await _context.SaveChangesAsync();
            return Ok();
        }
        [HttpGet("{month}")]
        public async Task<IActionResult> GetBudgets(string month)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null) return Unauthorized();
                var userId = Guid.Parse(userIdClaim);

                // Parse the month string (format: "yyyy-MM")
                var dateParts = month.Split('-');
                var year = int.Parse(dateParts[0]);
                var monthNum = int.Parse(dateParts[1]);

                var budgets = await _context.Budgets
                    .Where(b => b.UserId == userId && b.Month == month)
                    .ToListAsync();

                // Fetch actual spending from transactions
                var spentPerCategory = await _context.Transactions
                    .Where(t => t.UserId == userId
                        && t.Type == "expense"
                        && t.Date.Year == year
                        && t.Date.Month == monthNum)
                    .GroupBy(t => t.Category)
                    .Select(g => new { Category = g.Key, Spent = g.Sum(t => t.Amount) })
                    .ToListAsync();

                foreach (var budget in budgets)
                {
                    budget.Spent = spentPerCategory.FirstOrDefault(s => s.Category == budget.Category)?.Spent ?? 0;
                }

                return Ok(budgets);
            }
            catch (Exception ex)
            {
                //_logger.LogError(ex, "Error getting budgets for month {Month}", month);
                return StatusCode(500, new { message = "Error retrieving budgets", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBudget(int id, [FromBody] Budget budget)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var existingBudget = await _context.Budgets
                    .FirstOrDefaultAsync(b => b.Id == id && b.UserId == Guid.Parse(userId));

                if (existingBudget == null)
                {
                    return NotFound("Budget not found");
                }

                // Check for duplicate category in the same month (excluding the current budget being updated)
                var duplicateBudget = await _context.Budgets
                    .FirstOrDefaultAsync(b =>
                        b.UserId == Guid.Parse(userId) &&
                        b.Category == budget.Category &&
                        b.Month == budget.Month &&
                        b.Id != id);

                if (duplicateBudget != null)
                {
                    return BadRequest(new { message = $"A budget for category '{budget.Category}' already exists for this month" });
                }

                existingBudget.Category = budget.Category;
                existingBudget.Amount = budget.Amount;
                existingBudget.Month = budget.Month;

                await _context.SaveChangesAsync();
                return Ok(existingBudget);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the budget", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBudget(int id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null) return Unauthorized();
                var userId = Guid.Parse(userIdClaim);

                // Find the budget and verify ownership
                var budget = await _context.Budgets
                    .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

                if (budget == null)
                {
                    return NotFound(new { message = "Budget not found or you don't have permission to delete it" });
                }

                // Remove the budget
                _context.Budgets.Remove(budget);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Budget deleted successfully" });
            }
            catch (Exception ex)
            {
                //_logger.LogError(ex, "Error deleting budget {Id}", id);
                return StatusCode(500, new { message = "Error deleting budget", details = ex.Message });
            }

        }
    }
}
