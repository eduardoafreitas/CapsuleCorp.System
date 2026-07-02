import type { Telemetry, TelemetryStatus } from "./types";

export const EQUIPMENT_ORDER: Record<string, number> = {
  "RMN-SPO-001": 1,
  "RMN-RJO-002": 2,
  "RMN-BHE-003": 3,
  "RMN-CWB-004": 4
};

export const TELEMETRY_THRESHOLDS = {
  heliumLowPercentage: 40,
  chillerLowFlowLpm: 80,
  magnetMaxTemperatureKelvin: 4.5,
  gantryMaxVibrationG: 0.6,
  roomMaxTemperatureCelsius: 24,
  roomMaxHumidityPercentage: 65,
  hostMaxCpuTemperatureCelsius: 80,
  hostMinStorageFreePercentage: 15
};

export function normalizeStatus(status: string): TelemetryStatus {
  const normalized = status.toLowerCase();

  if (normalized.includes("critical") || normalized.includes("anomalia")) {
    return "critical";
  }

  if (normalized.includes("alert") || normalized.includes("warning")) {
    return "alert";
  }

  return "operational";
}

export function isCriticalTelemetry(telemetry: Telemetry) {
  return normalizeStatus(telemetry.overallStatus) === "critical"
    || telemetry.magnetCompressorStatus === "Fault"
    || telemetry.magnetHeliumLevelPercentage < TELEMETRY_THRESHOLDS.heliumLowPercentage
    || telemetry.chillerWaterFlowLpm < TELEMETRY_THRESHOLDS.chillerLowFlowLpm;
}

export function isLow(value: number, minimum: number) {
  return value < minimum;
}

export function isHigh(value: number, maximum: number) {
  return value > maximum;
}

export function sortTelemetryByEquipment(a: Telemetry, b: Telemetry) {
  const orderA = EQUIPMENT_ORDER[a.equipmentId] ?? 99;
  const orderB = EQUIPMENT_ORDER[b.equipmentId] ?? 99;

  return orderA - orderB;
}
