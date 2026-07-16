// Shared domain types for the Help Desk app.
// These match the C# DTOs in /backend so swapping API client requires no UI changes.

export type Role = "Admin" | "Manager" | "Agent" | "Customer";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export type TicketStatus = "New" | "Open" | "InProgress" | "Resolved" | "Closed";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";
export type TicketCategory = "Technical" | "Billing" | "Account" | "General" | "FeatureRequest";

export interface Ticket {
  id: string;
  number: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customerId: string;
  assignedAgentId?: string | null;
  departmentId?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Attachment {
  id: string;
  ticketId: string;
  fileName: string;
  size: number;
  contentType: string;
  url: string;
  uploadedById: string;
  uploadedAt: string;
}

export interface ActivityEvent {
  id: string;
  ticketId: string;
  actorId: string;
  type: "created" | "assigned" | "status_changed" | "commented" | "attachment_added" | "closed" | "reopened";
  meta?: Record<string, unknown>;
  createdAt: string;
}

export type NotificationType = "TicketCreated" | "TicketUpdated" | "TicketAssigned" | "CommentAdded" | string;

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  ticketId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
