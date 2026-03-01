import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";

interface TickerAgent {
  id: string;
  name: string;
  pnl_sol: number;
  status: string;
}

const MarqueeTicker = () => {
  const [items, setItems] = useState<TickerAgent[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: agents } = await supabase
        .from("agents")
        .select("id, name, status");
      if (!agents || agents.length === 0) return;

      const ids = agents.map((a) => a.id);
      const { data: snaps } = await supabase
        .from("pnl_snapshots")
        .select("agent_id, pnl_sol, snapshot_at")
        .in("agent_id", ids)
        .order("snapshot_at", { ascending: false });

      const latestPnl: Record<string, number> = {};
      (snaps || []).forEach((s) => {
        if (!(s.agent_id in latestPnl)) latestPnl[s.agent_id] = s.pnl_sol;
      });

      // Fallback mock PnL for agents without snapshots
      const ticker: TickerAgent[] = agents.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        pnl_sol: latestPnl[a.id] !== undefined
          ? latestPnl[a.id]
          : ((a.id.charCodeAt(0) + a.id.charCodeAt(1)) % 80 - 20) / 10,
      }));

      setItems(ticker);
    };

    load();

    const ch = supabase
      .channel("ticker-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pnl_snapshots" }, (payload) => {
        const s = payload.new as { agent_id: string; pnl_sol: number };
        setItems((prev) =>
          prev.map((a) => (a.id === s.agent_id ? { ...a, pnl_sol: s.pnl_sol } : a))
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  if (items.length === 0) return null;

  // Duplicate for seamless loop
  const doubled = [...items, ...items, ...items];

  return (
    <div
      className="relative w-full overflow-hidden border-y border-border/40 bg-background/60 backdrop-blur-sm py-2.5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-background to-transparent" />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-background to-transparent" />

      <div
        className="flex items-center gap-0"
        style={{
          animation: `marquee 40s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
          width: "max-content",
        }}
      >
        {doubled.map((agent, i) => {
          const up = agent.pnl_sol >= 0;
          return (
            <div
              key={`${agent.id}-${i}`}
              className="flex items-center gap-2 px-5 shrink-0 border-r border-border/30"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  agent.status === "running" ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              />
              <span className="text-[10px] font-mono text-muted-foreground">{agent.name}</span>
              <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${up ? "text-primary" : "text-destructive"}`}>
                {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {up ? "+" : ""}{agent.pnl_sol.toFixed(3)} SOL
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarqueeTicker;
