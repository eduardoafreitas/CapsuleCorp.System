import type { Telemetry } from "../types";
import { isHigh, isLow, normalizeStatus, TELEMETRY_THRESHOLDS } from "../thresholds";
import { MetricItem } from "./MetricItem";
import { MetricSection } from "./MetricSection";

type TelemetryCardProps = {
  telemetry: Telemetry;
};

function formatNumber(value: number, fractionDigits = 1) {
  return Number.isFinite(value) ? value.toFixed(fractionDigits) : "--";
}

export function TelemetryCard({ telemetry }: TelemetryCardProps) {
  const status = normalizeStatus(telemetry.overallStatus);

  return (
    <div className={`telemetry-card ${status}`}>
      <div className="card-header">
        <h3>{telemetry.equipmentId}</h3>
        <span className={`indicator ${status}`} />
      </div>

      <MetricSection title="Criogenia e magneto">
        <MetricItem
          label="Nível hélio"
          value={`${formatNumber(telemetry.magnetHeliumLevelPercentage, 0)}%`}
          danger={isLow(telemetry.magnetHeliumLevelPercentage, TELEMETRY_THRESHOLDS.heliumLowPercentage)}
        />
        <MetricItem
          label="Temp. ímã"
          value={`${formatNumber(telemetry.magnetTemperatureKelvin, 2)} K`}
          danger={isHigh(telemetry.magnetTemperatureKelvin, TELEMETRY_THRESHOLDS.magnetMaxTemperatureKelvin)}
        />
        <MetricItem label="Vaso hélio" value={`${formatNumber(telemetry.magnetVesselHeliumPressurePsi)} PSI`} />
        <MetricItem label="Linha comp." value={`${formatNumber(telemetry.magnetCompressorLinePressurePsi)} PSI`} />
        <MetricItem
          label="Status comp."
          value={telemetry.magnetCompressorStatus}
          danger={telemetry.magnetCompressorStatus === "Fault"}
        />
        <MetricItem
          label="Vibração"
          value={`${formatNumber(telemetry.gantryVibrationG, 2)} G`}
          danger={isHigh(telemetry.gantryVibrationG, TELEMETRY_THRESHOLDS.gantryMaxVibrationG)}
        />
      </MetricSection>

      <MetricSection title="Host embarcado">
        <MetricItem
          label="Temp. CPU"
          value={`${formatNumber(telemetry.hostCpuTemperatureCelsius)}°C`}
          danger={isHigh(telemetry.hostCpuTemperatureCelsius, TELEMETRY_THRESHOLDS.hostMaxCpuTemperatureCelsius)}
        />
        <MetricItem
          label="Armaz. livre"
          value={`${formatNumber(telemetry.hostStorageFreePercentage, 0)}%`}
          danger={isLow(telemetry.hostStorageFreePercentage, TELEMETRY_THRESHOLDS.hostMinStorageFreePercentage)}
        />
        <MetricItem label="Tensão fonte" value={`${formatNumber(telemetry.powerSupplyVoltage)} V`} />
        <MetricItem label="Corr. gradiente" value={`${formatNumber(telemetry.gradientCurrentAmperes)} A`} />
      </MetricSection>

      <MetricSection title="Infraestrutura">
        <MetricItem
          label="Fluxo chiller"
          value={`${formatNumber(telemetry.chillerWaterFlowLpm)} LPM`}
          danger={isLow(telemetry.chillerWaterFlowLpm, TELEMETRY_THRESHOLDS.chillerLowFlowLpm)}
        />
        <MetricItem
          label="Sala (T / U)"
          value={`${formatNumber(telemetry.roomTemperatureCelsius)}°C / ${formatNumber(telemetry.roomHumidityPercentage, 0)}%`}
          danger={isHigh(telemetry.roomTemperatureCelsius, TELEMETRY_THRESHOLDS.roomMaxTemperatureCelsius)
            || isHigh(telemetry.roomHumidityPercentage, TELEMETRY_THRESHOLDS.roomMaxHumidityPercentage)}
        />
      </MetricSection>

      <div className="timestamp">
        Última atualização: {new Date(telemetry.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
