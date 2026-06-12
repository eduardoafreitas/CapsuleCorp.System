using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CapsuleCorp.Monitor.API.Migrations
{
    /// <inheritdoc />
    public partial class InicializarBancoMonitor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TelemetryHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EquipmentId = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OverallStatus = table.Column<string>(type: "text", nullable: false),
                    HostCpuTemperatureCelsius = table.Column<double>(type: "double precision", nullable: false),
                    HostStorageFreePercentage = table.Column<double>(type: "double precision", nullable: false),
                    PowerSupplyVoltage = table.Column<double>(type: "double precision", nullable: false),
                    GradientCurrentAmperes = table.Column<double>(type: "double precision", nullable: false),
                    MagnetHeliumLevelPercentage = table.Column<double>(type: "double precision", nullable: false),
                    MagnetCompressorLinePressurePsi = table.Column<double>(type: "double precision", nullable: false),
                    MagnetVesselHeliumPressurePsi = table.Column<double>(type: "double precision", nullable: false),
                    MagnetTemperatureKelvin = table.Column<double>(type: "double precision", nullable: false),
                    MagnetCompressorStatus = table.Column<string>(type: "text", nullable: false),
                    GantryVibrationG = table.Column<double>(type: "double precision", nullable: false),
                    RoomTemperatureCelsius = table.Column<double>(type: "double precision", nullable: false),
                    RoomHumidityPercentage = table.Column<double>(type: "double precision", nullable: false),
                    ChillerWaterFlowLpm = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelemetryHistories", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TelemetryHistories_EquipmentId_Timestamp",
                table: "TelemetryHistories",
                columns: new[] { "EquipmentId", "Timestamp" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TelemetryHistories");
        }
    }
}
