import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TABLES = [
  "profiles", "tasks", "task_completions", "goals", "milestones", "chat_messages",
  "workouts", "workout_exercises", "exercises",
  "sleep_logs", "mood_logs", "journal_entries", "body_logs", "daily_tips",
] as const;

/**
 * Subscribes to all user-scoped tables and invalidates React Query caches.
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
          qc.invalidateQueries({ queryKey: ["muscle-map"] });
        },
      );
    }
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);
}
