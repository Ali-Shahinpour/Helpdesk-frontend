// Role + permission model. Mirrors backend authorization policies.
import type { Role } from "@/types";

export type Permission =
  | "Ticket.View" | "Ticket.Create" | "Ticket.Edit" | "Ticket.Delete" | "Ticket.Assign"
  | "Comment.Internal"
  | "User.Manage" | "Department.Manage" | "Role.Manage";

const ROLE_PERMS: Record<Role, Permission[]> = {
  Admin: ["Ticket.View","Ticket.Create","Ticket.Edit","Ticket.Delete","Ticket.Assign","Comment.Internal","User.Manage","Department.Manage","Role.Manage"],
  Manager: ["Ticket.View","Ticket.Create","Ticket.Edit","Ticket.Delete","Ticket.Assign","Comment.Internal","Department.Manage"],
  Agent: ["Ticket.View","Ticket.Create","Ticket.Edit","Ticket.Assign","Comment.Internal"],
  Customer: ["Ticket.View","Ticket.Create"],
};

export function permissionsFor(role: Role | undefined | null): Permission[] {
  return role ? ROLE_PERMS[role] : [];
}
export function hasPermission(role: Role | undefined | null, perm: Permission): boolean {
  return permissionsFor(role).includes(perm);
}
export function hasAnyPermission(role: Role | undefined | null, perms: Permission[]): boolean {
  return perms.some((p) => hasPermission(role, p));
}
