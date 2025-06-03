namespace FinAIAPI.DTOs
{
    public class CreateSavingGoalDto
    {
        public string Title { get; set; }
        public decimal TargetAmount { get; set; }
        public DateTime? Deadline { get; set; }
    }
}
