using System;

namespace CapsuleCorp.Monitor.API.DTOs
{
    public class TelemetryOutputDto
    {
        public Guid Id { get; set; }
        public string? EquipmentId { get; set; }
        public DateTime Timestamp { get; set; }
        public string? OverallStatus { get; set; }
        public double HostCpuTemperatureCelsius { get; set; }
        public double HostStorageFreePercentage { get; set; }
        public double PowerSupplyVoltage { get; set; }
        public double GradientCurrentAmperes { get; set; }
        public double MagnetHeliumLevelPercentage { get; set; }
        public double MagnetCompressorLinePressurePsi { get; set; }
        public double MagnetVesselHeliumPressurePsi { get; set; }
        public double MagnetTemperatureKelvin { get; set; }
        public string? MagnetCompressorStatus { get; set; }
        public double GantryVibrationG { get; set; }
        public double RoomTemperatureCelsius { get; set; }
        public double RoomHumidityPercentage { get; set; }
        public double ChillerWaterFlowLpm { get; set; }
    }
}