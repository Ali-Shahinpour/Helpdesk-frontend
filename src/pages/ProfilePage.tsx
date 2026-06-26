import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppDispatch, useAppSelector, updateProfile } from "@/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const schema = z.object({ fullName: z.string().trim().min(2).max(100), email: z.string().trim().email().max(255) });
type V = z.infer<typeof schema>;

export default function ProfilePage() {
  const user = useAppSelector(s => s.auth.user!);
  const dispatch = useAppDispatch();
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { fullName: user.fullName, email: user.email } });
  const m = useMutation({
    mutationFn: (v: V) => api.updateUser(user.id, v),
    onSuccess: (u) => { dispatch(updateProfile(u)); toast.success("Profile updated"); },
    onError: e => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const initials = user.fullName.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="max-w-3xl space-y-6">
      <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Account</div><h1 className="text-3xl font-display font-bold mt-1">Your profile</h1></div>
      <Card className="p-6">
        <div className="flex items-center gap-4 pb-6 border-b">
          <Avatar className="h-20 w-20"><AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-display">{initials}</AvatarFallback></Avatar>
          <div>
            <div className="text-xl font-display font-semibold">{user.fullName}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <Badge variant="secondary" className="mt-2">{user.role}</Badge>
          </div>
        </div>
        <form onSubmit={form.handleSubmit(v => m.mutate(v))} className="space-y-4 pt-6">
          <div className="space-y-2"><Label>Full name</Label><Input {...form.register("fullName")} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
          <div className="flex justify-end"><Button type="submit" disabled={m.isPending} className="bg-gradient-primary text-primary-foreground shadow-glow">{m.isPending ? "Saving…" : "Save changes"}</Button></div>
        </form>
      </Card>
    </div>
  );
}
