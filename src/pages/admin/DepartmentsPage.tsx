import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Building2 } from "lucide-react";
import type { Department } from "@/types";

const schema = z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(280).optional() });
type V = z.infer<typeof schema>;

export default function DepartmentsPage() {
  const me = useAppSelector(s => s.auth.user!);
  const qc = useQueryClient();
  const dq = useQuery({ queryKey: ["departments"], queryFn: () => api.listDepartments() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  if (me.role !== "Admin" && me.role !== "Manager") return <Navigate to="/" replace />;

  const create = useMutation({ mutationFn: (v: V) => api.createDepartment(v), onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); toast.success("Created"); setOpen(false); } });
  const update = useMutation({ mutationFn: ({ id, v }: { id: string; v: V }) => api.updateDepartment(id, v), onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); toast.success("Updated"); setEditing(null); } });
  const del = useMutation({ mutationFn: (id: string) => api.deleteDepartment(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); toast.success("Deleted"); } });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Admin</div><h1 className="text-3xl font-display font-bold mt-1">Departments</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1" />New department</Button></DialogTrigger>
          <DeptDialog title="Create department" onSubmit={v => create.mutate(v)} />
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(dq.data ?? []).map(d => (
          <Card key={d.id} className="p-5 group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><Building2 className="h-5 w-5" /></div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditing(d)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => confirm(`Delete ${d.name}?`) && del.mutate(d.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <h3 className="font-display font-semibold mt-4">{d.name}</h3>
            {d.description && <p className="text-sm text-muted-foreground mt-1">{d.description}</p>}
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        {editing && <DeptDialog title="Edit department" defaults={editing} onSubmit={v => update.mutate({ id: editing.id, v })} />}
      </Dialog>
    </div>
  );
}

function DeptDialog({ title, defaults, onSubmit }: { title: string; defaults?: Department; onSubmit: (v: V) => void }) {
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { name: defaults?.name || "", description: defaults?.description || "" } });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2"><Label>Name</Label><Input {...form.register("name")} />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
        <div className="space-y-2"><Label>Description</Label><Textarea rows={3} {...form.register("description")} /></div>
        <DialogFooter><Button type="submit" className="bg-gradient-primary text-primary-foreground">Save</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
