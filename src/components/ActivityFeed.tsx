import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Zap, TrendingUp, TrendingDown, Loader2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TradeEvent {
  id: string;
  agent_id: string;
  token_symbol: string;
  action: string;
  amount_sol: number;
  pnl_sol: number | null;
  signal: string | null;
  created_at: string;
  tx_signature?: string | null;
}

interface ActivityFeedProps {
  agentIds: string[];
}

const ActivityFeed = ({ agentIds }: ActivityFeedProps) => {
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agentIds.length === 0) { setLoading(false); return; }

    const fetchRecent = async () => {
      const { data } = await supabase
        .from("trade_history")
        .select("id, agent_id, token_symbol, action, amount_sol, pnl_sol, signal, created_at, tx_signature")
        .in("agent_id", agentIds)
        .order("created_at", { ascending: false })
        .limit(20);
      setEvents((data as TradeEvent[]) || []);
      setLoading(false);
    };
    fetchRecent();

    const channel = supabase
      .channel("trade-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_history" },
        (payload) => {
          const newTrade = payload.new as TradeEvent;
          if (agentIds.includes(newTrade.agent_id)) {
            setEvents((prev) => [newTrade, ...prev].slice(0, 30));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [agentIds.join(",")]);

  const timeAgo = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-mono font-medium">Live Activity</span>
        <span className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[10px] font-mono text-muted-foreground">No trade activity yet.</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-1">Trades will appear here in real-time.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0"
              >
                {e.action === "buy" ? (
                  <TrendingUp className="h-3 w-3 text-primary shrink-0" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-bold ${e.action === "buy" ? "text-primary" : "text-destructive"}`}>
                      {e.action.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-foreground">{e.token_symbol}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">· {e.amount_sol} SOL</span>
                    {e.tx_signature && (
                      <a
                        href={`https://solscan.io/tx/${e.tx_signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary/60 hover:text-primary transition-colors"
                        title="View on Solscan"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  {e.signal && (
                    <span className="text-[9px] font-mono text-muted-foreground">{e.signal}</span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {e.pnl_sol !== null && (
                    <p className={`text-[10px] font-mono font-bold ${e.pnl_sol >= 0 ? "text-primary" : "text-destructive"}`}>
                      {e.pnl_sol >= 0 ? "+" : ""}{e.pnl_sol.toFixed(4)}
                    </p>
                  )}
                  <p className="text-[9px] font-mono text-muted-foreground">{timeAgo(e.created_at)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
