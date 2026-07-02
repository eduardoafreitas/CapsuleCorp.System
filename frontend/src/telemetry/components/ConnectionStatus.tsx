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
  return (
    <span className={`connection-status ${state}`}>
      {connectionLabels[state]}
    </span>
  );
}
