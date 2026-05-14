import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useProfile } from "@/lib/profile-hooks";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { data: profile, isLoading: profileLoading } = useProfile();
  useRealtimeSync(user?.id);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (user && profile && !profile.onboarded && pathname !== "/onboarding") {
      nav({ to: "/onboarding" });
    }
  }, [user, profile, pathname, nav]);

  if (loading || !user || profileLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Onboarding renders without the shell for full-screen focus
  if (pathname === "/onboarding") {
    return <Outlet />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
