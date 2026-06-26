import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAppDispatch, setAuth } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AuthShell } from "./AuthShell";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password is required").max(128),
});
type FormVals = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname: string } } };
  const [loading, setLoading] = useState(false);
  const form = useForm<FormVals>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: FormVals) {
    setLoading(true);
    try {
      const res = await api.login(values.email, values.password);
      dispatch(setAuth(res));
      toast.success(`Welcome back, ${res.user.fullName.split(" ")[0]}`);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Login failed");
    } finally { setLoading(false); }
  }

  function fill(email: string) {
    form.setValue("email", email); form.setValue("password", "Passw0rd!");
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Helix workspace">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
          {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">No account? <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link></p>
      </form>
      <Card className="mt-6 p-4 bg-muted/40 border-dashed">
        <p className="text-xs font-medium mb-2 text-muted-foreground">Demo accounts (password: <code className="font-mono">Passw0rd!</code>)</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[["admin@helix.dev","Admin"],["manager@helix.dev","Manager"],["agent@helix.dev","Agent"],["customer@helix.dev","Customer"]].map(([e,r]) => (
            <button key={e} type="button" onClick={() => fill(e)} className="text-left px-2 py-1.5 rounded hover:bg-background transition-colors">
              <div className="font-medium text-foreground">{r}</div><div className="text-muted-foreground font-mono text-[10px]">{e}</div>
            </button>
          ))}
        </div>
      </Card>
    </AuthShell>
  );
}
