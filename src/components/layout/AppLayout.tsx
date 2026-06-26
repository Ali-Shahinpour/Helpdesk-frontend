import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Ticket, Users, Building2, User, LogOut, Plus, Menu, Bell, Search } from "lucide-react";
import { useAppDispatch, useAppSelector, clearAuth, toggleSidebar } from "@/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tickets", label: "Tickets", icon: Ticket },
];
const adminNav = [
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/departments", label: "Departments", icon: Building2 },
];

export function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  const { sidebarCollapsed } = useAppSelector(s => s.ui);
  const isAdmin = user?.role === "Admin" || user?.role === "Manager";

  async function handleLogout() {
    await api.logout();
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  }

  const initials = (user?.fullName || "?").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn("hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all", sidebarCollapsed ? "w-16" : "w-64")}>
        <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center font-display font-bold text-primary-foreground shadow-glow">H</div>
          {!sidebarCollapsed && <div><div className="font-display font-bold text-lg leading-none">Helix</div><div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60 mt-1">Help Desk</div></div>}
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow" : "hover:bg-sidebar-accent text-sidebar-foreground/80")}>
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
          {isAdmin && (
            <>
              {!sidebarCollapsed && <div className="px-3 pt-5 pb-1 text-[10px] uppercase tracking-widest text-sidebar-foreground/40">Admin</div>}
              {adminNav.map(item => (
                <NavLink key={item.to} to={item.to}
                  className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow" : "hover:bg-sidebar-accent text-sidebar-foreground/80")}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          {!sidebarCollapsed ? (
            <div className="rounded-lg bg-sidebar-accent p-3">
              <div className="text-xs text-sidebar-foreground/60">Logged in as</div>
              <div className="text-sm font-medium truncate">{user?.fullName}</div>
              <Badge variant="secondary" className="mt-2 text-[10px]">{user?.role}</Badge>
            </div>
          ) : (
            <Avatar className="h-8 w-8 mx-auto"><AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">{initials}</AvatarFallback></Avatar>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card/60 backdrop-blur flex items-center gap-3 px-4 md:px-6 sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => dispatch(toggleSidebar())} className="hidden md:inline-flex"><Menu className="h-4 w-4" /></Button>
          <div className="flex-1 max-w-md relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tickets, users…" className="pl-9 bg-background/60" />
          </div>
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
            <Link to="/tickets/new"><Plus className="h-4 w-4 mr-1" />New Ticket</Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full p-0 h-9 w-9"><Avatar className="h-9 w-9"><AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-medium">{initials}</AvatarFallback></Avatar></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel><div className="font-medium">{user?.fullName}</div><div className="text-xs text-muted-foreground font-normal">{user?.email}</div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/profile"><User className="h-4 w-4 mr-2" />Profile</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
