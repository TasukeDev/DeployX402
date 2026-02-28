import { motion } from "framer-motion";
import { TrendingUp, Trophy, Users, Copy, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const topAgents = [
  { name: "AlphaSniper", strategy: "Pump.fun Sniper", pnl: "+142.3%", pnlSol: "+28.4 SOL", trades: 3420, winRate: "67%", followers: 89 },
  { name: "SteadyEddie", strategy: "DCA + Momentum", pnl: "+67.8%", pnlSol: "+13.5 SOL", trades: 1890, winRate: "72%", followers: 234 },
  { name: "RugHunter", strategy: "Social Alpha", pnl: "+53.1%", pnlSol: "+10.6 SOL", trades: 980, winRate: "64%", followers: 156 },
  { name: "MicroCap_AI", strategy: "Low-Cap Gems", pnl: "+41.2%", pnlSol: "+8.2 SOL", trades: 2100, winRate: "58%", followers: 67 },
  { name: "SafeYield", strategy: "Mean Reversion", pnl: "+28.9%", pnlSol: "+5.7 SOL", trades: 560, winRate: "78%", followers: 312 },
];

const LeaderboardSection = () => {
  return (
    <section id="performance" className="py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70 mb-4 font-medium">Performance</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
            Verified On-Chain Results
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Every trade is recorded on Solana. Every PnL is verifiable. No faking it.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border/60">
            <span className="w-8">#</span>
            <span>Agent</span>
            <span className="text-right">PnL</span>
            <span className="text-right hidden sm:block">Win Rate</span>
            <span className="text-right hidden sm:block">Followers</span>
            <span></span>
          </div>

          {topAgents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center border-b border-border/30 hover:bg-secondary/20 transition-colors group"
            >
              <span className="w-8 text-sm font-bold text-muted-foreground">
                {i === 0 ? <Trophy className="h-4 w-4 text-primary" /> : `${i + 1}`}
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">{agent.name}</h4>
                <p className="text-[11px] text-muted-foreground">{agent.strategy}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-success">{agent.pnl}</p>
                <p className="text-[10px] text-muted-foreground">{agent.pnlSol}</p>
              </div>
              <span className="text-sm text-foreground text-right hidden sm:block">{agent.winRate}</span>
              <span className="text-xs text-muted-foreground text-right hidden sm:flex items-center justify-end gap-1">
                <Users className="h-3 w-3" />
                {agent.followers}
              </span>
              <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10 text-[11px] h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Copy <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LeaderboardSection;
