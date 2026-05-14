import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, ListTodo, Sparkles, Target, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/habits", label: "Habits", icon: Target },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/coach", label: "AI Coach", icon: Sparkles },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex flex-col w-64 p-5 sticky top-0 h-screen border-r border-border/50">
        <Link to="/dashboard" className="flex items-center gap-2 mb-10 px-2">
          <div className="size-9 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center glow">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">Aurora</div>
            <div className="text-xs text-muted-foreground">Life OS</div>
          </div>
        </Link>
        <nav className="flex-1 flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-[image:var(--gradient-primary)] opacity-90"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`size-4 relative z-10 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <span className={`relative z-10 ${active ? "text-primary-foreground" : ""}`}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="glass rounded-2xl p-3 mt-4 flex items-center gap-3">
          <div className="size-9 rounded-full bg-[image:var(--gradient-primary)] grid place-items-center text-sm font-semibold text-primary-foreground">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
          <button onClick={signOut} className="p-2 rounded-lg hover:bg-white/5" aria-label="Sign out">
            <LogOut className="size-4 text-muted-foreground" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[image:var(--gradient-primary)] grid place-items-center">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold">Aurora</span>
        </Link>
        <button onClick={signOut} className="p-2"><LogOut className="size-4" /></button>
      </div>

      <main className="flex-1 min-w-0 pt-16 md:pt-0 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass px-2 py-2 flex justify-around">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl"
            >
              <Icon className={`size-5 ${active ? "text-primary-glow" : "text-muted-foreground"}`} />
              <span className={`text-[10px] ${active ? "text-primary-glow font-medium" : "text-muted-foreground"}`}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
