import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Bot, Zap } from "lucide-react";
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
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
      <div className="absolute top-20 -left-40 w-[500px] h-[500px] orb-cyan animate-float rounded-full" />
      <div className="absolute bottom-20 -right-40 w-[600px] h-[600px] orb-purple animate-float-slow rounded-full" />
      <div className="absolute inset-0 noise-overlay" />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-medium mb-8"
        >
          <Zap className="h-3 w-3" />
          Live on Solana Mainnet — Real Trading
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 max-w-4xl mx-auto"
        >
          AI Agents That
          <br />
          <span className="text-gradient-hero">Trade Memecoins For You.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8"
        >
          Fund an AI trading agent, pick your strategy, and let it snipe, trade, and manage memecoins on Solana — 24/7, fully on-chain.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
        >
          <Button size="lg" onClick={handleCTA} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 font-semibold">
            {connected ? "Go to Dashboard" : "Connect Wallet"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="border-border hover:bg-secondary px-8" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
            How It Works
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-3 gap-6 max-w-lg mx-auto"
        >
          {[
            { label: "Total Volume", value: "$2.4M+", icon: TrendingUp },
            { label: "Active Agents", value: "1,200+", icon: Bot },
            { label: "Avg ROI", value: "+34%", icon: Zap },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xl font-extrabold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-12"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Powered by</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground justify-center">
            {["Solana", "Jupiter", "Raydium", "Pump.fun", "Jito"].map((n) => (
              <span key={n} className="hover:text-foreground transition-colors">{n}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
