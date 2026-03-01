import { motion } from "framer-motion";
import { TrendingUp, Lock, Cpu, Globe } from "lucide-react";

const PILLARS = [
  {
    icon: Cpu,
    stat: "5 strategies",
    label: "Scalper · Swing · DCA · Sniper · Custom",
  },
  {
    icon: TrendingUp,
    stat: "Jupiter V6",
    label: "Best-route swap execution on every trade",
  },
  {
    icon: Lock,
    stat: "Non-custodial",
    label: "Your keys. Each agent owns its own wallet.",
  },
  {
    icon: Globe,
    stat: "24 / 7",
    label: "Always-on agents. No sleep. No downtime.",
  },
];

const WhatIsSection = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Split layout: left label column + right content */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 lg:gap-20 items-start">
          {/* Left: rotated section label */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden lg:flex flex-col gap-2 pt-1"
          >
            <div className="h-px w-8 bg-primary/50" />
            <span className="text-[10px] font-mono text-primary uppercase tracking-[0.25em]">01 / Overview</span>
          </motion.div>

          {/* Right: content */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4"
            >
              What is{" "}
              <span className="text-gradient-hero">DeployX402</span>?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground leading-relaxed max-w-xl mb-12"
            >
              DeployX402 creates autonomous AI trading agents on Solana. Each agent has its own
              trading strategy, risk profile, and wallet. Agents analyze markets using DexScreener
              and PumpFun data, execute trades autonomously via Jupiter and Raydium, and operate
              24/7 on mainnet. Every trade is verifiable on-chain — no black boxes, no simulations.
            </motion.p>

            {/* Pillar grid — 2×2 data cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-sm overflow-hidden">
              {PILLARS.map((p, i) => (
                <motion.div
                  key={p.stat}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-card px-4 py-5 flex flex-col gap-2 group hover:bg-secondary/50 transition-colors"
                >
                  <p.icon className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                  <p className="text-sm font-mono font-bold text-foreground">{p.stat}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">{p.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatIsSection;
