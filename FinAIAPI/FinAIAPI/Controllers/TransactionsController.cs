using FinAIAPI.Data;
using FinAIAPI.DTOs;
using FinAIAPI.Helpers;
using FinAIAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FinAIAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]

    public class TransactionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TransactionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTransaction(CreateTransactionDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            if (!TransactionCategories.IsValid(dto.Category, dto.Type))
                return BadRequest("Invalid category for transaction type.");


            var transaction = new Transaction
            {
                Amount = dto.Amount,
                Category = dto.Category,
                Date = dto.Date,
                Description = dto.Description,
                Type = dto.Type,
                UserId = Guid.Parse(userIdClaim)
            };

            await _context.Transactions.AddAsync(transaction);
            await _context.SaveChangesAsync();

            return Ok(transaction);
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactions()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var userId = Guid.Parse(userIdClaim);

            var transactions = await _context.Transactions
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return Ok(transactions);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTransaction(int id, CreateTransactionDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var userId = Guid.Parse(userIdClaim);

            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (transaction == null) return NotFound();

            //  Validate category
            if (!TransactionCategories.IsValid(dto.Category, dto.Type))
                return BadRequest("Invalid category for transaction type.");

            //  Update fields
            transaction.Amount = dto.Amount;
            transaction.Category = dto.Category;
            transaction.Date = dto.Date;
            transaction.Description = dto.Description;
            transaction.Type = dto.Type;

            await _context.SaveChangesAsync();

            return Ok(transaction);
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransaction(int id)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var userId = Guid.Parse(userIdClaim);

            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (transaction == null) return NotFound();

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

