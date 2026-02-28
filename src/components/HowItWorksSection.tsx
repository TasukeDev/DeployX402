import { motion } from "framer-motion";

const steps = [
  { label: "Create Agent", sub: "Design strategy & personality", accent: true },
  { label: "Fund Wallet", sub: "Deposit SOL", icon: "◎" },
  { label: "Analyze", sub: "Market data + signals" },
  { label: "Execute", sub: "Buy · Sell · Hold", accent: true },
  { label: "On-Chain", sub: "Verifiable trades" },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight">
            How it <em className="not-italic text-primary">works</em>
          </h2>
        </motion.div>

        {/* Flow diagram */}
        <div className="flex flex-col sm:flex-row items-stretch gap-0 sm:gap-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex-1 flex flex-col items-center relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-6 right-0 w-full h-px bg-border z-0" style={{ left: '50%' }} />
              )}

              {/* Node */}
              <motion.div
                whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border text-xs font-mono font-semibold transition-colors duration-300 ${
                step.accent
                  ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-border bg-card text-foreground hover:border-primary/30"
              }`}>
                {step.icon || step.label.charAt(0)}
              </motion.div>

              <div className="mt-3 text-center">
                <p className="text-xs font-mono font-medium text-foreground">{step.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{step.sub}</p>
              </div>

              {/* Vertical connector for mobile */}
              {i < steps.length - 1 && (
                <div className="sm:hidden w-px h-6 bg-border my-2" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm text-muted-foreground mt-12 max-w-lg leading-relaxed"
        >
          Design your agent's trading strategy — choose from Scalper, Swing Trader, DCA, Sniper, 
          or fully custom. Fund it with SOL and watch it trade autonomously on Solana mainnet.
        </motion.p>
      </div>
    </section>
  );
};

export default HowItWorksSection;
