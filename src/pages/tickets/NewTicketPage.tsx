import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TicketPriority, TicketCategory } from "@/types";

const schema = z.object({
  subject: z.string().trim().min(3, "At least 3 characters").max(160),
  description: z.string().trim().min(10, "At least 10 characters").max(5000),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  category: z.enum(["Technical", "Billing", "Account", "General", "FeatureRequest"]),
  departmentId: z.string().optional(),
});
type V = z.infer<typeof schema>;

export default function NewTicketPage() {
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user!);
  const qc = useQueryClient();
  const departments = useQuery({ queryKey: ["departments"], queryFn: () => api.listDepartments() });
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { subject: "", description: "", priority: "Medium", category: "Technical" } });

  const create = useMutation({
    mutationFn: (v: V) => api.createTicket({ ...v, customerId: user.id, departmentId: v.departmentId || undefined }),
    onSuccess: (t) => { qc.invalidateQueries({ queryKey: ["tickets"] }); toast.success(`Created ${t.number}`); navigate(`/tickets/${t.id}`); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">New ticket</div>
        <h1 className="text-3xl font-display font-bold mt-1">Open a new ticket</h1>
        <p className="text-muted-foreground mt-1">Describe your issue and our team will respond shortly.</p>
      </div>
      <Card className="p-6">
        <form onSubmit={form.handleSubmit(v => create.mutate(v))} className="space-y-5">
          <div className="space-y-2"><Label>Subject</Label><Input {...form.register("subject")} placeholder="Short summary of the issue" />{form.formState.errors.subject && <p className="text-xs text-destructive">{form.formState.errors.subject.message}</p>}</div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Priority</Label>
              <Select value={form.watch("priority")} onValueChange={v => form.setValue("priority", v as TicketPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Low","Medium","High","Urgent"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Category</Label>
              <Select value={form.watch("category")} onValueChange={v => form.setValue("category", v as TicketCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Technical","Billing","Account","General","FeatureRequest"].map(p => <SelectItem key={p} value={p}>{p === "FeatureRequest" ? "Feature Request" : p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Department</Label>
              <Select value={form.watch("departmentId") || ""} onValueChange={v => form.setValue("departmentId", v)}>
                <SelectTrigger><SelectValue placeholder="Auto-route" /></SelectTrigger>
                <SelectContent>{(departments.data ?? []).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={8} {...form.register("description")} placeholder="Provide all the details that will help us help you." />{form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}</div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending} className="bg-gradient-primary text-primary-foreground shadow-glow">{create.isPending ? "Creating…" : "Submit ticket"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
