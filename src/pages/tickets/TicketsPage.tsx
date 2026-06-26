import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/pages/DashboardPage";
import { formatDistanceToNow } from "date-fns";
import type { TicketStatus } from "@/types";

export default function TicketsPage() {
  const user = useAppSelector(s => s.auth.user!);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [scope, setScope] = useState<"all" | "mine">("all");

  const tickets = useQuery({ queryKey: ["tickets"], queryFn: () => api.listTickets() });
  const users = useQuery({ queryKey: ["users"], queryFn: () => api.listUsers() });
  const userMap = useMemo(() => new Map((users.data ?? []).map(u => [u.id, u])), [users.data]);

  const filtered = useMemo(() => {
    let list = tickets.data ?? [];
    if (user.role === "Customer") list = list.filter(t => t.customerId === user.id);
    else if (scope === "mine") list = list.filter(t => t.assignedAgentId === user.id);
    if (status !== "all") list = list.filter(t => t.status === status);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(t => t.subject.toLowerCase().includes(s) || t.number.toLowerCase().includes(s));
    }
    return list;
  }, [tickets.data, status, scope, q, user]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Tickets</div>
          <h1 className="text-3xl font-display font-bold mt-1">All tickets</h1>
        </div>
        <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow"><Link to="/tickets/new"><Plus className="h-4 w-4 mr-1" />New Ticket</Link></Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search subject or number…" className="pl-9" />
          </div>
          <Select value={status} onValueChange={v => setStatus(v as TicketStatus | "all")}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["New", "Open", "InProgress", "Resolved", "Closed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {user.role !== "Customer" && (
            <Select value={scope} onValueChange={v => setScope(v as "all" | "mine")}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All tickets</SelectItem><SelectItem value="mine">Assigned to me</SelectItem></SelectContent>
            </Select>
          )}
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead>
              <TableHead>Priority</TableHead><TableHead>Customer</TableHead>
              <TableHead>Agent</TableHead><TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => location.assign(`/tickets/${t.id}`)}>
                <TableCell className="font-mono text-xs text-muted-foreground">{t.number}</TableCell>
                <TableCell className="font-medium max-w-md truncate">{t.subject}</TableCell>
                <TableCell><StatusBadge status={t.status} /></TableCell>
                <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                <TableCell className="text-sm">{userMap.get(t.customerId)?.fullName ?? "—"}</TableCell>
                <TableCell className="text-sm">{t.assignedAgentId ? userMap.get(t.assignedAgentId)?.fullName : <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}</TableCell>
              </TableRow>
            ))}
            {!filtered.length && <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No tickets match your filters.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
