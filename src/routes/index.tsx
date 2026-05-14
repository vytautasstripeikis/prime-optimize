import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Target, ListTodo, Brain, ArrowRight, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

const features = [
  { icon: Target, title: "Habit Engine", desc: "Streaks, XP, and gamified daily wins that compound." },
  { icon: ListTodo, title: "Focus Tasks", desc: "Plan, prioritize, and ship — without the busywork." },
  { icon: Brain, title: "AI Life Coach", desc: "Personal insights from your data. 24/7. Real talk." },
  { icon: Zap, title: "Daily Score", desc: "One number that tells you if today moved the needle." },
];

function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center glow">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">Aurora</span>
        </div>
        <Link
          to="/auth"
          className="text-sm px-4 py-2 rounded-xl glass hover:bg-white/10 transition"
        >
          Sign in
        </Link>
      </header>

      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs text-muted-foreground mb-8"
        >
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Powered by Lovable AI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight"
        >
          Your life,<br />
          <span className="text-gradient">optimized by AI.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground"
        >
          Aurora is a calm, gamified operating system for your habits, tasks, and growth — with a personal AI coach that actually knows you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground px-6 py-3.5 rounded-2xl font-medium glow"
          >
            Get started free
            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </motion.div>

        <div className="mt-24 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
              className="glass rounded-2xl p-5 hover:translate-y-[-2px] transition"
            >
              <div className="size-10 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center mb-4">
                <f.icon className="size-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
