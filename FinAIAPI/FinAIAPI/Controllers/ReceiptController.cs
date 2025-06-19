using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using Azure.AI.FormRecognizer.DocumentAnalysis;
using Azure;
using FinAIAPI.DTOs;
using FinAIAPI.Services;

namespace FinAIAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReceiptController : ControllerBase
    {
        private readonly SemanticKernelService _semanticKernel;

        public ReceiptController(SemanticKernelService semanticKernel)
        {
            _semanticKernel = semanticKernel;
        }

        [HttpPost("parse")]
        public async Task<IActionResult> ParseReceipt([FromBody] ReceiptParseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.OcrText))
            {
                return BadRequest("OCR text is required.");
            }

            try
            {
                // Log OCR text snippet
                Console.WriteLine("Received OCR text (snippet): " +
                    (request.OcrText.Length > 200 ? request.OcrText.Substring(0, 200) + "..." : request.OcrText));

                // Build prompt with instructions for noisy OCR text
                string prompt = $@"
You are an expert receipt parser.
Analyze the following receipt text and extract expense items as a JSON array with fields:
Amount, Category, Date, Description, Type (always 'Expense').

The receipt text may contain OCR noise or errors. Please focus on extracting valid expense items, ignoring irrelevant text.

For the Date field:
- Try your best to extract the exact date from the receipt.
- If the date is missing or unclear, return an empty string ("").

Return ONLY a JSON array. Example:

[
  {{
    ""Amount"": 12.50,
    ""Category"": ""Food"",
    ""Date"": ""2025-06-10"",
    ""Description"": ""Lunch at Joe's Diner"",
    ""Type"": ""Expense""
  }}
]

Receipt text:
{request.OcrText}
";

                var parsedJson = await _semanticKernel.ParseReceiptTextAsync(prompt);

                Console.WriteLine("GPT returned JSON: " + parsedJson);

                if (string.IsNullOrWhiteSpace(parsedJson) || !parsedJson.TrimStart().StartsWith("["))
                {
                    return BadRequest("GPT returned invalid JSON.");
                }

                var expenses = JsonSerializer.Deserialize<List<CreateTransactionDto>>(parsedJson);

                return Ok(expenses);
            }
            catch (JsonException jsonEx)
            {
                Console.Error.WriteLine("JSON deserialization error: " + jsonEx);
                return StatusCode(500, $"JSON deserialization failed: {jsonEx.Message}");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Parsing failed: " + ex);
                return StatusCode(500, $"Parsing failed: {ex.Message}");
            }
        }
    }


        public class ReceiptParseRequest
        {
        public string OcrText { get; set; } = string.Empty;
    }
}
