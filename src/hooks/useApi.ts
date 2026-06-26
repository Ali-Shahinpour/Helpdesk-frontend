// Reusable TanStack Query hooks. Backed by api (mock or real) based on VITE_API_MODE.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Ticket, TicketStatus } from "@/types";

export const qk = {
  me: ["me"] as const,
  users: ["users"] as const,
  departments: ["departments"] as const,
  tickets: (filter?: unknown) => ["tickets", filter] as const,
  ticket: (id: string) => ["ticket", id] as const,
  comments: (ticketId: string) => ["comments", ticketId] as const,
  attachments: (ticketId: string) => ["attachments", ticketId] as const,
  activity: (limit: number) => ["activity", limit] as const,
  stats: (userId: string) => ["stats", userId] as const,
};

// ---------- Auth ----------
export const useCurrentUser = () =>
  useQuery({ queryKey: qk.me, queryFn: () => api.me() });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { email: string; password: string }) => api.login(v.email, v.password),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
    onError: (e: Error) => toast.error(e.message || "Login failed"),
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.logout(), onSuccess: () => qc.clear() });
};

// ---------- Users / Departments ----------
export const useUsers = () => useQuery({ queryKey: qk.users, queryFn: () => api.listUsers() });
export const useDepartments = () => useQuery({ queryKey: qk.departments, queryFn: () => api.listDepartments() });

// ---------- Tickets ----------
export const useTickets = (filter?: Parameters<typeof api.listTickets>[0]) =>
  useQuery({ queryKey: qk.tickets(filter), queryFn: () => api.listTickets(filter) });

export const useTicket = (id: string) =>
  useQuery({ queryKey: qk.ticket(id), queryFn: () => api.getTicket(id), enabled: !!id });

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createTicket>[0]) => api.createTicket(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<Ticket>; actorId: string }) =>
      api.updateTicket(v.id, v.patch, v.actorId),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.ticket(v.id) });
      const prev = qc.getQueryData<Ticket>(qk.ticket(v.id));
      if (prev) qc.setQueryData<Ticket>(qk.ticket(v.id), { ...prev, ...v.patch });
      return { prev };
    },
    onError: (e: Error, v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.ticket(v.id), ctx.prev);
      toast.error(e.message);
    },
    onSettled: (_d, _e, v) => {
      qc.invalidateQueries({ queryKey: qk.ticket(v.id) });
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
};

export const useDeleteTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTicket(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
};

// ---------- Comments / Attachments ----------
export const useComments = (ticketId: string) =>
  useQuery({ queryKey: qk.comments(ticketId), queryFn: () => api.listComments(ticketId), enabled: !!ticketId });

export const useAddComment = (ticketId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.addComment>[0]) => api.addComment(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.comments(ticketId) }),
  });
};

export const useAttachments = (ticketId: string) =>
  useQuery({ queryKey: qk.attachments(ticketId), queryFn: () => api.listAttachments(ticketId), enabled: !!ticketId });

export const useUploadAttachment = (ticketId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.uploadAttachment>[0]) => api.uploadAttachment(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.attachments(ticketId) }),
  });
};

// ---------- Dashboard ----------
export const useDashboardStats = (userId: string, role: Parameters<typeof api.dashboardStats>[1]) =>
  useQuery({ queryKey: qk.stats(userId), queryFn: () => api.dashboardStats(userId, role), enabled: !!userId });

export const useRecentActivity = (limit = 10) =>
  useQuery({ queryKey: qk.activity(limit), queryFn: () => api.recentActivity(limit) });

export type { TicketStatus };
