import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./AuthShell";

const schema = z.object({
  password: z.string().min(8, "At least 8 characters").max(128),
  confirm: z.string(),
}).refine(v => v.password === v.confirm, { path: ["confirm"], message: "Passwords must match" });
type V = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  async function onSubmit(v: V) {
    setLoading(true);
    try {
      await api.resetPassword(token, v.password);
      toast.success("Password updated. Please sign in.");
      navigate("/login", { replace: true });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose something secure">
      {!token ? (
        <p className="text-sm text-destructive">Missing reset token. <Link to="/forgot-password" className="underline">Request a new link</Link>.</p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2"><Label>New password</Label><Input type="password" {...form.register("password")} />{form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}</div>
          <div className="space-y-2"><Label>Confirm password</Label><Input type="password" {...form.register("confirm")} />{form.formState.errors.confirm && <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>}</div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">{loading ? "Updating…" : "Update password"}</Button>
        </form>
      )}
    </AuthShell>
  );
}
