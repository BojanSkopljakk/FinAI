namespace FinAIAPI.DTOs
{
    public class CreateBudgetDto
    {
        public string Category { get; set; }
        public decimal Amount { get; set; }
        public string Month { get; set; } // Format: YYYY-MM
    }
}
