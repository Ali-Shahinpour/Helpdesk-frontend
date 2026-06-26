// Centralized API configuration. Toggle data source without touching app code.
//
//   VITE_API_MODE=mock        -> localStorage-backed mock (default, preview-safe)
//   VITE_API_MODE=api         -> real ASP.NET Core Web API
//   VITE_API_BASE_URL=...     -> base URL of the .NET API (default https://localhost:5001/api)
//   VITE_SIGNALR_URL=...      -> SignalR hub URL (default <baseUrl host>/hubs/notifications)

export type ApiMode = "mock" | "api";

const env = import.meta.env;

export const API_MODE: ApiMode =
  (env.VITE_API_MODE as ApiMode) === "api" ? "api" : "mock";

export const API_BASE_URL: string =
  (env.VITE_API_BASE_URL as string | undefined) ?? "https://localhost:5001/api";

export const SIGNALR_URL: string =
  (env.VITE_SIGNALR_URL as string | undefined) ??
  API_BASE_URL.replace(/\/api\/?$/, "") + "/hubs/notifications";

export const IS_MOCK = API_MODE === "mock";
export const IS_REAL = API_MODE === "api";
