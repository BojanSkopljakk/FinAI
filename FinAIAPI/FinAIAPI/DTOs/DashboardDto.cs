namespace FinAIAPI.DTOs
{
    public class DashboardDto
    {
        public decimal TotalIncome { get; set; }
        public decimal TotalExpense { get; set; }

        public List<CategoryBreakdownDto> CategoryBreakdown { get; set; }
        public List<MonthlyTrendDto> MonthlyTrends { get; set; }
        public List<CategoryBreakdownDto> TopCategories { get; set; }
    }

    public class CategoryBreakdownDto
    {
        public string Category { get; set; }
        public decimal Amount { get; set; }
    }

    public class MonthlyTrendDto
    {
        public string Month { get; set; } // Format: YYYY-MM
        public decimal Expense { get; set; }
        public decimal Income { get; set; }
    }
}
