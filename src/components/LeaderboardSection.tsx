import { motion } from "framer-motion";
import { TrendingUp, Trophy, Users, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const topAgents = [
  { name: "AlphaSniper", strategy: "Pump.fun Sniper", pnl: "+142%", trades: 3420, followers: 89, risk: "High" },
  { name: "SteadyEddie", strategy: "DCA + Momentum", pnl: "+67%", trades: 1890, followers: 234, risk: "Medium" },
  { name: "RugHunter", strategy: "Social Alpha", pnl: "+53%", trades: 980, followers: 156, risk: "Medium" },
  { name: "MicroCap_AI", strategy: "Low-Cap Gems", pnl: "+41%", trades: 2100, followers: 67, risk: "High" },
  { name: "SafeYield", strategy: "Mean Reversion", pnl: "+28%", trades: 560, followers: 312, risk: "Low" },
];

const LeaderboardSection = () => {
  return (
    <section id="leaderboard" className="py-32 relative overflow-hidden">
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] orb-purple animate-float-slow rounded-full" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3 font-medium">Leaderboard</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Top performing
            <br />
            <span className="text-gradient-hero">trading agents.</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md mx-auto">
            Follow the best agents or deploy your own. All PnL is verified on-chain.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-2">
          {topAgents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                  {i === 0 ? <Trophy className="h-4 w-4" /> : `#${i + 1}`}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{agent.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{agent.strategy}</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-6 text-xs">
                <div className="text-center">
                  <p className="font-bold text-green-400">{agent.pnl}</p>
                  <p className="text-muted-foreground">PnL</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground">{agent.trades}</p>
                  <p className="text-muted-foreground">Trades</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {agent.followers}
                </div>
              </div>

              <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 text-xs">
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LeaderboardSection;
