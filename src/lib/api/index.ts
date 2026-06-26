// Single import surface. App code does: import { api } from "@/lib/api";
// VITE_API_MODE picks between localStorage mock and real ASP.NET Core API.
import { IS_REAL } from "./config";
import { api as mockApi } from "./mockApi";
import { realApi } from "./realApi";

export const api = IS_REAL ? realApi : mockApi;
export { IS_REAL, IS_MOCK, API_MODE, API_BASE_URL, SIGNALR_URL } from "./config";
export { tokenStore } from "./tokenStore";
