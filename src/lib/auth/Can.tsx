import { ReactNode } from "react";
import { useAppSelector } from "@/store";
import { hasAnyPermission, Permission } from "./permissions";

export function Can({ perm, perms, children, fallback = null }: {
  perm?: Permission; perms?: Permission[]; children: ReactNode; fallback?: ReactNode;
}) {
  const role = useAppSelector((s) => s.auth.user?.role);
  const list = perm ? [perm] : perms ?? [];
  return hasAnyPermission(role, list) ? <>{children}</> : <>{fallback}</>;
}
