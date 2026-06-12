using System;

namespace CapsuleCorp.Shared.Models
{
    public class ResonanceTelemetry
    {
        public string EquipmentId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string OverallStatus { get; set; } = "Operational";

        // Host Telemetry
        public double HostCpuTemperatureCelsius { get; set; }
        public double HostStorageFreePercentage { get; set; }
        public double PowerSupplyVoltage { get; set; }
        public double GradientCurrentAmperes { get; set; }

        // Magnet Telemetry
        public double MagnetHeliumLevelPercentage { get; set; }
        public double MagnetCompressorLinePressurePsi { get; set; }
        public double MagnetVesselHeliumPressurePsi { get; set; }
        public double MagnetTemperatureKelvin { get; set; }
        public string MagnetCompressorStatus { get; set; } = "Normal";
        public double GantryVibrationG { get; set; }

        // Infrastructure
        public double RoomTemperatureCelsius { get; set; }
        public double RoomHumidityPercentage { get; set; }
        public double ChillerWaterFlowLpm { get; set; }
    }
}
