import { useState } from "react";
import { CheckCheck, Loader2, Trash2, BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useNotifications, useUnreadNotificationCount,
  useMarkNotificationRead, useMarkAllNotificationsRead,
  useDeleteNotification, useDeleteAllReadNotifications,
} from "@/hooks/useApi";
import { NotificationItem } from "@/features/notifications/NotificationItem";

export default function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const unreadOnly = tab === "unread";

  const list = useNotifications(unreadOnly);
  const unreadCount = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const del = useDeleteNotification();
  const deleteAllRead = useDeleteAllReadNotifications();

  const notifications = list.data ?? [];
  const hasReadItems = notifications.some(n => n.isRead);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Notifications</div>
          <h1 className="text-3xl font-display font-bold mt-1">Notification Center</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm" className="gap-1"
            disabled={(unreadCount.data ?? 0) === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            {markAllRead.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
            Mark all read
          </Button>
          <Button
            variant="outline" size="sm" className="gap-1 text-muted-foreground hover:text-destructive"
            disabled={!hasReadItems || deleteAllRead.isPending}
            onClick={() => deleteAllRead.mutate()}
          >
            {deleteAllRead.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Clear read
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as "all" | "unread")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread{(unreadCount.data ?? 0) > 0 ? ` (${unreadCount.data})` : ""}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="p-2">
        {list.isLoading && (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading notifications…</div>
        )}
        {list.isError && (
          <div className="py-16 text-center text-sm text-destructive">
            Couldn't load notifications. Please try again.
          </div>
        )}
        {!list.isLoading && !list.isError && notifications.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <BellOff className="h-8 w-8" />
            {unreadOnly ? "No unread notifications." : "No notifications yet."}
          </div>
        )}
        <div className="divide-y">
          {notifications.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              variant="full"
              onMarkRead={id => markRead.mutate(id)}
              onDelete={id => del.mutate(id)}
              isMarkingRead={markRead.isPending && markRead.variables === n.id}
              isDeleting={del.isPending && del.variables === n.id}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
