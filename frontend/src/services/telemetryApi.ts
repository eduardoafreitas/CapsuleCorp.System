import { headers } from "./api";
import type { Telemetry } from "../telemetry/types";

const MONITOR_API_URL = import.meta.env.VITE_MONITOR_API_URL ?? "https://localhost:6001";

type TelemetryHistoryResponse = {
  data?: Telemetry[];
  Data?: Telemetry[];
};

export async function getRecentTelemetry(pageSize = 100) {
  const res = await fetch(`${MONITOR_API_URL}/api/telemetria?page=1&pageSize=${pageSize}`, {
    method: "GET",
    headers: headers()
  });

  if (!res.ok) {
    throw new Error("Nao foi possivel carregar o historico de telemetria.");
  }

  const payload = await res.json() as TelemetryHistoryResponse;
  return payload.data ?? payload.Data ?? [];
}
