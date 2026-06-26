import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAppDispatch, setAuth } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./AuthShell";

const schema = z.object({
  fullName: z.string().trim().min(2, "Name too short").max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "At least 8 characters").max(128),
});
type FormVals = z.infer<typeof schema>;

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const form = useForm<FormVals>({ resolver: zodResolver(schema), defaultValues: { fullName: "", email: "", password: "" } });

  async function onSubmit(v: FormVals) {
    setLoading(true);
    try {
      const res = await api.register(v);
      dispatch(setAuth(res));
      toast.success("Account created");
      navigate("/", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally { setLoading(false); }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start with a free Customer account">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2"><Label>Full name</Label><Input {...form.register("fullName")} />{form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}</div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" {...form.register("email")} />{form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}</div>
        <div className="space-y-2"><Label>Password</Label><Input type="password" {...form.register("password")} />{form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}</div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">{loading ? "Creating…" : "Create account"}</Button>
        <p className="text-sm text-center text-muted-foreground">Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}
