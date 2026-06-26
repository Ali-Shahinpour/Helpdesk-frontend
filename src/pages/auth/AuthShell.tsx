import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Shield, Zap } from "lucide-react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16">
        <Link to="/" className="flex items-center gap-2 mb-12">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center font-display font-bold text-primary-foreground shadow-glow">H</div>
          <span className="font-display font-bold text-xl">Helix</span>
        </Link>
        <div className="max-w-sm w-full mx-auto">
          <h1 className="text-3xl font-display font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="hidden lg:flex relative bg-sidebar text-sidebar-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-accent opacity-30" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sidebar-accent text-xs font-medium w-fit">
            <Sparkles className="h-3 w-3" /> Premium Support OS
          </div>
          <h2 className="mt-6 text-4xl font-display font-bold leading-tight">Support that moves<br />at the speed of trust.</h2>
          <p className="mt-4 text-sidebar-foreground/70 max-w-md">Ship faster with a help desk built for modern teams — tickets, SLAs, internal notes, and real-time collaboration in one place.</p>
          <div className="mt-10 space-y-4">
            {[
              { icon: Zap, t: "Lightning-fast", d: "Sub-100ms ticket actions" },
              { icon: Shield, t: "Role-based access", d: "Admin · Manager · Agent · Customer" },
            ].map(f => (
              <div key={f.t} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-sidebar-accent grid place-items-center shrink-0"><f.icon className="h-4 w-4" /></div>
                <div><div className="font-medium">{f.t}</div><div className="text-sm text-sidebar-foreground/60">{f.d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
