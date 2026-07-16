import { Ticket, UserPlus, MessageSquare, RefreshCw, Bell } from "lucide-react";
import type { NotificationType } from "@/types";

const ICONS: Record<string, typeof Bell> = {
  TicketCreated: Ticket,
  TicketUpdated: RefreshCw,
  TicketAssigned: UserPlus,
  CommentAdded: MessageSquare,
};

export function getNotificationIcon(type: NotificationType) {
  return ICONS[type] ?? Bell;
}
