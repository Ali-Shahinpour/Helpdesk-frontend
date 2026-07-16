// SignalR client for real-time ticket & notification updates.
// In mock mode, a local (same-tab) EventTarget stands in for the hub so
// consumers can use the same onSignalR/startSignalR API in both modes.
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { IS_REAL, SIGNALR_URL } from "./config";
import { tokenStore } from "./tokenStore";

let connection: HubConnection | null = null;
const localBus = typeof window !== "undefined" ? new EventTarget() : null;

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
  if (!IS_REAL) {
    if (!localBus) return () => {};
    const listener = (e: Event) => handler((e as CustomEvent<T>).detail);
    localBus.addEventListener(event, listener as EventListener);
    return () => localBus.removeEventListener(event, listener as EventListener);
  }
  if (!connection) return () => {};
  connection.on(event, handler);
  return () => connection?.off(event, handler);
}

// Used only by the mock API to simulate a hub push within the same tab.
export function emitLocal<T = unknown>(event: string, payload: T) {
  if (IS_REAL || !localBus) return;
  localBus.dispatchEvent(new CustomEvent(event, { detail: payload }));
}
