import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TABLES = ["profiles", "habits", "habit_logs", "tasks", "goals", "milestones", "chat_messages"] as const;

/**
 * Subscribes to all user-scoped tables and invalidates React Query
 * caches when remote changes happen — gives instant cross-device sync.
 */
export function useRealtimeSync(userId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`sync:${userId}`);
    for (const table of TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: [table] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          qc.invalidateQueries({ queryKey: ["profile"] });
          qc.invalidateQueries({ queryKey: ["goals"] });
        },
      );
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}