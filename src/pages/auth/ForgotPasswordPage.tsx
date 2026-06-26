import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./AuthShell";

const schema = z.object({ email: z.string().trim().email().max(255) });
type V = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(v: V) {
    setLoading(true);
    try {
      const { token } = await api.forgotPassword(v.email);
      setToken(token);
      toast.success("Reset link generated");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <AuthShell title="Forgot password?" subtitle="We'll send you a reset link">
      {!token ? (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2"><Label>Email</Label><Input type="email" {...form.register("email")} />{form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}</div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">{loading ? "Sending…" : "Send reset link"}</Button>
          <p className="text-sm text-center"><Link to="/login" className="text-primary hover:underline">Back to login</Link></p>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">In a real backend an email would be sent. For this mock environment, click below to reset directly:</p>
          <Button asChild className="w-full"><Link to={`/reset-password?token=${token}`}>Continue to reset</Link></Button>
        </div>
      )}
    </AuthShell>
  );
}
