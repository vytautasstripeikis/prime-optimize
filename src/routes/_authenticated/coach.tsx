import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendCoachMessage, getCoachHistory } from "@/lib/coach.functions";

export const Route = createFileRoute("/_authenticated/coach")({
  component: CoachPage,
});

const SUGGESTIONS = [
  "Plan my next 3 days",
  "Why am I losing momentum?",
  "Help me build a morning routine",
];

function CoachPage() {
  const fetchHistory = useServerFn(getCoachHistory);
  const sendMsg = useServerFn(sendCoachMessage);
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["coach-history"],
    queryFn: () => fetchHistory(),
  });

  const mut = useMutation({
    mutationFn: (message: string) => sendMsg({ data: { message } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach-history"] });
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [data, mut.isPending]);

  const submit = () => {
    const msg = input.trim();
    if (!msg || mut.isPending) return;
    setInput("");
    mut.mutate(msg);
  };

  const messages = data?.messages ?? [];

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-6 md:py-10 flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-3rem)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-11 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center glow">
          <Sparkles className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Coach</h1>
          <p className="text-xs text-muted-foreground">Knows your habits, tasks & momentum.</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-5 pr-1">
        {isLoading && (
          <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="glass rounded-3xl p-8 text-center">
            <div className="size-14 mx-auto rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center glow mb-4">
              <Sparkles className="size-6 text-primary-foreground" />
            </div>
            <h2 className="font-display font-semibold text-lg mb-2">Hi, I'm Aurora.</h2>
            <p className="text-sm text-muted-foreground mb-5">Ask me anything about your routines, focus, or goals.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-xs glass rounded-full px-3.5 py-1.5 hover:bg-white/10"
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "user" ? (
              <div className="bg-[image:var(--gradient-primary)] text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] text-sm">
                {m.content}
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap leading-relaxed max-w-[90%]">
                {m.content}
              </div>
            )}
          </motion.div>
        ))}

        {mut.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Aurora is thinking…
          </div>
        )}
      </div>

      <div className="mt-4 glass rounded-2xl p-2 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          rows={1}
          placeholder="Ask Aurora anything…"
          className="flex-1 bg-transparent resize-none outline-none px-3 py-2.5 text-sm max-h-40"
        />
        <button
          onClick={submit}
          disabled={!input.trim() || mut.isPending}
          className="size-10 grid place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground disabled:opacity-50 shrink-0"
        >
          {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>
    </div>
  );
}
