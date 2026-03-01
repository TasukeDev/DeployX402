import { motion } from "framer-motion";
import { ArrowRight, BookOpen, LayoutDashboard, Zap, Activity, Shield } from "lucide-react";
import { useWallet } from "@/components/WalletContext";
import { useAuth } from "@/components/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const TERMINAL_LINES = [
  { type: "prompt", text: "$ deployx402 init --network mainnet" },
  { type: "output", text: "  Connecting to Solana RPC..." },
  { type: "success", text: "  ✓ slot 312,847,291 · 423ms latency" },
  { type: "prompt", text: "$ deployx402 deploy --strategy sniper" },
  { type: "output", text: "  Loading Jupiter V6 router..." },
  { type: "success", text: "  ✓ Agent active · watching 2,841 pools" },
  { type: "output", text: "  [04:12:33] BUY BONK  +0.082 SOL" },
  { type: "success", text: "  [04:12:51] SELL BONK TP hit +4.2%" },
];

const TICKER_ITEMS = [
  { label: "SOL/USD", value: "$148.32", change: "+2.4%" },
  { label: "BTC/USD", value: "$67,421", change: "+0.8%" },
  { label: "BONK", value: "$0.00002841", change: "+12.1%" },
  { label: "RAY", value: "$2.18", change: "-1.3%" },
  { label: "WIF", value: "$2.96", change: "+5.7%" },
  { label: "PYTH", value: "$0.412", change: "+3.2%" },
  { label: "JUP", value: "$1.04", change: "+0.9%" },
  { label: "ORCA", value: "$3.71", change: "-0.4%" },
];

const STATS = [
  { icon: Zap, label: "Avg execution", value: "< 400ms" },
  { icon: Activity, label: "Active agents", value: "1,284" },
  { icon: Shield, label: "Uptime", value: "99.97%" },
];

const HeroSection = () => {
  const { connect, connected } = useWallet();
  const { authenticated } = useAuth();
  const navigate = useNavigate();
  const [lines, setLines] = useState<typeof TERMINAL_LINES>([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < TERMINAL_LINES.length) {
        const current = i++;
        setLines((prev) => [...prev, TERMINAL_LINES[current]]);
      } else {
        clearInterval(interval);
      }
    }, 380);
    return () => clearInterval(interval);
  }, []);

  const handleCTA = () => {
    if (authenticated || connected) navigate("/dashboard");
    else navigate("/auth");
  };

  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <section id="hero-section" className="relative min-h-screen flex flex-col pt-12">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      {/* Radial glow behind hero content */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Live ticker strip */}
      <div className="relative border-b border-border bg-card/60 overflow-hidden h-8 flex items-center">
        <div className="flex ticker-track">
          {doubled.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-6 shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground">{item.label}</span>
              <span className="text-[10px] font-mono font-semibold text-foreground">{item.value}</span>
              <span className={`text-[9px] font-mono ${item.change.startsWith("+") ? "text-primary" : "text-destructive"}`}>
                {item.change}
              </span>
              <span className="text-border mx-1">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main hero content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-6xl mx-auto">
          {/* Top label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-mono text-primary uppercase tracking-[0.2em]">Autonomous Trading Infrastructure</span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Heading + CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Big bold heading — very different from dot-matrix ASCII */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-3">
                <span className="text-foreground">Deploy</span>
                <br />
                <span className="text-gradient-hero">AI agents</span>
                <br />
                <span className="text-foreground">on Solana.</span>
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mt-6 mb-8">
                Autonomous trading infrastructure. Deploy agents that snipe, trade, and manage tokens — fully on-chain with real-time execution.
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-6 mb-8">
                {STATS.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <s.icon className="h-3 w-3 text-primary/60" />
                    <div>
                      <p className="text-xs font-mono font-semibold text-foreground">{s.value}</p>
                      <p className="text-[9px] font-mono text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCTA}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-primary-foreground text-xs font-mono font-semibold hover:bg-primary/90 transition-colors glow-primary"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {(authenticated || connected) ? "Open Platform" : "Launch Platform"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => navigate("/docs")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-sm border border-border bg-secondary/50 text-xs font-mono text-foreground hover:bg-secondary transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Read Docs
                </button>
              </div>
            </motion.div>

            {/* Right — Terminal */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="relative"
            >
              {/* Bracket corners decoration */}
              <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-primary/30" />
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-primary/30" />

              <div className="terminal-window rounded-sm overflow-hidden relative scanlines">
                {/* Title bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full terminal-dot-red" />
                    <div className="h-2.5 w-2.5 rounded-full terminal-dot-yellow" />
                    <div className="h-2.5 w-2.5 rounded-full terminal-dot-green" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-mono text-muted-foreground">deployx402 · mainnet</span>
                  </div>
                </div>

                {/* Terminal content */}
                <div className="p-5 min-h-[280px] font-mono text-xs leading-relaxed">
                  {lines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.12 }}
                      className={
                        line.type === "prompt"
                          ? "text-foreground mt-2 first:mt-0"
                          : line.type === "success"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {line.text || "\u00A0"}
                    </motion.div>
                  ))}
                  <span className="inline-block w-2 h-[13px] bg-primary animate-blink mt-1" />
                </div>

                {/* Bottom status bar */}
                <div className="border-t border-border/50 px-4 py-2 bg-secondary/20 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-muted-foreground">LIVE · Solana Mainnet</span>
                  <span className="text-[9px] font-mono text-primary">● connected</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="pb-8 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">scroll</span>
        <div className="w-px h-6 flow-line animate-float-line" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
