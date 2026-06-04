import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, ListTodo, Sparkles, LogOut, Trophy, User, Dumbbell,
  HeartPulse, Menu, Moon, Ruler,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/tasks", label: "Habits", icon: ListTodo },
  { to: "/wellness", label: "Sleep", icon: Moon },
  { to: "/coach", label: "AI Coach", icon: Sparkles },
  { to: "/goals", label: "Goals", icon: Trophy },
  { to: "/body", label: "Body", icon: Ruler },
  { to: "/profile", label: "Profile", icon: User },
] as const;

// Primary mobile bottom nav per request: Dashboard, Workouts, Sleep, Habits, AI Coach
const mobilePrimary = ["/dashboard", "/workouts", "/wellness", "/tasks", "/coach"];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex flex-col w-64 p-5 sticky top-0 h-screen border-r border-border/50">
        <Link to="/dashboard" className="flex items-center gap-2 mb-10 px-2">
          <div className="size-9 rounded-xl bg-success grid place-items-center glow">
            <HeartPulse className="size-5 text-success-foreground" />
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
              <Link key={to} to={to}
                className="relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 min-h-[48px]">
                {active && (
                  <motion.div layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-success"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                )}
                <Icon className={`size-4 relative z-10 ${active ? "text-success-foreground" : "text-muted-foreground"}`} />
                <span className={`relative z-10 ${active ? "text-success-foreground" : ""}`}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="glass rounded-2xl p-3 mt-4 flex items-center gap-3">
          <div className="size-9 rounded-full bg-success grid place-items-center text-sm font-semibold text-success-foreground">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
          <button onClick={signOut} className="p-2 rounded-lg hover:bg-white/5 min-h-[40px] min-w-[40px]" aria-label="Sign out">
            <LogOut className="size-4 text-muted-foreground" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-success grid place-items-center">
            <HeartPulse className="size-4 text-success-foreground" />
          </div>
          <span className="font-display font-bold">Aurora</span>
        </Link>
        <button onClick={signOut} className="p-2 min-h-[44px] min-w-[44px] grid place-items-center" aria-label="Sign out">
          <LogOut className="size-4" />
        </button>
      </div>

      <main className="flex-1 min-w-0 pt-16 md:pt-0 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom nav: 5 primary + More */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass px-1 py-1.5 flex justify-around">
        {nav.filter((n) => mobilePrimary.includes(n.to))
          .sort((a, b) => mobilePrimary.indexOf(a.to) - mobilePrimary.indexOf(b.to))
          .map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link key={to} to={to} className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl flex-1 min-h-[56px]">
              <Icon className={`size-5 ${active ? "text-success" : "text-muted-foreground"}`} />
              <span className={`text-[10px] ${active ? "text-success font-medium" : "text-muted-foreground"}`}>{label}</span>
            </Link>
          );
        })}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl flex-1 min-h-[56px]">
              <Menu className="size-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-card border-t border-border/50 rounded-t-3xl">
            <SheetTitle className="font-display">All Sections</SheetTitle>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {nav.map(({ to, label, icon: Icon }) => {
                const active = pathname.startsWith(to);
                return (
                  <Link key={to} to={to} onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors min-h-[80px] ${
                      active ? "bg-success/15 border-success" : "border-white/10 hover:bg-white/5"
                    }`}>
                    <Icon className={`size-5 ${active ? "text-success" : "text-muted-foreground"}`} />
                    <span className="text-xs">{label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
