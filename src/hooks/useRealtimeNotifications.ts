import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { startSignalR, stopSignalR, onSignalR } from "@/lib/api/signalr";
import { qk } from "./useApi";
import type { Notification } from "@/types";

/**
 * Opens the notifications hub connection (or the mock local bus) once and keeps
 * the notifications list / unread count query cache in sync with pushed events.
 * `enabled` should reflect whether the user is currently authenticated.
 */
export function useRealtimeNotifications(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      await startSignalR();
      if (cancelled) return;
      unsubscribe = onSignalR<Notification>("NotificationReceived", (notification) => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
        qc.setQueryData<number>(qk.unreadNotificationCount, (prev) => (prev ?? 0) + 1);
        toast.message(notification.title, {
          description: notification.body ?? undefined,
        });
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled, qc]);

  useEffect(() => {
    if (!enabled) stopSignalR();
  }, [enabled]);
}
