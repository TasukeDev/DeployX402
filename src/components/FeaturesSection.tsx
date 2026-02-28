import { motion } from "framer-motion";
import {
  Bot, TrendingUp, Shield, Zap, Clock, BarChart3,
  Target, Layers, Eye, Wallet
} from "lucide-react";

const features = [
  { icon: Bot, title: "AI-Powered Sniping", description: "Agents detect new token launches on Pump.fun and Raydium, and snipe within milliseconds.", tags: ["Auto-Snipe", "MEV Protection"] },
  { icon: TrendingUp, title: "Smart Trading", description: "Machine learning models analyze volume, liquidity, and social signals to find the best entries and exits.", tags: ["Buy/Sell", "DCA"] },
  { icon: Shield, title: "Rug Pull Detection", description: "Real-time contract analysis flags honeypots, locked liquidity issues, and suspicious dev wallets." },
  { icon: Zap, title: "Lightning Execution", description: "Sub-second trade execution via Jito bundles and priority fees for optimal MEV protection." },
  { icon: Clock, title: "24/7 Autonomous", description: "Your agent never sleeps. It monitors and trades around the clock while you're away." },
  { icon: BarChart3, title: "Live PnL Tracking", description: "Real-time profit & loss dashboards, trade history, and performance analytics per agent." },
  { icon: Target, title: "Custom Strategies", description: "Choose from pre-built strategies or configure your own: momentum, mean-reversion, social alpha, and more." },
  { icon: Layers, title: "Multi-Agent Portfolios", description: "Run multiple agents with different strategies across different token categories." },
  { icon: Eye, title: "Copy Trading", description: "Follow top-performing agents on the leaderboard and automatically mirror their trades." },
  { icon: Wallet, title: "Non-Custodial", description: "Your funds stay in your wallet. Agents trade via delegated authority — you maintain full control." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] orb-cyan opacity-30 rounded-full" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3 font-medium">Trading Features</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Your edge in the
            <br />
            <span className="text-muted-foreground">memecoin market.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              className={`group rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 hover:border-primary/25 transition-all duration-300 ${
                i < 2 ? "xl:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <f.icon className="h-5 w-5 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold mb-1.5 text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              {f.tags && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {f.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/5 text-primary/80 border border-primary/10">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
