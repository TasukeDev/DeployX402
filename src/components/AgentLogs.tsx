import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Filter, Download, TrendingUp, TrendingDown, Zap, AlertTriangle, Info, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Trade {
  id: string;
  token_symbol: string;
  token_address?: string | null;
  action: string;
  amount_sol: number;
  token_amount: number;
  price: number;
  pnl_sol: number | null;
  signal: string | null;
  tx_signature?: string | null;
  created_at: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "success" | "warning" | "error";
  category: "trade" | "signal" | "system" | "risk";
  message: string;
  detail?: string;
}

const tradeToLog = (t: Trade): LogEntry => {
  const isBuy = t.action === "buy";
  const pnl = t.pnl_sol ?? 0;
  const isTp = t.signal?.includes("take-profit");
  const isSl = t.signal?.includes("stop-loss");

  if (isTp) {
    return {
      id: t.id, timestamp: new Date(t.created_at), level: "success", category: "risk",
      message: `🎯 Take-profit triggered on ${t.token_symbol}`,
      detail: `Sold ${t.token_amount.toFixed(2)} tokens · PnL: +${pnl.toFixed(4)} SOL · ${t.signal}`,
    };
  }
  if (isSl) {
    return {
      id: t.id, timestamp: new Date(t.created_at), level: "error", category: "risk",
      message: `🛑 Stop-loss triggered on ${t.token_symbol}`,
      detail: `Sold ${t.token_amount.toFixed(2)} tokens · PnL: ${pnl.toFixed(4)} SOL · ${t.signal}`,
    };
  }
  if (isBuy) {
    return {
      id: t.id, timestamp: new Date(t.created_at), level: "success", category: "trade",
      message: `📥 Bought ${t.token_symbol}`,
      detail: `${t.amount_sol} SOL · ${t.token_amount.toFixed(2)} tokens @ $${t.price.toFixed(6)} · Signal: ${t.signal || "manual"}`,
    };
  }
  return {
    id: t.id, timestamp: new Date(t.created_at),
    level: pnl >= 0 ? "success" : "warning", category: "trade",
    message: `📤 Sold ${t.token_symbol}`,
    detail: `${t.amount_sol} SOL · PnL: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)} SOL · Signal: ${t.signal || "manual"}`,
  };
};

const LEVEL_STYLES: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  info:    { icon: Info,          color: "text-muted-foreground", bg: "bg-secondary/50" },
  success: { icon: TrendingUp,    color: "text-primary",          bg: "bg-primary/5" },
  warning: { icon: TrendingDown,  color: "text-amber-400",        bg: "bg-amber-400/5" },
  error:   { icon: AlertTriangle, color: "text-destructive",      bg: "bg-destructive/5" },
};

const FILTERS = ["All", "Trade", "Signal", "Risk", "System"] as const;
type FilterType = typeof FILTERS[number];

interface AgentLogsProps {
  agentId: string;
  trades: Trade[];
}

export const AgentLogs = ({ agentId, trades }: AgentLogsProps) => {
  const [filter, setFilter] = useState<FilterType>("All");
  const [autoScroll, setAutoScroll] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [realtimeTrades, setRealtimeTrades] = useState<Trade[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(trades.length);

  // Merge prop trades with realtime-injected ones (dedup by id)
  const allTrades = useCallback(() => {
    const map = new Map<string, Trade>();
    for (const t of trades) map.set(t.id, t);
    for (const t of realtimeTrades) map.set(t.id, t);
    return [...map.values()];
  }, [trades, realtimeTrades]);

  // Supabase realtime subscription
  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel(`agent-logs-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trade_history",
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          const newTrade = payload.new as Trade;
          setRealtimeTrades((prev) => {
            // Avoid duplicate if already in prop trades
            if (prev.some((t) => t.id === newTrade.id)) return prev;
            return [newTrade, ...prev];
          });
          setNewCount((n) => n + 1);
          setFlashId(newTrade.id);
          setTimeout(() => setFlashId(null), 2500);
          if (autoScroll) {
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => { supabase.removeChannel(channel); };
  }, [agentId, autoScroll]);

  // Also detect new trades from props (fallback)
  useEffect(() => {
    if (trades.length > prevLen.current) {
      if (autoScroll) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    prevLen.current = trades.length;
  }, [trades.length, autoScroll]);

  const merged = allTrades();

  const logs: LogEntry[] = [
    {
      id: "boot",
      timestamp: new Date(Date.now() - 9999999),
      level: "info" as const,
      category: "system" as const,
      message: "🤖 Agent runtime initialized",
      detail: "Connected to Solana mainnet · DexScreener feed active · Jupiter routing enabled",
    },
    ...merged.map(tradeToLog),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const filtered = logs.filter((l) => {
    if (filter === "All") return true;
    return l.category === filter.toLowerCase();
  });

  const exportLogs = useCallback(() => {
    const lines = logs.map((l) =>
      `[${l.timestamp.toISOString()}] [${l.level.toUpperCase()}] [${l.category}] ${l.message}${l.detail ? ` | ${l.detail}` : ""}`
    ).join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-${agentId}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs, agentId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Activity Log</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
            {filtered.length} entries
          </span>
          {/* Realtime connection badge */}
          <span className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border ${
            isConnected
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-secondary border-border text-muted-foreground"
          }`}>
            <Radio className={`h-2 w-2 ${isConnected ? "animate-pulse" : ""}`} />
            {isConnected ? "REALTIME" : "CONNECTING"}
          </span>
          {newCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary"
            >
              +{newCount} new
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setAutoScroll((v) => !v); setNewCount(0); }}
            className={`px-2 py-1 rounded text-[9px] font-mono transition-colors ${
              autoScroll ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary text-muted-foreground border border-border"
            }`}
          >
            {autoScroll ? "AUTO" : "MANUAL"}
          </button>
          <button
            onClick={exportLogs}
            className="p-1.5 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors"
            title="Export logs"
          >
            <Download className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Terminal window */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400/40" />
            <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground ml-1">agent.log</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
            <span className={`text-[9px] font-mono ${isConnected ? "text-primary" : "text-muted-foreground"}`}>
              {isConnected ? "LIVE" : "—"}
            </span>
          </div>
        </div>

        <div className="max-h-[520px] overflow-y-auto p-3 space-y-1.5 font-mono">
          <AnimatePresence initial={false}>
            {filtered.map((log) => {
              const style = LEVEL_STYLES[log.level];
              const Icon = style.icon;
              const isFlashing = flashId === log.id;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-lg p-2.5 transition-colors duration-500 ${
                    isFlashing
                      ? "border border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)] bg-primary/5"
                      : style.bg
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded mt-0.5">
                      <Icon className={`h-3 w-3 ${style.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-medium ${style.color}`}>{log.message}</span>
                        {isFlashing && (
                          <span className="text-[8px] font-mono px-1 rounded bg-primary/10 text-primary border border-primary/20">NEW</span>
                        )}
                        <span className="text-[8px] font-mono text-muted-foreground/50 ml-auto shrink-0">
                          {log.timestamp.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                      {log.detail && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{log.detail}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-10">
              <p className="text-[10px] font-mono text-muted-foreground">No log entries for this filter.</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total Events", value: logs.length, icon: Zap },
          { label: "Trades", value: logs.filter(l => l.category === "trade").length, icon: TrendingUp },
          { label: "TP Hits", value: logs.filter(l => l.message.includes("Take-profit")).length, icon: TrendingUp },
          { label: "SL Hits", value: logs.filter(l => l.message.includes("Stop-loss")).length, icon: AlertTriangle },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-mono font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] font-mono text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
