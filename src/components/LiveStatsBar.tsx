import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Zap, Activity } from "lucide-react";

interface PublicStats {
  totalPnl: number;
  totalTrades: number;
  publicAgents: number;
  loaded: boolean;
}

function useCountUp(target: number, duration = 1000, loaded = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!loaded || target === 0) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(start);
    }, 16);
    return () => clearInterval(id);
  }, [target, loaded]);
  return val;
}

const LiveStatsBar = () => {
  const [stats, setStats] = useState<PublicStats>({ totalPnl: 0, totalTrades: 0, publicAgents: 0, loaded: false });
  const [pulse, setPulse] = useState(false);

  const fetchStats = async () => {
    const [agentsRes, snapshotsRes, tradesRes] = await Promise.all([
      supabase.from("agents").select("id", { count: "exact", head: true }).eq("is_public", true),
      supabase.from("pnl_snapshots").select("agent_id, pnl_sol, snapshot_at"),
      supabase.from("trade_history").select("agent_id, amount_sol", { count: "exact" }),
    ]);

    // Get latest snapshot per agent for PnL
    const snapMap: Record<string, number> = {};
    for (const s of snapshotsRes.data ?? []) {
      if (snapMap[s.agent_id] === undefined || s.snapshot_at > (snapMap as any)[`${s.agent_id}_at`]) {
        snapMap[s.agent_id] = s.pnl_sol;
        (snapMap as any)[`${s.agent_id}_at`] = s.snapshot_at;
      }
    }
    const totalPnl = Object.entries(snapMap)
      .filter(([k]) => !k.endsWith("_at"))
      .reduce((sum, [, v]) => sum + (v as number), 0);

    setStats({
      totalPnl,
      totalTrades: tradesRes.count ?? 0,
      publicAgents: agentsRes.count ?? 0,
      loaded: true,
    });
  };

  useEffect(() => {
    fetchStats();
    const ch = supabase
      .channel("live-stats-bar")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "trade_history" }, () => {
        fetchStats();
        setPulse(true);
        setTimeout(() => setPulse(false), 1500);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pnl_snapshots" }, fetchStats)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const pnlCount = useCountUp(Math.round(Math.abs(stats.totalPnl) * 1000), 1200, stats.loaded);
  const tradeCount = useCountUp(stats.totalTrades, 1000, stats.loaded);
  const agentCount = useCountUp(stats.publicAgents, 800, stats.loaded);

  const statItems = [
    {
      icon: Activity,
      label: "Public Agents",
      value: agentCount.toString(),
      sub: "active",
    },
    {
      icon: Zap,
      label: "Total Trades",
      value: tradeCount.toLocaleString(),
      sub: "on-chain",
    },
    {
      icon: TrendingUp,
      label: "Total PnL",
      value: `${stats.totalPnl >= 0 ? "+" : "-"}${(pnlCount / 1000).toFixed(3)} SOL`,
      sub: "cumulative",
      positive: stats.totalPnl >= 0,
    },
  ];

  return (
    <div className="relative border-y border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
      {/* Subtle animated gradient sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ x: ["−100%", "200%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
        style={{
          background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.04), transparent)",
          width: "50%",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
        {/* Left label */}
        <div className="flex items-center gap-2 shrink-0">
          <AnimatePresence>
            {pulse && (
              <motion.span
                key="pulse"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="h-1.5 w-1.5 rounded-full bg-primary"
              />
            )}
          </AnimatePresence>
          {!pulse && <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />}
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground hidden sm:block">
            Live Network
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 sm:gap-10 flex-1 justify-center">
          {statItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <item.icon className={`h-3 w-3 shrink-0 ${item.positive === false ? "text-destructive" : "text-primary"}`} />
              <div>
                <span className={`text-xs font-mono font-bold tabular-nums ${item.positive === false ? "text-destructive" : "text-foreground"}`}>
                  {item.value}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground ml-1 hidden sm:inline">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right tag */}
        <span className="text-[9px] font-mono text-muted-foreground shrink-0 hidden sm:block">
          autox402 · solana
        </span>
      </div>
    </div>
  );
};

export default LiveStatsBar;
