import { motion } from "framer-motion";
import { ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";
import { useWallet } from "@/components/WalletContext";
import { useAuth } from "@/components/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLiveStats } from "@/hooks/useLiveStats";

const TERMINAL_LINES = [
  { type: "prompt", text: "$ deployx402 init" },
  { type: "output", text: "◆ DeployX402 v1.0.0" },
  { type: "output", text: "  Connecting to Solana mainnet..." },
  { type: "success", text: "  ✓ Connected (slot: 312,847,291)" },
  { type: "output", text: "  Loading trading engines..." },
  { type: "success", text: "  ✓ Jupiter • Raydium • Pump.fun" },
  { type: "output", text: "" },
  { type: "prompt", text: "$ deployx402 deploy --strategy sniper" },
  { type: "success", text: "  ✓ Agent deployed. Watching for launches..." },
];

function useCountUp(target: number, duration = 1200, loaded = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!loaded || target === 0) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(start);
    }, 16);
    return () => clearInterval(id);
  }, [target, loaded]);
  return val;
}

const HeroSection = () => {
  const { connect, connected } = useWallet();
  const { authenticated } = useAuth();
  const navigate = useNavigate();
  const [lines, setLines] = useState<typeof TERMINAL_LINES>([]);
  const liveStats = useLiveStats();
  const agentsCount = useCountUp(liveStats.totalAgents, 1000, liveStats.loaded);
  const tradesCount = useCountUp(liveStats.totalTrades, 1400, liveStats.loaded);
  const volumeCount = useCountUp(Math.round(liveStats.totalVolumeSol * 100), 1600, liveStats.loaded);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < TERMINAL_LINES.length) {
        const current = i;
        i++;
        setLines((prev) => [...prev, TERMINAL_LINES[current]]);
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const handleCTA = () => {
    if (authenticated || connected) navigate("/dashboard");
    else navigate("/auth");
  };

  return (
    <section id="hero-section" className="relative min-h-screen overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Large background number */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none overflow-hidden">
        <span className="text-[28vw] font-mono font-bold text-foreground/[0.02] leading-none tracking-tighter">
          402
        </span>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-36 pb-24 flex flex-col gap-16">
        {/* Top row: eyebrow + stats */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <span className="h-px w-8 bg-primary/50" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
              Autonomous Trading · Solana
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-6"
          >
            {[
              { value: agentsCount.toString(), label: "Agents" },
              { value: tradesCount.toLocaleString(), label: "Trades" },
              { value: `${(volumeCount / 100).toFixed(1)} SOL`, label: "Volume" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-end">
                <span className="text-sm font-mono font-semibold text-foreground tabular-nums">{s.value}</span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-end">
          {/* Left: headline block */}
          <div className="flex flex-col gap-8">
            {/* ASCII art */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <pre className="ascii-dots text-[9px] sm:text-[11px] leading-tight select-none overflow-x-auto">
{` ___            _           __  __ _  _    ___  ___
|   \\ ___ _ __ | |___ _  _ \\ \\/ /| || |  / _ \\|_  )
| |) / -_) '_ \\| / _ \\ || | >  < | __ | | (_) |/ / 
|___/\\___| .__/|_\\___/\\_, |/_/\\_\\|_||_|  \\___//___|
         |_|          |__/                   agent`}
              </pre>
            </motion.div>

            {/* Big tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="space-y-1"
            >
              <h1 className="text-4xl sm:text-6xl font-mono font-bold tracking-tighter leading-[1.05] text-foreground">
                Deploy.<br />
                <span className="text-primary">Trade.</span><br />
                Automate.
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-sm text-muted-foreground leading-relaxed max-w-sm border-l-2 border-border pl-4"
            >
              Autonomous AI trading infrastructure on Solana. Deploy agents that snipe, trade, and manage memecoins — fully on-chain.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={handleCTA}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-none border border-primary/40 bg-primary/10 text-xs font-mono text-primary hover:bg-primary/20 transition-all"
              >
                <LayoutDashboard className="h-3 w-3" />
                {(authenticated || connected) ? "Platform" : "Launch Platform"}
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/docs")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-none border border-border bg-transparent text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
              >
                <BookOpen className="h-3 w-3" />
                Docs
              </button>
            </motion.div>
          </div>

          {/* Right: terminal */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: 1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full lg:w-[380px] shrink-0"
          >
            {/* Offset decoration */}
            <div className="relative">
              <div className="absolute -inset-2 border border-primary/10 rounded-xl" />
              <div className="absolute -inset-4 border border-primary/5 rounded-xl" />
              <div className="terminal-window rounded-xl overflow-hidden relative z-10">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full terminal-dot-red" />
                    <div className="h-2.5 w-2.5 rounded-full terminal-dot-yellow" />
                    <div className="h-2.5 w-2.5 rounded-full terminal-dot-green" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">erl@deployx402</span>
                </div>
                <div className="p-4 min-h-[260px] font-mono text-xs leading-relaxed">
                  {lines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className={
                        line.type === "prompt"
                          ? "text-foreground"
                          : line.type === "success"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {line.text || "\u00A0"}
                    </motion.div>
                  ))}
                  <span className="inline-block w-2 h-4 bg-primary animate-blink mt-1" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="flex items-center gap-4"
        >
          <div className="w-px h-10 flow-line animate-float-line" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">scroll</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
