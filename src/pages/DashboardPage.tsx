import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, CheckCircle2, Clock, User as UserIcon, ArrowRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const activityIcon: Record<string, string> = {
  created: "📝", assigned: "👤", status_changed: "🔄", commented: "💬", attachment_added: "📎", closed: "✅", reopened: "🔁",
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAppSelector(s => s.auth.user!);
  const stats = useQuery({ queryKey: ["dashboard", user.id], queryFn: () => api.dashboardStats(user.id, user.role) });
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => api.recentActivity(8) });
  const recentTickets = useQuery({ queryKey: ["tickets", "recent"], queryFn: () => api.listTickets() });
  const users = useQuery({ queryKey: ["users"], queryFn: () => api.listUsers() });

  const userMap = new Map((users.data ?? []).map(u => [u.id, u]));
  const ticketMap = new Map((recentTickets.data ?? []).map(t => [t.id, t]));

  const cards = [
    { label: t("dashboard.cards.openTickets"), value: stats.data?.open ?? 0, icon: Ticket, tone: "bg-info/10 text-info" },
    { label: t("dashboard.cards.closedTickets"), value: stats.data?.closed ?? 0, icon: CheckCircle2, tone: "bg-success/10 text-success" },
    { label: user.role === "Customer" ? t("dashboard.cards.myTickets") : t("dashboard.cards.assignedToMe"), value: stats.data?.mine ?? 0, icon: UserIcon, tone: "bg-primary/10 text-primary" },
    { label: t("dashboard.cards.total"), value: stats.data?.total ?? 0, icon: Activity, tone: "bg-accent/10 text-accent-foreground" },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("dashboard.eyebrow")}</div>
        <h1 className="text-3xl font-display font-bold mt-1">{t("dashboard.welcome", { name: user.fullName.split(" ")[0] })}</h1>
        <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={cn("h-10 w-10 rounded-lg grid place-items-center", c.tone)}><c.icon className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 text-3xl font-display font-bold tracking-tight">{c.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">{t("dashboard.recentTickets.title")}</h2>
            <Link to="/tickets" className="text-sm text-primary hover:underline flex items-center gap-1">{t("dashboard.recentTickets.viewAll")} <ArrowRight className="h-3 w-3 rtl:rotate-180" /></Link>
          </div>
          <div className="divide-y">
            {(recentTickets.data ?? []).slice(0, 6).map(ticket => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="flex items-center justify-between py-3 hover:bg-muted/30 -mx-2 px-2 rounded">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{ticket.number}</span>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <div className="font-medium truncate mt-1">{ticket.subject}</div>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display font-semibold mb-4">{t("dashboard.recentActivity.title")}</h2>
          <div className="space-y-3">
            {(activity.data ?? []).map(e => {
              const actor = userMap.get(e.actorId);
              const ticket = ticketMap.get(e.ticketId);
              return (
                <div key={e.id} className="flex gap-3 text-sm">
                  <div className="text-lg leading-none">{activityIcon[e.type]}</div>
                  <div className="min-w-0 flex-1">
                    <div><span className="font-medium">{actor?.fullName || t("dashboard.recentActivity.someone")}</span> <span className="text-muted-foreground">{t(`dashboard.activityTypes.${e.type}`, { defaultValue: e.type.replace("_", " ") })}</span> {ticket && <Link to={`/tickets/${ticket.id}`} className="text-primary hover:underline font-mono text-xs">{ticket.number}</Link>}</div>
                    <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}</div>
                  </div>
                </div>
              );
            })}
            {!(activity.data ?? []).length && <p className="text-sm text-muted-foreground">{t("dashboard.recentActivity.empty")}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    New: "bg-info/15 text-info border-info/20",
    Open: "bg-primary/15 text-primary border-primary/20",
    InProgress: "bg-warning/15 text-warning-foreground border-warning/20",
    Resolved: "bg-success/15 text-success border-success/20",
    Closed: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={cn("text-[10px] font-medium", map[status])}>{status === "InProgress" ? "In Progress" : status}</Badge>;
}
export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    Low: "bg-muted text-muted-foreground", Medium: "bg-info/15 text-info",
    High: "bg-warning/15 text-warning-foreground", Urgent: "bg-destructive/15 text-destructive",
  };
  return <Badge variant="outline" className={cn("text-[10px] font-medium border-transparent", map[priority])}>{priority}</Badge>;
}
