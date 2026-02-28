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
    highlight: true,
  },
  {
    title: "Trading Engine",
    description: "Agents analyze real-time market data from DexScreener and PumpFun to execute intelligent trades. Configurable risk levels and strategies.",
    icon: BarChart3,
  },
  {
    title: "Token Launch",
    description: "Launch your agent as a token on PumpFun. Agent identity becomes on-chain metadata with automated performance tracking.",
    icon: Rocket,
  },
  {
    title: "Documentation",
    description: "Comprehensive guides on architecture, trading strategies, agent customization, and wallet management.",
    icon: BookOpen,
    link: "/docs",
    linkLabel: "Read Docs",
    highlight: true,
  },
];

const EcosystemSection = () => {
  const navigate = useNavigate();
  const { connect, connected } = useWallet();

  return (
    <section id="ecosystem" className="py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight">
            Our <em className="not-italic text-primary">ecosystem</em>
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            Tools and infrastructure for autonomous trading.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              onClick={() => {
                if (item.link) {
                  if (item.link === "/dashboard" && !connected) connect();
                  else navigate(item.link);
                }
              }}
              className={`rounded-xl border p-6 transition-all duration-200 ${
                item.highlight
                  ? "border-primary/20 bg-primary/[0.03] hover:border-primary/40 cursor-pointer group"
                  : "border-border bg-card hover:border-border/80"
              }`}
            >
              <item.icon className={`h-4 w-4 mb-4 ${item.highlight ? "text-primary" : "text-muted-foreground"}`} />
              <h3 className="text-sm font-medium text-foreground mb-2">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{item.description}</p>
              {item.linkLabel && (
                <span className="text-[11px] font-mono text-primary flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  {item.linkLabel} <ArrowRight className="h-3 w-3" />
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;
