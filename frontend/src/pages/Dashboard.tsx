import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { getAccessToken } from "../services/api";

const MONITOR_HUB_URL = import.meta.env.VITE_MONITOR_HUB_URL ?? "https://localhost:6001/telemetryHub";

interface Telemetry {
  equipmentId: string;
  timestamp: string;
  overallStatus: string;
  hostCpuTemperatureCelsius: number;
  magnetHeliumLevelPercentage: number;
  magnetCompressorStatus: string;
  roomTemperatureCelsius: number;
  chillerWaterFlowLpm: number;
}

// 1. Criamos a interface para as propriedades do Dashboard
interface DashboardProps {
  userRoles?: string[];
}

// 2. Modificamos a assinatura para receber as userRoles (padrão vazio caso venha undefined)
export default function Dashboard({ userRoles = [] }: DashboardProps) {
  const [telemetryData, setTelemetryData] = useState<Telemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [criticalAlert, setCriticalAlert] = useState<Telemetry | null>(null);
  
  // Estado de debug para forçar o loading
  const [debugLoading, setDebugLoading] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    let isMounted = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(MONITOR_HUB_URL, {
        accessTokenFactory: () => getAccessToken() || ""
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    const startConnection = async () => {
      try {
        if (connection.state === signalR.HubConnectionState.Disconnected) {
          await connection.start();
          console.log("Conectado ao SignalR Hub");
          if (isMounted) setLoading(false);
        }
      } catch (err) {
        console.error("Erro ao conectar ao SignalR:", err);
        if (isMounted) {
          setTimeout(startConnection, 5000);
        }
      }
    };

    connection.on("ReceiveTelemetry", (data: Telemetry) => {
      if (!isMounted) return;

      setTelemetryData(prev => {
        const filtered = prev.filter(t => t.equipmentId !== data.equipmentId);
        return [...filtered, data];
      });

      if (data.overallStatus === "Critical") {
        setCriticalAlert(prev => {
          if (!prev || prev.equipmentId !== data.equipmentId) return data;
          return prev;
        });
      }
    });

    startConnection();

    return () => {
      isMounted = false;
      connection.off("ReceiveTelemetry");
      connection.stop();
    };
  }, []);

  // Tela de carregamento mantendo sua classe original 'info-box'
  if ((loading && telemetryData.length === 0) || debugLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="info-box">
          <p>Estabelecendo conexão em tempo real com a frota...</p>
        </div>
        
        {debugLoading && (
          <button 
            className="btn-secondary" 
            onClick={() => setDebugLoading(false)} 
            style={{ width: 'max-content', margin: '0 auto' }}
          >
            Sair do Modo de Teste
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>Painel de Controle da Frota</h2>
          <div className="status-badge">
            Total de Máquinas Ativas: {telemetryData.length}
          </div>
        </div>
        
        {/* O botão agora só renderiza se o usuário for Admin ou Editor */}
        {(userRoles.includes("Admin") || userRoles.includes("Editor")) && (
          <button 
            className="btn-secondary"
            onClick={() => setDebugLoading(true)}
          >
            🔧 Testar Tela de Conexão
          </button>
        )}
      </div>

      <div className="telemetry-grid">
        {telemetryData.map((m) => (
          <div key={m.equipmentId} className={`telemetry-card ${m.overallStatus.toLowerCase()}`}>
            <div className="card-header">
              <h3>{m.equipmentId}</h3>
              <span className={`indicator ${m.overallStatus.toLowerCase()}`}></span>
            </div>
            <div className="metrics">
              <div className="metric">
                <label>Hélio</label>
                <span className={m.magnetHeliumLevelPercentage < 40 ? "text-danger" : ""}>
                  {m.magnetHeliumLevelPercentage}%
                </span>
              </div>
              <div className="metric">
                <label>Temp. CPU</label>
                <span>{m.hostCpuTemperatureCelsius}°C</span>
              </div>
              <div className="metric">
                <label>Chiller</label>
                <span>{m.chillerWaterFlowLpm} LPM</span>
              </div>
              <div className="metric">
                <label>Status Comp.</label>
                <span className={m.magnetCompressorStatus === "Fault" ? "text-danger" : ""}>
                  {m.magnetCompressorStatus}
                </span>
              </div>
            </div>
            <div className="timestamp">
              Última atualização: {new Date(m.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {criticalAlert && (
        <div className="modal-backdrop alert-critical">
          <div className="modal">
            <h3 style={{ color: "var(--danger)", marginTop: 0 }}>⚠️ ALERTA CRÍTICO DE SISTEMA</h3>
            <p style={{ color: "var(--muted)", margin: "16px 0" }}>
              O equipamento <strong style={{ color: "var(--text)" }}>{criticalAlert.equipmentId}</strong> reportou uma falha grave!
            </p>
            <div className="alert-details" style={{ background: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
              <p style={{ margin: "4px 0", color: "#fca5a5" }}><strong>Status:</strong> {criticalAlert.overallStatus}</p>
              <p style={{ margin: "4px 0", color: "#fca5a5" }}><strong>Compressor:</strong> {criticalAlert.magnetCompressorStatus}</p>
            </div>
            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                className="btn-secondary" 
                style={{ borderColor: "rgba(239, 68, 68, 0.5)", color: "#fca5a5" }}
                onClick={() => setCriticalAlert(null)}
              >
                Ciente / Silenciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}