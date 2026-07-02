using CapsuleCorp.Monitor.API.Data;
using CapsuleCorp.Monitor.API.DTOs;
using CapsuleCorp.Monitor.API.Hubs;
using CapsuleCorp.Monitor.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CapsuleCorp.Monitor.API.Controllers
{
    [ApiController]
    [Route("api/telemetria")]
    public class TelemetryController : ControllerBase
    {
        private const string TelemetryReaderRoles = "Admin,Editor,Viewer";

        private readonly ILogger<TelemetryController> _logger;
        private readonly AppDbContext _context;
        private readonly IHubContext<TelemetryHub> _hubContext;

        public TelemetryController(
            ILogger<TelemetryController> logger,
            AppDbContext context,
            IHubContext<TelemetryHub> hubContext)
        {
            _logger = logger;
            _context = context;
            _hubContext = hubContext;
        }

        [HttpPost]
        public async Task<IActionResult> ReceiveTelemetry([FromBody] TelemetryInputDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.EquipmentId))
            {
                return BadRequest(new { message = "Dados invalidos." });
            }

            LogTelemetry(dto);

            try
            {
                var telemetryLog = new TelemetryLog
                {
                    Id = Guid.NewGuid(),
                    EquipmentId = dto.EquipmentId,
                    Timestamp = DateTime.UtcNow,
                    OverallStatus = dto.OverallStatus,
                    HostCpuTemperatureCelsius = dto.HostCpuTemperatureCelsius,
                    HostStorageFreePercentage = dto.HostStorageFreePercentage,
                    PowerSupplyVoltage = dto.PowerSupplyVoltage,
                    GradientCurrentAmperes = dto.GradientCurrentAmperes,
                    MagnetHeliumLevelPercentage = dto.MagnetHeliumLevelPercentage,
                    MagnetCompressorLinePressurePsi = dto.MagnetCompressorLinePressurePsi,
                    MagnetVesselHeliumPressurePsi = dto.MagnetVesselHeliumPressurePsi,
                    MagnetTemperatureKelvin = dto.MagnetTemperatureKelvin,
                    MagnetCompressorStatus = dto.MagnetCompressorStatus ?? "Normal",
                    GantryVibrationG = dto.GantryVibrationG,
                    RoomTemperatureCelsius = dto.RoomTemperatureCelsius,
                    RoomHumidityPercentage = dto.RoomHumidityPercentage,
                    ChillerWaterFlowLpm = dto.ChillerWaterFlowLpm
                };

                _context.TelemetryHistories.Add(telemetryLog);
                await _context.SaveChangesAsync();

                await _hubContext.Clients.All.SendAsync("ReceiveTelemetry", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao persistir ou transmitir telemetria do equipamento {EquipmentId}.", dto.EquipmentId);
                return StatusCode(500, "Erro interno ao processar os dados de telemetria.");
            }

            return Ok(new { message = "Telemetria recebida, salva e transmitida com sucesso." });
        }

        [Authorize(Roles = TelemetryReaderRoles)]
        [HttpGet]
        public async Task<IActionResult> GetHistory(
            [FromQuery] string? equipmentId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 200) pageSize = 200;

            try
            {
                var query = _context.TelemetryHistories
                    .AsNoTracking()
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(equipmentId))
                {
                    query = query.Where(t => t.EquipmentId.ToLower() == equipmentId.ToLower());
                }

                query = query.OrderByDescending(t => t.Timestamp);

                var totalRecords = await query.CountAsync();
                var records = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(t => ToOutputDto(t))
                    .ToListAsync();

                return Ok(new
                {
                    totalRecords,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalRecords / pageSize),
                    data = records
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar historico de telemetria.");
                return StatusCode(500, "Erro interno ao processar a consulta.");
            }
        }

        [Authorize(Roles = TelemetryReaderRoles)]
        [HttpGet("latest")]
        public async Task<IActionResult> GetLatest()
        {
            try
            {
                var records = await _context.TelemetryHistories
                    .AsNoTracking()
                    .GroupBy(t => t.EquipmentId)
                    .Select(group => group
                        .OrderByDescending(t => t.Timestamp)
                        .First())
                    .OrderBy(t => t.EquipmentId)
                    .Select(t => ToOutputDto(t))
                    .ToListAsync();

                return Ok(new { data = records });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar ultima telemetria por equipamento.");
                return StatusCode(500, "Erro interno ao processar a consulta.");
            }
        }

        private void LogTelemetry(TelemetryInputDto dto)
        {
            if (dto.OverallStatus == "Critical")
            {
                _logger.LogWarning(
                    "[CRITICAL] {EquipmentId} -> Vaso: {VesselPressure} PSI | Compressor: {CompressorStatus}",
                    dto.EquipmentId,
                    dto.MagnetVesselHeliumPressurePsi,
                    dto.MagnetCompressorStatus);
                return;
            }

            if (dto.OverallStatus == "Alert")
            {
                _logger.LogInformation(
                    "[ALERT] {EquipmentId} -> CPU: {CpuTemperature} C | Chiller: {ChillerFlow} LPM",
                    dto.EquipmentId,
                    dto.HostCpuTemperatureCelsius,
                    dto.ChillerWaterFlowLpm);
                return;
            }

            _logger.LogInformation("[OK] {EquipmentId} | Status: {OverallStatus}", dto.EquipmentId, dto.OverallStatus);
        }

        private static TelemetryOutputDto ToOutputDto(TelemetryLog telemetry)
        {
            return new TelemetryOutputDto
            {
                Id = telemetry.Id,
                EquipmentId = telemetry.EquipmentId,
                Timestamp = telemetry.Timestamp,
                OverallStatus = telemetry.OverallStatus,
                HostCpuTemperatureCelsius = telemetry.HostCpuTemperatureCelsius,
                HostStorageFreePercentage = telemetry.HostStorageFreePercentage,
                PowerSupplyVoltage = telemetry.PowerSupplyVoltage,
                GradientCurrentAmperes = telemetry.GradientCurrentAmperes,
                MagnetHeliumLevelPercentage = telemetry.MagnetHeliumLevelPercentage,
                MagnetCompressorLinePressurePsi = telemetry.MagnetCompressorLinePressurePsi,
                MagnetVesselHeliumPressurePsi = telemetry.MagnetVesselHeliumPressurePsi,
                MagnetTemperatureKelvin = telemetry.MagnetTemperatureKelvin,
                MagnetCompressorStatus = telemetry.MagnetCompressorStatus,
                GantryVibrationG = telemetry.GantryVibrationG,
                RoomTemperatureCelsius = telemetry.RoomTemperatureCelsius,
                RoomHumidityPercentage = telemetry.RoomHumidityPercentage,
                ChillerWaterFlowLpm = telemetry.ChillerWaterFlowLpm
            };
        }
    }
}
