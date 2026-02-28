import { motion } from "framer-motion";
import { Bot, TrendingUp, Shield, Zap, BarChart3, Eye } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Sub-Second Sniping",
    description: "Detect new launches on Pump.fun and Raydium. Execute trades within milliseconds via Jito bundles.",
  },
  {
    icon: Bot,
    title: "Autonomous 24/7",
    description: "Your agent never sleeps. It monitors markets, executes trades, and manages positions around the clock.",
  },
  {
    icon: Shield,
    title: "Rug Pull Detection",
    description: "Real-time contract analysis flags honeypots, locked liquidity issues, and suspicious dev wallets.",
  },
  {
    icon: TrendingUp,
    title: "Smart Strategies",
    description: "Choose from momentum, mean-reversion, social alpha, DCA, or build your own custom strategy.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    description: "Real-time PnL tracking, trade history, and performance benchmarks for every agent you deploy.",
  },
  {
    icon: Eye,
    title: "Copy Trading",
    description: "Follow top-performing agents on the leaderboard. Mirror their trades with your own risk parameters.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70 mb-4 font-medium">What Sets Us Apart</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
            Your Unfair Advantage
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-card p-8 hover:bg-secondary/30 transition-colors duration-300 group"
            >
              <f.icon className="h-5 w-5 text-primary mb-5 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold mb-2 text-foreground">{f.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
