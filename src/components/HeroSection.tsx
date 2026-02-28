import { motion } from "framer-motion";
import { ArrowRight, Shield, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletContext";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { connect, connected } = useWallet();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (connected) {
      navigate("/dashboard");
    } else {
      connect();
    }
  };

  return (
    <section className="relative min-h-[100vh] flex flex-col items-center justify-center pt-16 overflow-hidden">
      {/* Subtle warm orbs */}
      <div className="absolute top-32 left-1/4 w-[700px] h-[700px] orb-gold rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] orb-warm rounded-full pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/50 text-[11px] text-muted-foreground font-medium mb-10 tracking-wide"
        >
          <Activity className="h-3 w-3 text-primary" />
          Live on Solana Mainnet
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-[0.95] tracking-tight mb-7"
        >
          AI Agents That
          <br />
          <span className="text-gradient-hero">Trade For You</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed"
        >
          Fund an autonomous trading agent. Pick your strategy. 
          Watch it trade memecoins on Solana — 24/7, fully on-chain.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-20"
        >
          <Button size="lg" onClick={handleCTA} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 h-12 font-semibold text-sm">
            {connected ? "Go to Dashboard" : "Start Trading"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="border-border hover:bg-secondary/60 px-8 h-12 text-sm" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
            See How It Works
          </Button>
        </motion.div>

        {/* Trust stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-3 gap-8 max-w-md mx-auto mb-16"
        >
          {[
            { value: "$2.4M+", label: "Volume Traded" },
            { value: "1,200+", label: "Active Agents" },
            { value: "+34%", label: "Avg. Return" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl sm:text-3xl stat-number text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-primary/60" />
            Non-Custodial
          </span>
          <span className="h-3 w-px bg-border" />
          {["Jupiter", "Raydium", "Pump.fun", "Jito"].map((n) => (
            <span key={n} className="opacity-50 hover:opacity-100 transition-opacity">{n}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
