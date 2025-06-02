using FinAIAPI.Data;
using FinAIAPI.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Claims;

namespace FinAIAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{month}")]
        public async Task<IActionResult> GetDashboard(string month)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            var userId = Guid.Parse(userIdClaim);

            // Parse selected month
            if (!DateTime.TryParseExact(month + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var monthStart))
            {
                return BadRequest("Invalid month format. Use YYYY-MM.");
            }

            var monthEnd = monthStart.AddMonths(1);

            // Get all transactions for this user and month
            var transactions = await _context.Transactions
                .Where(t => t.UserId == userId && t.Date >= monthStart && t.Date < monthEnd)
                .ToListAsync();

            var totalIncome = transactions.Where(t => t.Type == "income").Sum(t => t.Amount);
            var totalExpense = transactions.Where(t => t.Type == "expense").Sum(t => t.Amount);

            var categoryBreakdown = transactions
                .Where(t => t.Type == "expense")
                .GroupBy(t => t.Category)
                .Select(g => new CategoryBreakdownDto
                {
                    Category = g.Key,
                    Amount = g.Sum(t => t.Amount)
                })
                .ToList();

            var topCategories = categoryBreakdown
                .OrderByDescending(c => c.Amount)
                .Take(3)
                .ToList();

            // Monthly trend: last 6 months
            var trends = new List<MonthlyTrendDto>();
            for (int i = 5; i >= 0; i--)
            {
                var targetMonth = monthStart.AddMonths(-i);
                var start = targetMonth;
                var end = targetMonth.AddMonths(1);

                var monthTransactions = await _context.Transactions
                    .Where(t => t.UserId == userId && t.Date >= start && t.Date < end)
                    .ToListAsync();

                trends.Add(new MonthlyTrendDto
                {
                    Month = targetMonth.ToString("yyyy-MM"),
                    Income = monthTransactions.Where(t => t.Type == "income").Sum(t => t.Amount),
                    Expense = monthTransactions.Where(t => t.Type == "expense").Sum(t => t.Amount)
                });
            }

            var dashboard = new DashboardDto
            {
                TotalIncome = totalIncome,
                TotalExpense = totalExpense,
                CategoryBreakdown = categoryBreakdown,
                TopCategories = topCategories,
                MonthlyTrends = trends
            };

            return Ok(dashboard);
        }
    }
}
