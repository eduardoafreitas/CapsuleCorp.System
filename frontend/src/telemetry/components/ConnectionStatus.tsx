import { Icon } from "../../components/Icon";

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "offline";

const connectionLabels: Record<ConnectionState, string> = {
  connecting: "Conectando",
  connected: "Tempo real ativo",
  reconnecting: "Reconectando",
  offline: "Offline"
};

type ConnectionStatusProps = {
  state: ConnectionState;
};

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const iconName = state === "offline" ? "wifiOff" : "wifi";

  return (
    <span className={`connection-status ${state}`}>
      <Icon name={iconName} size={16} />
      {connectionLabels[state]}
    </span>
  );
}
