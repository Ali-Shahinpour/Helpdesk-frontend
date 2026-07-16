import { Link } from "react-router-dom";
import { Bell, CheckCheck, Loader2, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useNotifications, useUnreadNotificationCount,
  useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification,
} from "@/hooks/useApi";
import { NotificationItem } from "./NotificationItem";

export function NotificationBell() {
  const list = useNotifications(false);
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const del = useDeleteNotification();

  const recent = (list.data ?? []).slice(0, 8);
  const unreadCount = unread.data ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 end-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold grid place-items-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-semibold">Notifications</span>
          <Button
            variant="ghost" size="sm" className="h-7 text-xs gap-1"
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            {markAllRead.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
            Mark all read
          </Button>
        </div>
        <Separator />
        <ScrollArea className="max-h-96">
          <div className="p-1.5">
            {list.isLoading && (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading notifications…</div>
            )}
            {list.isError && (
              <div className="py-10 text-center text-sm text-destructive">Couldn't load notifications.</div>
            )}
            {!list.isLoading && !list.isError && recent.length === 0 && (
              <div className="py-10 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                <BellOff className="h-6 w-6" />
                You're all caught up.
              </div>
            )}
            {recent.map(n => (
              <NotificationItem
                key={n.id}
                notification={n}
                variant="compact"
                onMarkRead={id => markRead.mutate(id)}
                onDelete={id => del.mutate(id)}
                isMarkingRead={markRead.isPending && markRead.variables === n.id}
                isDeleting={del.isPending && del.variables === n.id}
              />
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <Button asChild variant="ghost" className="w-full h-10 rounded-none text-sm">
          <Link to="/notifications">View all notifications</Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
