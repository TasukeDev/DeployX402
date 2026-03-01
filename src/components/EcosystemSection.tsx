import { motion } from "framer-motion";
import { ArrowRight, Network, BarChart3, Rocket, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/components/WalletContext";

const items = [
  {
    title: "Agent Network",
    description: "Explore the network of autonomous trading agents. View strategies, live PnL, and copy top performers across the Solana ecosystem.",
    icon: Network,
    link: "/dashboard",
    linkLabel: "Browse Agents",
    size: "lg",
  },
  {
    title: "Trading Engine",
    description: "Agents analyze real-time market data from DexScreener and PumpFun to execute intelligent trades. Configurable risk levels and strategies.",
    icon: BarChart3,
    size: "sm",
  },
  {
    title: "Token Launch",
    description: "Launch your agent as a token on PumpFun. Agent identity becomes on-chain metadata with automated performance tracking.",
    icon: Rocket,
    size: "sm",
  },
  {
    title: "Documentation",
    description: "Comprehensive guides on architecture, trading strategies, agent customization, and wallet management.",
    icon: BookOpen,
    link: "/docs",
    linkLabel: "Read Docs",
    size: "lg",
  },
];

const EcosystemSection = () => {
  const navigate = useNavigate();
  const { connect, connected } = useWallet();

  const handleClick = (item: typeof items[0]) => {
    if (!item.link) return;
    if (item.link === "/dashboard" && !connected) connect();
    else navigate(item.link);
  };

  return (
    <section id="ecosystem" className="py-32 px-6 relative">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-16 lg:gap-24 items-end mb-16">
          <div className="hidden lg:flex flex-col items-center gap-3 pb-2">
            <span
              className="text-[9px] font-mono uppercase tracking-[0.4em] text-muted-foreground"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              03 · Ecosystem
            </span>
            <div className="h-8 w-px bg-primary/30" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          >
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary mb-4">Our ecosystem</p>
          <h2 className="text-3xl sm:text-5xl font-mono font-bold tracking-tighter text-foreground leading-[1.1]">
                Tools {"&"} infra<br />
                <span className="text-primary">built to trade</span>
              </h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed font-mono">
              Tools and infrastructure for autonomous trading.
            </p>
          </motion.div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Large left card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            onClick={() => handleClick(items[0])}
            whileHover={{ y: -3 }}
            className="md:col-span-7 group relative border border-primary/20 bg-primary/[0.03] hover:border-primary/40 transition-all duration-300 p-8 cursor-pointer overflow-hidden"
          >
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-primary/20 border-r-transparent" style={{ borderTopColor: 'hsl(var(--primary) / 0.15)', borderRightColor: 'transparent', borderTopStyle: 'solid', borderRightStyle: 'solid' }} />
            </div>

            <Network className="h-5 w-5 text-primary mb-6" />
            <h3 className="text-lg font-mono font-bold text-foreground mb-3">{items[0].title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6 max-w-sm">{items[0].description}</p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-primary opacity-70 group-hover:opacity-100 transition-opacity">
              {items[0].linkLabel} <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </motion.div>

          {/* Right column: two stacked */}
          <div className="md:col-span-5 flex flex-col gap-3">
            {items.slice(1, 3).map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.07 }}
                whileHover={{ y: -3 }}
                className="flex-1 border border-border bg-card hover:border-foreground/15 transition-all duration-300 p-6"
              >
                <item.icon className="h-4 w-4 text-muted-foreground mb-4" />
                <h3 className="text-sm font-mono font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Full-width bottom card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.24 }}
            onClick={() => handleClick(items[3])}
            whileHover={{ y: -3 }}
            className="md:col-span-12 group relative border border-primary/20 bg-primary/[0.03] hover:border-primary/40 transition-all duration-300 p-8 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-mono font-bold text-foreground mb-1">{items[3].title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">{items[3].description}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-primary opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
              {items[3].linkLabel} <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;
