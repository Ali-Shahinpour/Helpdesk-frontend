// Mock API backed by localStorage. Swap this single file with a real fetch
// client pointing at the ASP.NET Core API in /backend — same function signatures.
import type {
  User, Role, Department, Ticket, TicketStatus, TicketPriority,
  TicketCategory, Comment, Attachment, ActivityEvent, AuthResponse,
} from "@/types";

const K = {
  users: "hd_users",
  departments: "hd_departments",
  tickets: "hd_tickets",
  comments: "hd_comments",
  attachments: "hd_attachments",
  activity: "hd_activity",
  session: "hd_session",
  passwords: "hd_passwords",
  resetTokens: "hd_reset_tokens",
  seeded: "hd_seeded_v1",
};

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const read = <T>(k: string, fallback: T): T => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fallback; }
  catch { return fallback; }
};
const write = <T>(k: string, v: T) => localStorage.setItem(k, JSON.stringify(v));

function seed() {
  if (localStorage.getItem(K.seeded)) return;
  const adminId = uid(), mgrId = uid(), agent1 = uid(), agent2 = uid(), cust1 = uid(), cust2 = uid();
  const techDept = { id: uid(), name: "Technical Support", description: "Product & technical issues", createdAt: now() };
  const billingDept = { id: uid(), name: "Billing", description: "Invoices & payments", createdAt: now() };
  const users: User[] = [
    { id: adminId, email: "admin@helix.dev", fullName: "Ada Admin", role: "Admin", isActive: true, createdAt: now() },
    { id: mgrId, email: "manager@helix.dev", fullName: "Mark Manager", role: "Manager", departmentId: techDept.id, isActive: true, createdAt: now() },
    { id: agent1, email: "agent@helix.dev", fullName: "Anya Agent", role: "Agent", departmentId: techDept.id, isActive: true, createdAt: now() },
    { id: agent2, email: "agent2@helix.dev", fullName: "Ben Agent", role: "Agent", departmentId: billingDept.id, isActive: true, createdAt: now() },
    { id: cust1, email: "customer@helix.dev", fullName: "Cara Customer", role: "Customer", isActive: true, createdAt: now() },
    { id: cust2, email: "customer2@helix.dev", fullName: "Cory Customer", role: "Customer", isActive: true, createdAt: now() },
  ];
  const passwords: Record<string, string> = Object.fromEntries(users.map(u => [u.email, "Passw0rd!"]));
  const tickets: Ticket[] = [
    { id: uid(), number: "TKT-1001", subject: "Cannot log in to dashboard", description: "Getting 500 error on login.", status: "Open", priority: "High", category: "Technical", customerId: cust1, assignedAgentId: agent1, departmentId: techDept.id, createdAt: now(), updatedAt: now() },
    { id: uid(), number: "TKT-1002", subject: "Invoice double charge", description: "Charged twice for May.", status: "InProgress", priority: "Urgent", category: "Billing", customerId: cust2, assignedAgentId: agent2, departmentId: billingDept.id, createdAt: now(), updatedAt: now() },
    { id: uid(), number: "TKT-1003", subject: "Feature: dark mode export", description: "Please add dark export.", status: "New", priority: "Low", category: "FeatureRequest", customerId: cust1, departmentId: techDept.id, createdAt: now(), updatedAt: now() },
    { id: uid(), number: "TKT-1004", subject: "Password reset email never arrives", description: "Tried 3 times.", status: "Resolved", priority: "Medium", category: "Account", customerId: cust2, assignedAgentId: agent1, departmentId: techDept.id, createdAt: now(), updatedAt: now() },
  ];
  write(K.users, users);
  write(K.departments, [techDept, billingDept]);
  write(K.tickets, tickets);
  write(K.comments, []);
  write(K.attachments, []);
  write(K.activity, tickets.map<ActivityEvent>(t => ({ id: uid(), ticketId: t.id, actorId: t.customerId, type: "created", createdAt: t.createdAt })));
  write(K.passwords, passwords);
  localStorage.setItem(K.seeded, "1");
}

if (typeof window !== "undefined") seed();

const delay = (ms = 220) => new Promise(r => setTimeout(r, ms));

// ----- Auth -----
export const api = {
  async login(email: string, password: string): Promise<AuthResponse> {
    await delay();
    const users = read<User[]>(K.users, []);
    const passwords = read<Record<string, string>>(K.passwords, {});
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || passwords[user.email] !== password) throw new Error("Invalid email or password");
    if (!user.isActive) throw new Error("Account disabled");
    const resp = { accessToken: `mock.${user.id}.${Date.now()}`, refreshToken: `refresh.${user.id}.${Date.now()}`, user };
    write(K.session, resp);
    return resp;
  },
  async register(input: { email: string; fullName: string; password: string }): Promise<AuthResponse> {
    await delay();
    const users = read<User[]>(K.users, []);
    if (users.some(u => u.email.toLowerCase() === input.email.toLowerCase())) throw new Error("Email already registered");
    const user: User = { id: uid(), email: input.email, fullName: input.fullName, role: "Customer", isActive: true, createdAt: now() };
    users.push(user); write(K.users, users);
    const passwords = read<Record<string, string>>(K.passwords, {});
    passwords[user.email] = input.password; write(K.passwords, passwords);
    const resp = { accessToken: `mock.${user.id}.${Date.now()}`, refreshToken: `refresh.${user.id}.${Date.now()}`, user };
    write(K.session, resp);
    return resp;
  },
  async logout(): Promise<void> { localStorage.removeItem(K.session); },
  async me(): Promise<User | null> {
    const s = read<AuthResponse | null>(K.session, null);
    return s?.user ?? null;
  },
  async refresh(): Promise<AuthResponse | null> {
    const s = read<AuthResponse | null>(K.session, null);
    if (!s) return null;
    const resp = { ...s, accessToken: `mock.${s.user.id}.${Date.now()}` };
    write(K.session, resp); return resp;
  },
  async forgotPassword(email: string): Promise<{ token: string }> {
    await delay();
    const token = uid();
    const map = read<Record<string, string>>(K.resetTokens, {});
    map[token] = email; write(K.resetTokens, map);
    return { token };
  },
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await delay();
    const map = read<Record<string, string>>(K.resetTokens, {});
    const email = map[token];
    if (!email) throw new Error("Invalid or expired token");
    const passwords = read<Record<string, string>>(K.passwords, {});
    passwords[email] = newPassword; write(K.passwords, passwords);
    delete map[token]; write(K.resetTokens, map);
  },

  // ----- Users -----
  async listUsers(): Promise<User[]> { await delay(); return read<User[]>(K.users, []); },
  async createUser(input: Omit<User, "id" | "createdAt"> & { password: string }): Promise<User> {
    await delay();
    const users = read<User[]>(K.users, []);
    if (users.some(u => u.email.toLowerCase() === input.email.toLowerCase())) throw new Error("Email exists");
    const { password, ...rest } = input;
    const user: User = { ...rest, id: uid(), createdAt: now() };
    users.push(user); write(K.users, users);
    const pw = read<Record<string, string>>(K.passwords, {}); pw[user.email] = password; write(K.passwords, pw);
    return user;
  },
  async updateUser(id: string, patch: Partial<User>): Promise<User> {
    await delay();
    const users = read<User[]>(K.users, []);
    const i = users.findIndex(u => u.id === id);
    if (i < 0) throw new Error("Not found");
    users[i] = { ...users[i], ...patch };
    write(K.users, users);
    // update session if self
    const s = read<AuthResponse | null>(K.session, null);
    if (s && s.user.id === id) { s.user = users[i]; write(K.session, s); }
    return users[i];
  },
  async deleteUser(id: string): Promise<void> {
    await delay();
    write(K.users, read<User[]>(K.users, []).filter(u => u.id !== id));
  },

  // ----- Departments -----
  async listDepartments(): Promise<Department[]> { await delay(); return read<Department[]>(K.departments, []); },
  async createDepartment(input: { name: string; description?: string }): Promise<Department> {
    await delay();
    const d: Department = { id: uid(), name: input.name, description: input.description, createdAt: now() };
    const all = read<Department[]>(K.departments, []); all.push(d); write(K.departments, all); return d;
  },
  async updateDepartment(id: string, patch: Partial<Department>): Promise<Department> {
    await delay();
    const all = read<Department[]>(K.departments, []);
    const i = all.findIndex(d => d.id === id);
    if (i < 0) throw new Error("Not found");
    all[i] = { ...all[i], ...patch }; write(K.departments, all); return all[i];
  },
  async deleteDepartment(id: string): Promise<void> {
    await delay();
    write(K.departments, read<Department[]>(K.departments, []).filter(d => d.id !== id));
  },

  // ----- Tickets -----
  async listTickets(filter?: { status?: TicketStatus; assignedAgentId?: string; customerId?: string; q?: string }): Promise<Ticket[]> {
    await delay();
    let t = read<Ticket[]>(K.tickets, []);
    if (filter?.status) t = t.filter(x => x.status === filter.status);
    if (filter?.assignedAgentId) t = t.filter(x => x.assignedAgentId === filter.assignedAgentId);
    if (filter?.customerId) t = t.filter(x => x.customerId === filter.customerId);
    if (filter?.q) {
      const q = filter.q.toLowerCase();
      t = t.filter(x => x.subject.toLowerCase().includes(q) || x.number.toLowerCase().includes(q));
    }
    return t.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getTicket(id: string): Promise<Ticket> {
    await delay();
    const t = read<Ticket[]>(K.tickets, []).find(x => x.id === id);
    if (!t) throw new Error("Ticket not found"); return t;
  },
  async createTicket(input: { subject: string; description: string; priority: TicketPriority; category: TicketCategory; customerId: string; departmentId?: string }): Promise<Ticket> {
    await delay();
    const all = read<Ticket[]>(K.tickets, []);
    const num = `TKT-${1000 + all.length + 1}`;
    const t: Ticket = { id: uid(), number: num, status: "New", createdAt: now(), updatedAt: now(), ...input };
    all.push(t); write(K.tickets, all);
    addActivity(t.id, input.customerId, "created");
    return t;
  },
  async updateTicket(id: string, patch: Partial<Ticket>, actorId: string): Promise<Ticket> {
    await delay();
    const all = read<Ticket[]>(K.tickets, []);
    const i = all.findIndex(x => x.id === id);
    if (i < 0) throw new Error("Not found");
    const prev = all[i];
    const next = { ...prev, ...patch, updatedAt: now() };
    if (patch.status && patch.status !== prev.status) {
      addActivity(id, actorId, patch.status === "Closed" ? "closed" : "status_changed", { from: prev.status, to: patch.status });
      if (patch.status === "Closed") next.closedAt = now();
      if (prev.status === "Closed" && patch.status !== "Closed") {
        addActivity(id, actorId, "reopened"); next.closedAt = null;
      }
    }
    if (patch.assignedAgentId !== undefined && patch.assignedAgentId !== prev.assignedAgentId) {
      addActivity(id, actorId, "assigned", { to: patch.assignedAgentId });
    }
    all[i] = next; write(K.tickets, all); return next;
  },
  async deleteTicket(id: string): Promise<void> {
    await delay();
    write(K.tickets, read<Ticket[]>(K.tickets, []).filter(x => x.id !== id));
  },

  // ----- Comments -----
  async listComments(ticketId: string): Promise<Comment[]> {
    await delay();
    return read<Comment[]>(K.comments, []).filter(c => c.ticketId === ticketId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async addComment(input: { ticketId: string; authorId: string; body: string; isInternal: boolean }): Promise<Comment> {
    await delay();
    const c: Comment = { id: uid(), createdAt: now(), ...input };
    const all = read<Comment[]>(K.comments, []); all.push(c); write(K.comments, all);
    addActivity(input.ticketId, input.authorId, "commented", { internal: input.isInternal });
    return c;
  },

  // ----- Attachments -----
  async listAttachments(ticketId: string): Promise<Attachment[]> {
    await delay();
    return read<Attachment[]>(K.attachments, []).filter(a => a.ticketId === ticketId);
  },
  async uploadAttachment(input: { ticketId: string; uploadedById: string; file: File }): Promise<Attachment> {
    await delay();
    const url = await fileToDataUrl(input.file);
    const a: Attachment = {
      id: uid(), ticketId: input.ticketId, uploadedById: input.uploadedById,
      fileName: input.file.name, size: input.file.size, contentType: input.file.type || "application/octet-stream",
      url, uploadedAt: now(),
    };
    const all = read<Attachment[]>(K.attachments, []); all.push(a); write(K.attachments, all);
    addActivity(input.ticketId, input.uploadedById, "attachment_added", { fileName: a.fileName });
    return a;
  },
  async deleteAttachment(id: string): Promise<void> {
    await delay();
    write(K.attachments, read<Attachment[]>(K.attachments, []).filter(a => a.id !== id));
  },

  // ----- Activity / Dashboard -----
  async recentActivity(limit = 10): Promise<ActivityEvent[]> {
    await delay();
    return read<ActivityEvent[]>(K.activity, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  },
  async dashboardStats(userId: string, role: Role) {
    await delay();
    const tickets = read<Ticket[]>(K.tickets, []);
    const visible = role === "Customer" ? tickets.filter(t => t.customerId === userId) : tickets;
    return {
      total: visible.length,
      open: visible.filter(t => t.status !== "Closed" && t.status !== "Resolved").length,
      closed: visible.filter(t => t.status === "Closed").length,
      mine: tickets.filter(t => role === "Customer" ? t.customerId === userId : t.assignedAgentId === userId).length,
      byStatus: groupBy(visible, t => t.status),
      byPriority: groupBy(visible, t => t.priority),
    };
  },
};

function addActivity(ticketId: string, actorId: string, type: ActivityEvent["type"], meta?: Record<string, unknown>) {
  const all = read<ActivityEvent[]>(K.activity, []);
  all.push({ id: uid(), ticketId, actorId, type, meta, createdAt: now() });
  write(K.activity, all);
}
function groupBy<T, K extends string>(arr: T[], fn: (x: T) => K): Record<K, number> {
  return arr.reduce((acc, x) => { const k = fn(x); acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<K, number>);
}
function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });
}
