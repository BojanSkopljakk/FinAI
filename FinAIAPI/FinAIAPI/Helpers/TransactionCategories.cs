namespace FinAIAPI.Helpers
{
    public class TransactionCategories
    {
        public static readonly List<string> Expense = new()
        {
            "Food",
            "Transportation",
            "Housing",
            "Utilities",
            "Entertainment",
            "Healthcare",
            "Shopping",
            "Other"
        };

        public static readonly List<string> Income = new()
        {
            "Salary",
            "Freelance",
            "Investments",
            "Gift",
            "Other"
        };

        public static bool IsValid(string category, string type)
        {
            if (type == "income") return Income.Contains(category);
            if (type == "expense") return Expense.Contains(category);
            return false;
        }
    }
}
