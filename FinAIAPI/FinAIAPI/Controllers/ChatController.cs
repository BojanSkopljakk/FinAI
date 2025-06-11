using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FinAIAPI.Data;
using System.Globalization;
using System.Text.RegularExpressions;

namespace FinAIAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _http;
        private readonly ApplicationDbContext _context;

        public ChatController(IConfiguration config, ApplicationDbContext context)
        {
            _config = config;
            _http = new HttpClient();
            _context = context;
        }

        private (DateTime? start, DateTime? end) ParseDateRangeFromMessage(string message)
        {
            // Example: parse "June", "June 2024", "2024-06", etc.
            var monthNames = CultureInfo.CurrentCulture.DateTimeFormat.MonthNames
                .Where(m => !string.IsNullOrEmpty(m)).ToList();

            foreach (var monthName in monthNames)
            {
                if (message.Contains(monthName, StringComparison.OrdinalIgnoreCase))
                {
                    var now = DateTime.UtcNow;
                    var month = monthNames.IndexOf(monthName) + 1;
                    int year = now.Year;

                    // Optional: look for year pattern in message, else use current year
                    var yearMatch = Regex.Match(message, @"\b(20\d{2})\b");
                    if (yearMatch.Success)
                        year = int.Parse(yearMatch.Value);

                    var start = new DateTime(year, month, 1);
                    var end = start.AddMonths(1);
                    return (start, end);
                }
            }

            // Could not parse month => no filtering
            return (null, null);
        }


        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Ask([FromBody] ChatRequest request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var userId = Guid.Parse(userIdClaim);

            // 1. Parse date range from user message to filter transactions
            var (startDate, endDate) = ParseDateRangeFromMessage(request.Message);

            // 2. Build query for transactions with optional date filtering
            var transactionsQuery = _context.Transactions.Where(t => t.UserId == userId);
            if (startDate.HasValue && endDate.HasValue)
            {
                transactionsQuery = transactionsQuery.Where(t => t.Date >= startDate.Value && t.Date < endDate.Value);
            }

            // 3. Execute query to get filtered transactions
            var transactions = await transactionsQuery.ToListAsync();

            // Load user transactions
          /*  var transactions = await _context.Transactions
                .Where(t => t.UserId == userId)
                .ToListAsync();*/

            var totalIncome = transactions.Where(t => t.Type == "income").Sum(t => t.Amount);
            var totalExpense = transactions.Where(t => t.Type == "expense").Sum(t => t.Amount);
            var totalSavings = totalIncome - totalExpense;
            var transactionCount = transactions.Count;

            var biggestExpenseGroup = transactions
                .Where(t => t.Type == "expense")
                .GroupBy(t => t.Category)
                .OrderByDescending(g => g.Sum(t => t.Amount))
                .FirstOrDefault();

            var biggestCategory = biggestExpenseGroup?.Key ?? "None";
            var biggestCategoryAmount = biggestExpenseGroup?.Sum(t => t.Amount) ?? 0;

            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
            var recentTransactions = transactions.Where(t => t.Date >= sixMonthsAgo).ToList();

            var monthlyIncomeGroups = recentTransactions
                .Where(t => t.Type == "income")
                .GroupBy(t => new { t.Date.Year, t.Date.Month })
                .Select(g => g.Sum(t => t.Amount))
                .ToList();

            var monthlyExpenseGroups = recentTransactions
                .Where(t => t.Type == "expense")
                .GroupBy(g => new { g.Date.Year, g.Date.Month })
                .Select(g => g.Sum(t => t.Amount))
                .ToList();

            decimal avgMonthlyIncome = monthlyIncomeGroups.Any() ? monthlyIncomeGroups.Average() : 0;
            decimal avgMonthlyExpenses = monthlyExpenseGroups.Any() ? monthlyExpenseGroups.Average() : 0;

            var lastMonth = DateTime.UtcNow.AddMonths(-1);
            var monthBeforeLast = DateTime.UtcNow.AddMonths(-2);

            decimal lastMonthExpenses = recentTransactions
                .Where(t => t.Type == "expense" && t.Date.Year == lastMonth.Year && t.Date.Month == lastMonth.Month)
                .Sum(t => t.Amount);

            decimal monthBeforeLastExpenses = recentTransactions
                .Where(t => t.Type == "expense" && t.Date.Year == monthBeforeLast.Year && t.Date.Month == monthBeforeLast.Month)
                .Sum(t => t.Amount);

            string expenseAlert = "";
            if (monthBeforeLastExpenses > 0 && lastMonthExpenses > monthBeforeLastExpenses * 1.1m)
            {
                expenseAlert = $"Note: Your expenses increased by {((lastMonthExpenses / monthBeforeLastExpenses) - 1) * 100:F1}% last month compared to the previous month.";
            }

            // Load budgets and savings goals
            var budgets = await _context.Budgets.Where(b => b.UserId == userId).ToListAsync();
            var goals = await _context.SavingGoals.Where(g => g.UserId == userId).ToListAsync();

            string financialSummary = $@"
User financial summary:
- Total Income: {totalIncome:C}
- Total Expenses: {totalExpense:C}
- Estimated Savings: {totalSavings:C}
- Number of Transactions: {transactionCount}
- Biggest Expense Category: {biggestCategory} with {biggestCategoryAmount:C}
- Average Monthly Income (last 6 months): {avgMonthlyIncome:C}
- Average Monthly Expenses (last 6 months): {avgMonthlyExpenses:C}
{expenseAlert}
";

            if (budgets.Any())
            {
                financialSummary += "\nUser Budgets:\n";
                foreach (var budget in budgets)
                {
                    financialSummary += $"- {budget.Category}: {budget.Amount:C}\n";
                }
            }

            if (goals.Any())
            {
                financialSummary += "\nUser Savings Goals:\n";
                foreach (var goal in goals)
                {
                    financialSummary += $"- {goal.Title}: {goal.CurrentAmount:C} / {goal.TargetAmount:C}\n";
                }
            }

            var messages = new[]
            {
                new { role = "system", content = "You are a knowledgeable personal finance advisor. Provide personalized budgeting, saving, and investment advice based on the user's financial data." },
                new { role = "system", content = financialSummary },
                new { role = "user", content = request.Message }
            };

            var payload = new
            {
                model = "gpt-3.5-turbo",
                messages = messages
            };

            var apiKey = _config["OpenAI:ApiKey"];
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await _http.PostAsync("https://api.openai.com/v1/chat/completions", content);
            var responseString = await response.Content.ReadAsStringAsync();

            return Ok(JsonDocument.Parse(responseString));
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; }
    }


}

