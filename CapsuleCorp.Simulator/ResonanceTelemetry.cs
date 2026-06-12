using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CapsuleCorp.Simulator
{
    public class ResonanceTelemetry
    {
        public string EquipmentId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string OverallStatus { get; set; } = "Operational"; // Operational, Alert, Critical, Maintenance

        // ==========================================
        // HOST TELEMETRY (Console & Electronics)
        // ==========================================
        public double HostCpuTemperatureCelsius { get; set; }           // Ideal: 40°C to 70°C
        public double HostStorageFreePercentage { get; set; }           // Ideal: > 15% (Below this triggers low disk space alert)
        public double PowerSupplyVoltage { get; set; }                  // Ideal: 370V to 390V (Three-phase power stability)
        public double GradientCurrentAmperes { get; set; }              // Dynamic: 0A (Idle) to 250A (During heavy sequences)

        // ==========================================
        // MAGNET TELEMETRY (Gantry & Cryogenics)
        // ==========================================
        public double MagnetHeliumLevelPercentage { get; set; }         // Ideal: 60% to 100% (Below 50% risks a quench)
        public double MagnetCompressorLinePressurePsi { get; set; }     // Ideal: 240 PSI to 280 PSI (Closed-loop helium line)
        public double MagnetVesselHeliumPressurePsi { get; set; }       // Ideal: 1.5 PSI to 3.0 PSI (Internal cryostat vessel pressure)
        public double MagnetTemperatureKelvin { get; set; }             // Ideal: 4.1K to 4.5K (Close to absolute zero for superconductivity)
        public string MagnetCompressorStatus { get; set; } = "Normal";  // Normal, Fault, Disconnected
        public double GantryVibrationG { get; set; }                    // Ideal: < 0.2G (Normal mechanical vibration, spikes up to 2.0G during imaging)

        // --- Room Infrastructure ---
        public double RoomTemperatureCelsius { get; set; }              // Ideal: 18°C to 22°C (Strictly climate-controlled scan room)
        public double RoomHumidityPercentage { get; set; }              // Ideal: 40% to 60% (Prevents static/condensation on RF coils)
        public double ChillerWaterFlowLpm { get; set; }                 // Ideal: 40 LPM to 60 LPM (Secondary water cooling circuit)
    }
}