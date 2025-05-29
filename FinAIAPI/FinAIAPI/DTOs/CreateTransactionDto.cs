namespace FinAIAPI.DTOs
{
    public class CreateTransactionDto
    {
        public decimal Amount { get; set; }

        public string Category { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        public string Description { get; set; } = string.Empty;

        public string Type { get; set; } = "Expense";
    }
}
