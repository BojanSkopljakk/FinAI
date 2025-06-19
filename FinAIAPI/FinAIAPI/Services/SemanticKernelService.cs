using Microsoft.SemanticKernel;
using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using System.Threading.Tasks;
using Microsoft.SemanticKernel.ChatCompletion;

namespace FinAIAPI.Services
{
    public class SemanticKernelService
    {
        private readonly Kernel _kernel;
        private readonly IChatCompletionService _chat;

        public SemanticKernelService(IConfiguration configuration)
        {
            string openAiKey = configuration["OpenAI:ApiKey"];

            _kernel = Kernel.CreateBuilder()
                .AddOpenAIChatCompletion("gpt-4o-mini", openAiKey)
                .Build();

            _chat = _kernel.GetRequiredService<IChatCompletionService>();
        }

        public async Task<string> ParseReceiptTextAsync(string receiptText)
        {
            var history = new ChatHistory();
            history.AddSystemMessage("You are an expert receipt parser.");

            history.AddUserMessage(receiptText);

            var result = await _chat.GetChatMessageContentAsync(history);

            return result.Content;
        }
    }
}
