import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendCoachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ message: z.string().min(1).max(4000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    // Save user message
    await supabase.from("chat_messages").insert({ user_id: userId, role: "user", content: data.message });

    // Gather context
    const today = new Date().toISOString().slice(0, 10);
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10);
    const [{ data: habits }, { data: logs }, { data: tasks }, { data: history }] = await Promise.all([
      supabase.from("habits").select("name, category").eq("archived", false),
      supabase.from("habit_logs").select("habit_id, log_date").gte("log_date", since),
      supabase.from("tasks").select("title, priority, completed, due_date").order("created_at", { ascending: false }).limit(20),
      supabase.from("chat_messages").select("role, content").order("created_at", { ascending: false }).limit(10),
    ]);

    const contextSummary = `Today: ${today}
Active habits: ${(habits ?? []).map((h) => h.name).join(", ") || "none"}
Habit completions (last 14 days): ${(logs ?? []).length}
Open tasks: ${(tasks ?? []).filter((t) => !t.completed).map((t) => `${t.title} [${t.priority}]`).join("; ") || "none"}
Completed tasks recently: ${(tasks ?? []).filter((t) => t.completed).length}`;

    const messages = [
      {
        role: "system",
        content: `You are Aurora, a warm, sharp, no-fluff AI life coach. Use the user's data to give personal, specific, actionable advice. Keep replies concise (under 180 words), use markdown, occasional emoji. Never invent data not in context.

USER CONTEXT:
${contextSummary}`,
      },
      ...((history ?? []).reverse().map((m) => ({ role: m.role, content: m.content }))),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Rate limited. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
      throw new Error(`AI error: ${txt.slice(0, 200)}`);
    }

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content ?? "(no reply)";

    await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: reply });
    return { reply };
  });

export const getCoachHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages").select("id, role, content, created_at")
      .order("created_at", { ascending: true }).limit(100);
    if (error) throw error;
    return { messages: data ?? [] };
  });
