import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Paperclip, Trash2, Download, Lock, Send, RefreshCw, Power } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/pages/DashboardPage";
import { formatDistanceToNow } from "date-fns";
import type { TicketStatus } from "@/types";

export default function TicketDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAppSelector(s => s.auth.user!);
  const canManage = user.role !== "Customer";

  const ticket = useQuery({ queryKey: ["ticket", id], queryFn: () => api.getTicket(id) });
  const users = useQuery({ queryKey: ["users"], queryFn: () => api.listUsers() });
  const comments = useQuery({ queryKey: ["comments", id], queryFn: () => api.listComments(id) });
  const attachments = useQuery({ queryKey: ["attachments", id], queryFn: () => api.listAttachments(id) });

  const userMap = new Map((users.data ?? []).map(u => [u.id, u]));
  const agents = (users.data ?? []).filter(u => u.role === "Agent" || u.role === "Manager");

  const update = useMutation({
    mutationFn: (patch: Partial<typeof ticket.data>) => api.updateTicket(id, patch as object, user.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ticket", id] }); qc.invalidateQueries({ queryKey: ["tickets"] }); toast.success("Ticket updated"); },
  });
  const del = useMutation({
    mutationFn: () => api.deleteTicket(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tickets"] }); toast.success("Ticket deleted"); navigate("/tickets"); },
  });

  const [comment, setComment] = useState("");
  const [internal, setInternal] = useState(false);
  const addComment = useMutation({
    mutationFn: () => api.addComment({ ticketId: id, authorId: user.id, body: comment, isInternal: internal && canManage }),
    onSuccess: () => { setComment(""); qc.invalidateQueries({ queryKey: ["comments", id] }); toast.success("Comment added"); },
  });

  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useMutation({
    mutationFn: (file: File) => api.uploadAttachment({ ticketId: id, uploadedById: user.id, file }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attachments", id] }); toast.success("File uploaded"); },
  });
  const delAttach = useMutation({
    mutationFn: (aid: string) => api.deleteAttachment(aid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attachments", id] }),
  });

  if (ticket.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!ticket.data) return <div className="text-muted-foreground">Ticket not found.</div>;
  const t = ticket.data;

  return (
    <div className="max-w-6xl space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Back</button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><span className="font-mono text-sm text-muted-foreground">{t.number}</span><StatusBadge status={t.status} /><PriorityBadge priority={t.priority} /><Badge variant="outline" className="text-[10px]">{t.category}</Badge></div>
          <h1 className="text-3xl font-display font-bold mt-2">{t.subject}</h1>
          <p className="text-sm text-muted-foreground mt-1">Opened by {userMap.get(t.customerId)?.fullName} · {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {t.status === "Closed" ? (
              <Button variant="outline" onClick={() => update.mutate({ status: "Open" })}><RefreshCw className="h-4 w-4 mr-1" />Reopen</Button>
            ) : (
              <Button variant="outline" onClick={() => update.mutate({ status: "Closed" })}><Power className="h-4 w-4 mr-1" />Close</Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete ticket?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate()} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Description</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{t.description}</p>
          </Card>

          <Card className="p-6">
            <Tabs defaultValue="comments">
              <TabsList>
                <TabsTrigger value="comments">Comments ({comments.data?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="attachments">Attachments ({attachments.data?.length ?? 0})</TabsTrigger>
              </TabsList>
              <TabsContent value="comments" className="space-y-4 mt-4">
                {(comments.data ?? []).map(c => {
                  const author = userMap.get(c.authorId);
                  return (
                    <div key={c.id} className={`flex gap-3 p-3 rounded-lg ${c.isInternal ? "bg-warning/5 border border-warning/20" : "bg-muted/30"}`}>
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">{author?.fullName?.[0]}</AvatarFallback></Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{author?.fullName}</span>
                          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                          {c.isInternal && <Badge variant="outline" className="text-[10px] border-warning/30 text-warning-foreground"><Lock className="h-2.5 w-2.5 mr-1" />Internal</Badge>}
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
                      </div>
                    </div>
                  );
                })}
                {!comments.data?.length && <p className="text-sm text-muted-foreground">No comments yet.</p>}
                <div className="space-y-2 pt-3 border-t">
                  <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={internal ? "Internal note — only agents see this" : "Add a public reply…"} rows={3} />
                  <div className="flex items-center justify-between">
                    {canManage ? (
                      <label className="text-sm flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={internal} onChange={e => setInternal(e.target.checked)} className="rounded" />
                        <Lock className="h-3 w-3" /> Internal note
                      </label>
                    ) : <span />}
                    <Button disabled={!comment.trim() || addComment.isPending} onClick={() => addComment.mutate()}><Send className="h-3 w-3 mr-1" />Send</Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="attachments" className="mt-4 space-y-2">
                {(attachments.data ?? []).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3 min-w-0">
                      <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0"><div className="text-sm font-medium truncate">{a.fileName}</div><div className="text-xs text-muted-foreground">{(a.size / 1024).toFixed(1)} KB · {userMap.get(a.uploadedById)?.fullName}</div></div>
                    </div>
                    <div className="flex gap-1">
                      <Button asChild size="icon" variant="ghost"><a href={a.url} download={a.fileName}><Download className="h-4 w-4" /></a></Button>
                      <Button size="icon" variant="ghost" onClick={() => delAttach.mutate(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                {!attachments.data?.length && <p className="text-sm text-muted-foreground">No attachments yet.</p>}
                <input ref={fileInput} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = ""; }} />
                <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={upload.isPending}><Paperclip className="h-4 w-4 mr-1" />Upload file</Button>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Properties</div>
            <div className="space-y-3 text-sm">
              <Field label="Status">
                {canManage ? (
                  <Select value={t.status} onValueChange={v => update.mutate({ status: v as TicketStatus })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{["New","Open","InProgress","Resolved","Closed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                ) : <StatusBadge status={t.status} />}
              </Field>
              <Field label="Priority">
                {canManage ? (
                  <Select value={t.priority} onValueChange={v => update.mutate({ priority: v as typeof t.priority })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Low","Medium","High","Urgent"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                ) : <PriorityBadge priority={t.priority} />}
              </Field>
              <Field label="Assigned agent">
                {canManage ? (
                  <Select value={t.assignedAgentId || "none"} onValueChange={v => update.mutate({ assignedAgentId: v === "none" ? null : v })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">Unassigned</SelectItem>{agents.map(a => <SelectItem key={a.id} value={a.id}>{a.fullName}</SelectItem>)}</SelectContent>
                  </Select>
                ) : <span>{t.assignedAgentId ? userMap.get(t.assignedAgentId)?.fullName : "Unassigned"}</span>}
              </Field>
              <Field label="Customer"><span>{userMap.get(t.customerId)?.fullName}</span></Field>
              <Field label="Category"><span>{t.category}</span></Field>
              <Field label="Created"><span className="text-muted-foreground">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</span></Field>
              {t.closedAt && <Field label="Closed"><span className="text-muted-foreground">{formatDistanceToNow(new Date(t.closedAt), { addSuffix: true })}</span></Field>}
            </div>
          </Card>
          <Card className="p-5 bg-gradient-surface">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Need help?</div>
            <p className="text-sm text-muted-foreground">Read our <Link to="#" className="text-primary hover:underline">support guidelines</Link>.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-3 items-center gap-2"><div className="text-xs text-muted-foreground">{label}</div><div className="col-span-2">{children}</div></div>;
}
