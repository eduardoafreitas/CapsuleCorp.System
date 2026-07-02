export type TelemetryStatus = "operational" | "alert" | "critical";

export interface Telemetry {
  equipmentId: string;
  timestamp: string;
  overallStatus: string;
  hostCpuTemperatureCelsius: number;
  hostStorageFreePercentage: number;
  powerSupplyVoltage: number;
  gradientCurrentAmperes: number;
  magnetHeliumLevelPercentage: number;
  magnetCompressorLinePressurePsi: number;
  magnetVesselHeliumPressurePsi: number;
  magnetTemperatureKelvin: number;
  magnetCompressorStatus: string;
  gantryVibrationG: number;
  roomTemperatureCelsius: number;
  roomHumidityPercentage: number;
  chillerWaterFlowLpm: number;
}
