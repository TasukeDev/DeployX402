import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Connect Your Wallet",
    description: "Link your Phantom or Solflare wallet. Non-custodial — your SOL stays with you at all times.",
  },
  {
    step: "02",
    title: "Choose a Strategy",
    description: "Select from proven strategies: Pump.fun sniping, DCA momentum, social alpha, copy trading, or build custom.",
  },
  {
    step: "03",
    title: "Fund & Deploy",
    description: "Set your risk level and budget. Fund your agent with SOL and deploy it to start trading immediately.",
  },
  {
    step: "04",
    title: "Earn On Autopilot",
    description: "Your agent trades 24/7 on mainnet. Track PnL in real-time. Withdraw anytime with a single click.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70 mb-4 font-medium">How It Works</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
            Four Steps to Autopilot
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />

          <div className="space-y-12 md:space-y-16">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 md:gap-10 items-start"
              >
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-bold text-primary">
                  {s.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{s.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
