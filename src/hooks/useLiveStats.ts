import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LiveStats {
  totalAgents: number;
  totalTrades: number;
  totalVolumeSol: number;
  loaded: boolean;
}

export function useLiveStats(): LiveStats {
  const [stats, setStats] = useState<LiveStats>({ totalAgents: 0, totalTrades: 0, totalVolumeSol: 0, loaded: false });

  useEffect(() => {
    const fetch = async () => {
      const [agentsRes, tradesRes] = await Promise.all([
        supabase.from("agents").select("id", { count: "exact", head: true }),
        supabase.from("trade_history").select("amount_sol"),
      ]);
      const totalAgents = agentsRes.count ?? 0;
      const trades = tradesRes.data ?? [];
      const totalTrades = trades.length;
      const totalVolumeSol = trades.reduce((s, t) => s + (t.amount_sol ?? 0), 0);
      setStats({ totalAgents, totalTrades, totalVolumeSol, loaded: true });
    };
    fetch();

    // Realtime: re-count on new agent/trade
    const ch = supabase
      .channel("live-stats")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agents" }, fetch)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "trade_history" }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  return stats;
}
