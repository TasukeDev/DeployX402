import { motion } from "framer-motion";

const steps = [
  { num: "01", label: "Create Agent", sub: "Design strategy & personality", accent: true },
  { num: "02", label: "Fund Wallet", sub: "Deposit SOL", icon: "◎" },
  { num: "03", label: "Analyze", sub: "Market data + signals" },
  { num: "04", label: "Execute", sub: "Buy · Sell · Hold", accent: true },
  { num: "05", label: "On-Chain", sub: "Verifiable trades" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-32 px-6 relative">
      <div className="max-w-5xl mx-auto">
        {/* Header row */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-16 lg:gap-24 items-start mb-20">
          <div className="hidden lg:flex flex-col items-center gap-3 pt-2">
            <div className="h-8 w-px bg-primary/30" />
            <span
              className="text-[9px] font-mono uppercase tracking-[0.4em] text-muted-foreground"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              02 · Process
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary mb-4">How it works</p>
            <h2 className="text-3xl sm:text-5xl font-mono font-bold tracking-tighter text-foreground leading-[1.1]">
              Five steps<br />
              <span className="text-primary">to autonomy</span>
            </h2>
          </motion.div>
        </div>

        {/* Steps — large numbered cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-5 gap-px bg-border"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              custom={i}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className={`relative flex flex-col justify-between p-6 min-h-[180px] transition-colors duration-300 ${
                step.accent
                  ? "bg-primary/[0.06] hover:bg-primary/10"
                  : "bg-card hover:bg-secondary/40"
              }`}
            >
              {/* Big number */}
              <span className="text-5xl font-mono font-bold text-foreground/[0.06] leading-none select-none">
                {step.num}
              </span>

              <div className="mt-auto">
                <p className={`text-xs font-mono font-semibold mb-1 ${step.accent ? "text-primary" : "text-foreground"}`}>
                  {step.icon || "◆"} {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">{step.sub}</p>
              </div>

              {/* Bottom accent bar */}
              {step.accent && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/40" />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm text-muted-foreground mt-8 max-w-lg leading-relaxed font-mono border-l border-border pl-4"
        >
          Design your agent's trading strategy — choose from Scalper, Swing Trader, DCA, Sniper, 
          or fully custom. Fund it with SOL and watch it trade autonomously on Solana mainnet.
        </motion.p>
      </div>
    </section>
  );
};

export default HowItWorksSection;
