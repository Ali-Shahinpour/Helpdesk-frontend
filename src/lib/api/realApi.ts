// Real ASP.NET Core Web API implementation. Matches the mockApi surface 1:1.
import { http } from "./client";
import { tokenStore } from "./tokenStore";
import type {
  User, Department, Ticket, TicketStatus, TicketPriority,
  TicketCategory, Comment, Attachment, ActivityEvent, AuthResponse, Role,
} from "@/types";

async function unwrap<T>(p: Promise<{ data: T }>): Promise<T> {
  return (await p).data;
}

// The backend returns accessToken; refreshToken lives in an httpOnly cookie.
type BackendAuth = { accessToken: string; user: User };
function adoptAuth(a: BackendAuth): AuthResponse {
  tokenStore.set(a.accessToken);
  return { accessToken: a.accessToken, refreshToken: "", user: a.user };
}

export const realApi = {
  // ----- Auth -----
  async login(email: string, password: string) {
    const a = await unwrap<BackendAuth>(http.post("/auth/login", { email, password }));
    return adoptAuth(a);
  },
  async register(input: { email: string; fullName: string; password: string }) {
    const a = await unwrap<BackendAuth>(http.post("/auth/register", input));
    return adoptAuth(a);
  },
  async logout() {
    try { await http.post("/auth/logout"); } finally { tokenStore.clear(); }
  },
  async me(): Promise<User | null> {
    if (!tokenStore.get()) return null;
    try { return await unwrap<User>(http.get("/auth/me")); }
    catch { return null; }
  },
  async refresh(): Promise<AuthResponse | null> {
    const a = await unwrap<BackendAuth>(http.post("/auth/refresh"));
    return adoptAuth(a);
  },
  async forgotPassword(email: string) {
    return unwrap<{ token: string }>(http.post("/auth/forgot-password", { email }));
  },
  async resetPassword(token: string, newPassword: string) {
    await http.post("/auth/reset-password", { token, newPassword });
  },

  // ----- Users -----
  async listUsers() { return unwrap<User[]>(http.get("/users")); },
  async createUser(input: Omit<User, "id" | "createdAt"> & { password: string }) {
    return unwrap<User>(http.post("/users", input));
  },
  async updateUser(id: string, patch: Partial<User>) {
    return unwrap<User>(http.put(`/users/${id}`, patch));
  },
  async deleteUser(id: string) { await http.delete(`/users/${id}`); },

  // ----- Departments -----
  async listDepartments() { return unwrap<Department[]>(http.get("/departments")); },
  async createDepartment(input: { name: string; description?: string }) {
    return unwrap<Department>(http.post("/departments", input));
  },
  async updateDepartment(id: string, patch: Partial<Department>) {
    return unwrap<Department>(http.put(`/departments/${id}`, patch));
  },
  async deleteDepartment(id: string) { await http.delete(`/departments/${id}`); },

  // ----- Tickets -----
  async listTickets(filter?: { status?: TicketStatus; assignedAgentId?: string; customerId?: string; q?: string }) {
    return unwrap<Ticket[]>(http.get("/tickets", { params: filter }));
  },
  async getTicket(id: string) { return unwrap<Ticket>(http.get(`/tickets/${id}`)); },
  async createTicket(input: { subject: string; description: string; priority: TicketPriority; category: TicketCategory; customerId: string; departmentId?: string }) {
    return unwrap<Ticket>(http.post("/tickets", input));
  },
  async updateTicket(id: string, patch: Partial<Ticket>, _actorId: string) {
    return unwrap<Ticket>(http.put(`/tickets/${id}`, patch));
  },
  async deleteTicket(id: string) { await http.delete(`/tickets/${id}`); },

  // ----- Comments -----
  async listComments(ticketId: string) {
    return unwrap<Comment[]>(http.get(`/tickets/${ticketId}/comments`));
  },
  async addComment(input: { ticketId: string; authorId: string; body: string; isInternal: boolean }) {
    return unwrap<Comment>(http.post(`/tickets/${input.ticketId}/comments`, {
      body: input.body, isInternal: input.isInternal,
    }));
  },

  // ----- Attachments -----
  async listAttachments(ticketId: string) {
    return unwrap<Attachment[]>(http.get(`/tickets/${ticketId}/attachments`));
  },
  async uploadAttachment(input: { ticketId: string; uploadedById: string; file: File }) {
    const form = new FormData();
    form.append("file", input.file);
    return unwrap<Attachment>(http.post(`/tickets/${input.ticketId}/attachments`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }));
  },
  async deleteAttachment(id: string) { await http.delete(`/attachments/${id}`); },

  // ----- Activity / Dashboard -----
  async recentActivity(limit = 10) {
    return unwrap<ActivityEvent[]>(http.get("/dashboard/activity", { params: { limit } }));
  },
  async dashboardStats(_userId: string, _role: Role) {
    return unwrap<{
      total: number; open: number; closed: number; mine: number;
      byStatus: Record<string, number>; byPriority: Record<string, number>;
    }>(http.get("/dashboard/stats"));
  },
};
