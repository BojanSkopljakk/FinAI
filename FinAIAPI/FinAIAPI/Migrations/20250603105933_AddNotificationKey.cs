using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinAIAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UniqueKey",
                table: "Notifications",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_UniqueKey",
                table: "Notifications",
                columns: new[] { "UserId", "UniqueKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Notifications_UserId_UniqueKey",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "UniqueKey",
                table: "Notifications");
        }
    }
}
