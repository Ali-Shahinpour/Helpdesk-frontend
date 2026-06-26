// SignalR client for real-time ticket & notification updates.
// In mock mode this is a no-op stub.
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { IS_REAL, SIGNALR_URL } from "./config";
import { tokenStore } from "./tokenStore";

let connection: HubConnection | null = null;

export async function startSignalR(): Promise<HubConnection | null> {
  if (!IS_REAL) return null;
  if (connection && connection.state !== HubConnectionState.Disconnected) return connection;

  connection = new HubConnectionBuilder()
    .withUrl(SIGNALR_URL, { accessTokenFactory: () => tokenStore.get() ?? "" })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  try { await connection.start(); } catch (e) { console.warn("[signalr] start failed", e); }
  return connection;
}

export async function stopSignalR() {
  if (connection) { await connection.stop(); connection = null; }
}

export function onSignalR<T = unknown>(event: string, handler: (payload: T) => void): () => void {
  if (!connection) return () => {};
  connection.on(event, handler);
  return () => connection?.off(event, handler);
}
