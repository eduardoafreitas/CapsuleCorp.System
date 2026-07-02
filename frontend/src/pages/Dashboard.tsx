import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "../auth/AuthContext";
import { can } from "../auth/permissions";
import { getAccessToken } from "../services/api";
import { ConnectionStatus, type ConnectionState } from "../telemetry/components/ConnectionStatus";
import { CriticalAlertModal } from "../telemetry/components/CriticalAlertModal";
import { TelemetryCard } from "../telemetry/components/TelemetryCard";
import { isCriticalTelemetry, sortTelemetryByEquipment } from "../telemetry/thresholds";
import type { Telemetry } from "../telemetry/types";

const MONITOR_HUB_URL = import.meta.env.VITE_MONITOR_HUB_URL ?? "https://localhost:6001/telemetryHub";

export default function Dashboard() {
  const { userRoles } = useAuth();
  const [telemetryData, setTelemetryData] = useState<Telemetry[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [criticalAlert, setCriticalAlert] = useState<Telemetry | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let retryTimer: number | undefined;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(MONITOR_HUB_URL, {
        accessTokenFactory: () => getAccessToken() || ""
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    const startConnection = async () => {
      try {
        setConnectionState("connecting");

        if (connection.state === signalR.HubConnectionState.Disconnected) {
          await connection.start();
        }

        if (isMounted) {
          setConnectionState("connected");
        }
      } catch (err) {
        console.error("Erro ao conectar ao SignalR:", err);

        if (isMounted) {
          setConnectionState("offline");
          retryTimer = window.setTimeout(startConnection, 5000);
        }
      }
    };

    connection.onreconnecting(() => {
      if (isMounted) setConnectionState("reconnecting");
    });

    connection.onreconnected(() => {
      if (isMounted) setConnectionState("connected");
    });

    connection.onclose(() => {
      if (isMounted) setConnectionState("offline");
    });

    connection.on("ReceiveTelemetry", (data: Telemetry) => {
      if (!isMounted) return;

      setTelemetryData(prev => {
        const filtered = prev.filter(item => item.equipmentId !== data.equipmentId);
        return [...filtered, data].sort(sortTelemetryByEquipment);
      });

      if (isCriticalTelemetry(data)) {
        setCriticalAlert(prev => {
          if (!prev || prev.equipmentId !== data.equipmentId) return data;
          return prev;
        });
      }
    });

    startConnection();

    return () => {
      isMounted = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      connection.off("ReceiveTelemetry");
      connection.stop();
    };
  }, []);

  if (debugLoading) {
    return (
      <div className="dashboard-loading">
        <div className="info-box">
          <p>Estabelecendo conexão em tempo real com a frota...</p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => setDebugLoading(false)}
        >
          Sair do modo de teste
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>Painel de Controle da Frota</h2>
          <div className="status-badge">
            Total de máquinas ativas: {telemetryData.length}
          </div>
        </div>

        <div className="dashboard-actions">
          <ConnectionStatus state={connectionState} />

          {can(userRoles, "telemetry:test") && (
            <button
              className="btn-secondary"
              onClick={() => setDebugLoading(true)}
            >
              Testar tela de conexão
            </button>
          )}
        </div>
      </div>

      {telemetryData.length === 0 && (
        <div className="info-box">
          <p>Aguardando o primeiro pacote de telemetria dos equipamentos.</p>
        </div>
      )}

      <div className="telemetry-grid">
        {telemetryData.map(telemetry => (
          <TelemetryCard key={telemetry.equipmentId} telemetry={telemetry} />
        ))}
      </div>

      {criticalAlert && (
        <CriticalAlertModal
          telemetry={criticalAlert}
          onClose={() => setCriticalAlert(null)}
        />
      )}
    </div>
  );
}
