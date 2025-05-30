using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class BudgetsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BudgetsController(ApplicationDbContext context)
        {
            _context = context;
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
    }
} 