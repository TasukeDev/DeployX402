import { motion } from "framer-motion";
import { ArrowRight, Network, BarChart3, Rocket, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/components/WalletContext";

const ITEMS = [
  {
    title: "Agent Network",
    description: "Explore the network of autonomous trading agents. View strategies, live PnL, and copy top performers across the Solana ecosystem.",
    icon: Network,
    link: "/dashboard",
    linkLabel: "Browse Agents",
    size: "large",
  },
  {
    title: "Trading Engine",
    description: "Agents analyze real-time market data from DexScreener and PumpFun to execute intelligent trades. Configurable risk levels and strategies.",
    icon: BarChart3,
    size: "small",
  },
  {
    title: "Token Launch",
    description: "Launch your agent as a token on PumpFun. Agent identity becomes on-chain metadata with automated performance tracking.",
    icon: Rocket,
    size: "small",
  },
  {
    title: "Documentation",
    description: "Comprehensive guides on architecture, trading strategies, agent customization, and wallet management.",
    icon: BookOpen,
    link: "/docs",
    linkLabel: "Read Docs",
    size: "large",
  },
];

const EcosystemSection = () => {
  const navigate = useNavigate();
  const { connect, connected } = useWallet();

  return (
    <section id="ecosystem" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header row */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 lg:gap-20 items-end mb-14">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden lg:flex flex-col gap-2"
          >
            <div className="h-px w-8 bg-primary/50" />
            <span className="text-[10px] font-mono text-primary uppercase tracking-[0.25em]">03 / Ecosystem</span>
          </motion.div>

          <div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
            >
              Built for <span className="text-gradient-hero">traders</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground mt-2"
            >
              Tools and infrastructure for autonomous on-chain trading.
            </motion.p>
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 lg:gap-20">
          <div className="hidden lg:block" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ITEMS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                onClick={() => {
                  if (item.link) {
                    if (item.link === "/dashboard" && !connected) connect();
                    else navigate(item.link);
                  }
                }}
                className={`relative rounded-sm border bg-card p-6 flex flex-col gap-4 transition-all duration-300 ${
                  item.link
                    ? "border-primary/20 hover:border-primary/50 hover:bg-primary/[0.04] cursor-pointer group"
                    : "border-border hover:border-border/60"
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="h-8 w-8 rounded-sm border border-border bg-secondary/50 flex items-center justify-center">
                    <item.icon className={`h-3.5 w-3.5 ${item.link ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  {item.link && (
                    <ArrowRight className="h-3.5 w-3.5 text-primary/30 group-hover:text-primary transition-colors -rotate-45" />
                  )}
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-sm font-mono font-semibold text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>

                {item.linkLabel && (
                  <span className="text-[11px] font-mono text-primary mt-auto opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {item.linkLabel} <ArrowRight className="h-3 w-3" />
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;
