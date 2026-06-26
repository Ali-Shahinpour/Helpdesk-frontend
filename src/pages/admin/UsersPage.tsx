import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil } from "lucide-react";
import type { Role, User } from "@/types";
import { Navigate } from "react-router-dom";

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  role: z.enum(["Admin", "Manager", "Agent", "Customer"]),
  departmentId: z.string().optional(),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  isActive: z.boolean(),
});
type V = z.infer<typeof schema>;

export default function UsersPage() {
  const me = useAppSelector(s => s.auth.user!);
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["users"], queryFn: () => api.listUsers() });
  const departments = useQuery({ queryKey: ["departments"], queryFn: () => api.listDepartments() });
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  if (me.role !== "Admin" && me.role !== "Manager") return <Navigate to="/" replace />;

  const create = useMutation({
    mutationFn: (v: V) => api.createUser({ ...v, password: v.password || "Passw0rd!" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User created"); setOpen(false); },
    onError: e => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<User> }) => api.updateUser(id, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User updated"); setEditing(null); },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Deleted"); },
  });

  const deptMap = new Map((departments.data ?? []).map(d => [d.id, d.name]));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Admin</div>
          <h1 className="text-3xl font-display font-bold mt-1">Users</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1" />New user</Button></DialogTrigger>
          <UserDialog title="Create user" departments={departments.data ?? []} onSubmit={v => create.mutate(v)} />
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
          <TableBody>
            {(users.data ?? []).map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                <TableCell className="text-sm">{u.departmentId ? deptMap.get(u.departmentId) : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>{u.isActive ? <Badge className="bg-success/15 text-success border-success/20" variant="outline">Active</Badge> : <Badge variant="outline">Disabled</Badge>}</TableCell>
                <TableCell><div className="flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(u)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirm(`Delete ${u.fullName}?`) && del.mutate(u.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        {editing && <UserDialog title="Edit user" departments={departments.data ?? []} defaults={editing} onSubmit={v => { const { password, ...rest } = v; update.mutate({ id: editing.id, patch: { ...rest, departmentId: rest.departmentId || null } }); }} />}
      </Dialog>
    </div>
  );
}

function UserDialog({ title, defaults, departments, onSubmit }: { title: string; defaults?: User; departments: { id: string; name: string }[]; onSubmit: (v: V) => void }) {
  const form = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: defaults?.fullName || "", email: defaults?.email || "", role: defaults?.role || "Agent", departmentId: defaults?.departmentId || "", isActive: defaults?.isActive ?? true, password: "" },
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2"><Label>Full name</Label><Input {...form.register("fullName")} />{form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}</div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" {...form.register("email")} />{form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Role</Label>
            <Select value={form.watch("role")} onValueChange={v => form.setValue("role", v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Admin","Manager","Agent","Customer"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Department</Label>
            <Select value={form.watch("departmentId") || "none"} onValueChange={v => form.setValue("departmentId", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">None</SelectItem>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2"><Label>Password {defaults && <span className="text-xs text-muted-foreground">(leave blank to keep)</span>}</Label><Input type="password" {...form.register("password")} placeholder="Min 8 characters" /></div>
        <div className="flex items-center justify-between rounded-lg border p-3"><div><div className="text-sm font-medium">Active</div><div className="text-xs text-muted-foreground">User can sign in</div></div>
          <Switch checked={form.watch("isActive")} onCheckedChange={v => form.setValue("isActive", v)} />
        </div>
        <DialogFooter><Button type="submit" className="bg-gradient-primary text-primary-foreground">Save</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
