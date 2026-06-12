using CapsuleCorp.Monitor.API.Data;
using CapsuleCorp.Monitor.API.DTOs;
using CapsuleCorp.Monitor.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CapsuleCorp.Monitor.API.Controllers
{
    [ApiController]
    [Route("api/telemetria")]
    public class TelemetryController : ControllerBase
    {
        private readonly ILogger<TelemetryController> _logger;
        private readonly AppDbContext _context; // DECLARA O CONTEXTO

        // INJETA O CONTEXTO NO CONSTRUTOR
        public TelemetryController(ILogger<TelemetryController> logger, AppDbContext context)
        {
            _logger = logger;
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> ReceiveTelemetry([FromBody] TelemetryInputDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.EquipmentId))
            {
                return BadRequest(new { message = "Dados inválidos." });
            }

            // --- SEUS LOGS DE CORES ---
            if (dto.OverallStatus == "Critical")
            {
                _logger.LogWarning($"🔥 [CRÍTICO] {dto.EquipmentId} -> Vaso: {dto.MagnetVesselHeliumPressurePsi} PSI | Compressor: {dto.MagnetCompressorStatus}");
            }
            else if (dto.OverallStatus == "Alert")
            {
                _logger.LogInformation($"⚠️ [ALERTA] {dto.EquipmentId} -> CPU: {dto.HostCpuTemperatureCelsius}°C | Chiller: {dto.ChillerWaterFlowLpm} LPM");
            }
            else
            {
                _logger.LogInformation($"✅ [OK] {dto.EquipmentId} | Status: {dto.OverallStatus}");
            }

            // --- SALVAR NO POSTGRESQL COM OS CAMPOS NOVOS MAPEADOS ---
            try
            {
                var telemetriaBanco = new TelemetryLog
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

                    // Adicione estas 5 linhas novas aqui no mapeamento:
                    MagnetCompressorStatus = dto.MagnetCompressorStatus ?? "Normal",
                    GantryVibrationG = dto.GantryVibrationG,
                    RoomTemperatureCelsius = dto.RoomTemperatureCelsius,
                    RoomHumidityPercentage = dto.RoomHumidityPercentage,
                    ChillerWaterFlowLpm = dto.ChillerWaterFlowLpm
                };

                _context.TelemetryHistories.Add(telemetriaBanco);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Erro ao persistir dados no banco: {ex.Message}");
                return StatusCode(500, "Erro interno ao salvar os dados de telemetria.");
            }

            return Ok(new { message = "Telemetria recebida e salva com sucesso!" });
        }

        [HttpGet]
        public async Task<IActionResult> GetHistory(
            [FromQuery] string? equipmentId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.TelemetryHistories.AsQueryable();

                if (!string.IsNullOrEmpty(equipmentId))
                {
                    query = query.Where(t => t.EquipmentId.Equals(equipmentId, StringComparison.OrdinalIgnoreCase));
                }

                query = query.OrderByDescending(t => t.Timestamp);

                var totalRecords = await query.CountAsync();
                var records = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(t => new TelemetryOutputDto
                    {
                        Id = t.Id,
                        EquipmentId = t.EquipmentId,
                        Timestamp = t.Timestamp,
                        OverallStatus = t.OverallStatus,
                        HostCpuTemperatureCelsius = t.HostCpuTemperatureCelsius,
                        HostStorageFreePercentage = t.HostStorageFreePercentage,
                        PowerSupplyVoltage = t.PowerSupplyVoltage,
                        GradientCurrentAmperes = t.GradientCurrentAmperes,
                        MagnetHeliumLevelPercentage = t.MagnetHeliumLevelPercentage,
                        MagnetCompressorLinePressurePsi = t.MagnetCompressorLinePressurePsi,
                        MagnetVesselHeliumPressurePsi = t.MagnetVesselHeliumPressurePsi,
                        MagnetTemperatureKelvin = t.MagnetTemperatureKelvin,
                        MagnetCompressorStatus = t.MagnetCompressorStatus,
                        GantryVibrationG = t.GantryVibrationG,
                        RoomTemperatureCelsius = t.RoomTemperatureCelsius,
                        RoomHumidityPercentage = t.RoomHumidityPercentage,
                        ChillerWaterFlowLpm = t.ChillerWaterFlowLpm
                    })
                    .ToListAsync();

                return Ok(new
                {
                    TotalRecords = totalRecords,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalRecords / pageSize),
                    Data = records
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Erro ao buscar histórico de telemetria: {ex.Message}");
                return StatusCode(500, "Erro interno ao processar a consulta.");
            }
        }
    }
}