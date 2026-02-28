import { motion } from "framer-motion";
import { ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";
import { useWallet } from "@/components/WalletContext";
import { useAuth } from "@/components/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const TERMINAL_LINES = [
  { type: "prompt", text: "$ solagent init" },
  { type: "output", text: "◆ solagent v1.0.0" },
  { type: "output", text: "  Connecting to Solana mainnet..." },
  { type: "success", text: "  ✓ Connected (slot: 312,847,291)" },
  { type: "output", text: "  Loading trading engines..." },
  { type: "success", text: "  ✓ Jupiter • Raydium • Pump.fun" },
  { type: "output", text: "" },
  { type: "prompt", text: "$ solagent deploy --strategy sniper" },
  { type: "success", text: "  ✓ Agent deployed. Watching for launches..." },
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
    <section id="hero-section" className="relative min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* ASCII-style logo */}
          <div className="mb-8">
            <pre className="ascii-dots text-2xl sm:text-3xl leading-tight select-none">
{`  ___  ___  _    
 / __|/ _ \\| |   
 \\__ \\ (_) | |__ 
 |___/\\___/|____| agent`}
            </pre>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mb-8">
            Autonomous AI trading infrastructure on Solana. Deploy agents that snipe, trade, and manage memecoins — fully on-chain.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/docs")}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 text-xs font-mono text-foreground hover:bg-secondary transition-colors"
            >
              <BookOpen className="h-3 w-3" />
              Docs
            </button>
            <button
              onClick={handleCTA}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-xs font-mono text-primary hover:bg-primary/20 transition-colors"
            >
              <LayoutDashboard className="h-3 w-3" />
              {(authenticated || connected) ? "Platform" : "Launch Platform"}
            </button>
          </div>
        </motion.div>

        {/* Right side - Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="terminal-window rounded-xl overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full terminal-dot-red" />
                <div className="h-2.5 w-2.5 rounded-full terminal-dot-yellow" />
                <div className="h-2.5 w-2.5 rounded-full terminal-dot-green" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">erl@solagent</span>
            </div>

            {/* Terminal content */}
            <div className="p-4 min-h-[280px] font-mono text-xs leading-relaxed">
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
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">scroll</span>
        <div className="w-px h-6 flow-line animate-float-line" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
