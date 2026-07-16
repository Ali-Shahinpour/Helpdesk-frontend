import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getNotificationIcon } from "./notificationMeta";
import type { Notification } from "@/types";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isMarkingRead?: boolean;
  isDeleting?: boolean;
  /** Compact rendering for the header dropdown; full rendering for the Notification Center. */
  variant?: "compact" | "full";
}

export function NotificationItem({
  notification: n, onMarkRead, onDelete, isMarkingRead, isDeleting, variant = "full",
}: NotificationItemProps) {
  const Icon = getNotificationIcon(n.type);
  const content = (
    <div className={cn("flex gap-3", !n.isRead && "relative")}>
      <div className={cn(
        "h-8 w-8 shrink-0 rounded-full grid place-items-center",
        n.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("text-sm leading-snug", !n.isRead && "font-medium")}>{n.title}</div>
        {n.body && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>}
        <div className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
      </div>
      {!n.isRead && <span className="absolute top-1 -start-1 h-2 w-2 rounded-full bg-primary" />}
    </div>
  );

  return (
    <div className={cn(
      "group flex items-start gap-2 rounded-lg px-2 py-2.5 hover:bg-muted/50 transition-colors",
      variant === "full" && "px-3",
    )}>
      {n.ticketId ? (
        <Link to={`/tickets/${n.ticketId}`} className="min-w-0 flex-1" onClick={() => !n.isRead && onMarkRead(n.id)}>
          {content}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{content}</div>
      )}
      <div className={cn("flex items-center gap-1 shrink-0", variant === "compact" && "opacity-0 group-hover:opacity-100 transition-opacity")}>
        {!n.isRead && (
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            title="Mark as read" aria-label="Mark as read"
            disabled={isMarkingRead}
            onClick={() => onMarkRead(n.id)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
          title="Delete" aria-label="Delete notification"
          disabled={isDeleting}
          onClick={() => onDelete(n.id)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
