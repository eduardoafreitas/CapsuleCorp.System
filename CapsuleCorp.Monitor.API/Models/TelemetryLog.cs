using System;

namespace CapsuleCorp.Monitor.API.Models
{
    public class TelemetryLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string EquipmentId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string OverallStatus { get; set; } = "Operational";

        #region Host Metrics
        public double HostCpuTemperatureCelsius { get; set; }
        public double HostStorageFreePercentage { get; set; }
        public double PowerSupplyVoltage { get; set; }
        public double GradientCurrentAmperes { get; set; }
        #endregion

        #region Magnet Metrics
        public double MagnetHeliumLevelPercentage { get; set; }
        public double MagnetCompressorLinePressurePsi { get; set; }
        public double MagnetVesselHeliumPressurePsi { get; set; }
        public double MagnetTemperatureKelvin { get; set; }
        public string MagnetCompressorStatus { get; set; } = "Normal";
        public double GantryVibrationG { get; set; }
        #endregion

        #region Infrastructure
        public double RoomTemperatureCelsius { get; set; }
        public double RoomHumidityPercentage { get; set; }
        public double ChillerWaterFlowLpm { get; set; }
        #endregion
    }
}