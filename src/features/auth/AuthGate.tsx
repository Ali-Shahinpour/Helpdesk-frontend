import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user } = useAppSelector(s => s.auth);
  const location = useLocation();
  useEffect(() => {}, []);
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
