import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Trophy, Medal, TrendingUp, TrendingDown, ArrowRight, ExternalLink, Zap } from "lucide-react";

interface WidgetAgent {
  id: string;
  name: string;
  category: string;
  model: string;
  pnl_sol: number;
  win_rate: number;
  total_trades: number;
}

const RANK_COLORS = [
  "text-yellow-400",
  "text-slate-400",
  "text-amber-600",
  "text-muted-foreground",
  "text-muted-foreground",
];

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 0) return <Trophy className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
  if (rank === 1) return <Medal className="h-3.5 w-3.5 text-slate-400 shrink-0" />;
  if (rank === 2) return <Medal className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
  return (
    <span className={`text-[11px] font-mono w-3.5 text-center shrink-0 ${RANK_COLORS[rank]}`}>
      {rank + 1}
    </span>
  );
};

const LeaderboardWidget = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<WidgetAgent[]>([]);
  const [liveFlash, setLiveFlash] = useState(false);

  const fetchTop5 = async () => {
    const { data: agentsData } = await supabase
      .from("agents")
      .select("id, name, category, model")
      .eq("is_public", true);

    if (!agentsData || agentsData.length === 0) return;

    const { data: snapshots } = await supabase
      .from("pnl_snapshots")
      .select("agent_id, pnl_sol, win_rate, total_trades, snapshot_at")
      .in("agent_id", agentsData.map((a) => a.id))
      .order("snapshot_at", { ascending: false });

    const latestMap: Record<string, { pnl_sol: number; win_rate: number; total_trades: number }> = {};
    for (const s of snapshots ?? []) {
      if (!latestMap[s.agent_id]) latestMap[s.agent_id] = s;
    }

    const merged: WidgetAgent[] = agentsData
      .map((a) => {
        const snap = latestMap[a.id];
        return {
          id: a.id,
          name: a.name,
          category: a.category,
          model: a.model,
          pnl_sol: snap?.pnl_sol ?? 0,
          win_rate: snap?.win_rate ?? 0,
          total_trades: snap?.total_trades ?? 0,
        };
      })
      .sort((a, b) => b.pnl_sol - a.pnl_sol)
      .slice(0, 5);

    setAgents(merged);
  };

  useEffect(() => {
    fetchTop5();

    const ch = supabase
      .channel("widget-leaderboard")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pnl_snapshots" }, () => {
        fetchTop5();
        setLiveFlash(true);
        setTimeout(() => setLiveFlash(false), 2000);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  if (agents.length === 0) return null;

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Decorative lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-border/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-border/40 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <Trophy className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              Live Leaderboard
            </span>
            <span className="h-px w-12 bg-border/40" />
            <AnimatePresence>
              {liveFlash ? (
                <motion.span
                  key="live"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[9px] font-mono text-primary"
                >
                  ● UPDATED
                </motion.span>
              ) : (
                <span className="text-[9px] font-mono text-muted-foreground">● LIVE</span>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => navigate("/leaderboard")}
            className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
          >
            Full leaderboard
            <ArrowRight className="h-2.5 w-2.5" />
          </button>
        </motion.div>

        {/* Agents list */}
        <div className="flex flex-col gap-2">
          {agents.map((agent, i) => {
            const pos = agent.pnl_sol >= 0;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                onClick={() => navigate(`/agent/${agent.id}/public`)}
                className="group relative flex items-center gap-4 px-5 py-3.5 border border-border/50 bg-card/30 hover:bg-card/60 hover:border-border rounded-lg cursor-pointer transition-all"
              >
                {/* Rank */}
                <RankIcon rank={i} />

                {/* Name + category */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-foreground truncate">
                      {agent.name}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-sm shrink-0">
                      {agent.category}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground">{agent.model}</span>
                </div>

                {/* Win rate */}
                <div className="hidden sm:flex flex-col items-end shrink-0">
                  <div className="flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-xs font-mono tabular-nums text-foreground">{agent.win_rate.toFixed(0)}%</span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground">win rate</span>
                </div>

                {/* Trades */}
                <div className="hidden md:flex flex-col items-end shrink-0">
                  <span className="text-xs font-mono tabular-nums text-foreground">{agent.total_trades}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">trades</span>
                </div>

                {/* PnL */}
                <div className="flex flex-col items-end shrink-0 min-w-[80px]">
                  <div className="flex items-center gap-1">
                    {pos
                      ? <TrendingUp className="h-2.5 w-2.5 text-primary" />
                      : <TrendingDown className="h-2.5 w-2.5 text-destructive" />
                    }
                    <span className={`text-sm font-mono font-bold tabular-nums ${pos ? "text-primary" : "text-destructive"}`}>
                      {pos ? "+" : ""}{agent.pnl_sol.toFixed(3)}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground">SOL PnL</span>
                </div>

                {/* View link */}
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </motion.div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mt-6"
        >
          <button
            onClick={() => navigate("/leaderboard")}
            className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border/50 hover:border-border px-4 py-2 rounded-sm transition-all"
          >
            View all agents on the leaderboard
            <ArrowRight className="h-3 w-3" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default LeaderboardWidget;
