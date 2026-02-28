import { motion } from "framer-motion";
import { Wallet, Bot, Settings, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    step: "01",
    title: "Connect Wallet",
    description: "Connect your Phantom or Solflare wallet. Your SOL stays in your wallet — fully non-custodial.",
  },
  {
    icon: Bot,
    step: "02",
    title: "Pick an Agent",
    description: "Browse the marketplace or deploy your own. Choose from sniper bots, trend followers, copy traders, and more.",
  },
  {
    icon: Settings,
    step: "03",
    title: "Configure & Fund",
    description: "Set your risk level, max position size, take-profit and stop-loss. Fund your agent with SOL to start trading.",
  },
  {
    icon: TrendingUp,
    step: "04",
    title: "Watch It Trade",
    description: "Your agent executes trades 24/7 on Solana mainnet. Track PnL, trades, and performance in real-time.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-32 relative">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3 font-medium">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            From wallet to
            <br />
            <span className="text-gradient-hero">autopilot in minutes.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 text-center"
            >
              <span className="text-[10px] font-mono text-primary/50 uppercase tracking-widest">{s.step}</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mx-auto mt-3 mb-4">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
