import type { Telemetry } from "../types";

type CriticalAlertModalProps = {
  telemetry: Telemetry;
  onClose: () => void;
};

export function CriticalAlertModal({ telemetry, onClose }: CriticalAlertModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal alert-critical-modal">
        <h3>Alerta crítico de sistema</h3>
        <p>
          O equipamento <strong>{telemetry.equipmentId}</strong> reportou uma falha grave.
        </p>
        <div className="alert-details">
          <p><strong>Status:</strong> {telemetry.overallStatus}</p>
          <p><strong>Compressor:</strong> {telemetry.magnetCompressorStatus}</p>
          <p><strong>Fluxo chiller:</strong> {telemetry.chillerWaterFlowLpm} LPM</p>
          <p><strong>Pressão do vaso:</strong> {telemetry.magnetVesselHeliumPressurePsi} PSI</p>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary alert-dismiss" onClick={onClose}>
            Ciente / Silenciar
          </button>
        </div>
      </div>
    </div>
  );
}
