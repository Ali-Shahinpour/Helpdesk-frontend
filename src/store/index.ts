import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
}

const initialAuth: AuthState = (() => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("hd_session") : null;
    if (raw) { const s = JSON.parse(raw); return { user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, hydrated: true }; }
  } catch {}
  return { user: null, accessToken: null, refreshToken: null, hydrated: true };
})();

const authSlice = createSlice({
  name: "auth",
  initialState: initialAuth,
  reducers: {
    setAuth(state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    updateProfile(state, action: PayloadAction<User>) { state.user = action.payload; },
    clearAuth(state) { state.user = null; state.accessToken = null; state.refreshToken = null; },
  },
});

interface UiState { sidebarCollapsed: boolean; theme: "light" | "dark"; }
const uiSlice = createSlice({
  name: "ui",
  initialState: { sidebarCollapsed: false, theme: "light" } as UiState,
  reducers: {
    toggleSidebar(s) { s.sidebarCollapsed = !s.sidebarCollapsed; },
    setTheme(s, a: PayloadAction<"light" | "dark">) { s.theme = a.payload; },
  },
});

export const { setAuth, clearAuth, updateProfile } = authSlice.actions;
export const { toggleSidebar, setTheme } = uiSlice.actions;

export const store = configureStore({
  reducer: { auth: authSlice.reducer, ui: uiSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
