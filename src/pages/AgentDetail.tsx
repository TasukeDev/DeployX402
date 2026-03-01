import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, TrendingUp, TrendingDown, Play, Square, Loader2,
  Settings, BarChart3, Clock, Zap, Wallet, Copy, ExternalLink, GitFork, Radio,
  Target, AlertTriangle, ArrowDownToLine,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

interface AgentData {
  id: string; name: string; category: string; model: string;
  status: string; system_prompt: string | null; created_at: string;
  is_public: boolean; user_id: string;
  take_profit_pct: number; stop_loss_pct: number;
}

interface Trade {
  id: string; token_symbol: string; action: string;
  amount_sol: number; token_amount: number; price: number;
  pnl_sol: number; signal: string | null; created_at: string;
  tx_signature?: string | null;
}

interface PnlSnapshot {
  id: string; pnl_sol: number; total_trades: number;
  win_rate: number; snapshot_at: string;
}

interface AgentWallet {
  public_key: string;
  balance_sol: number;
}

interface Position {
  id: string;
  token_symbol: string;
  token_address: string;
  entry_price: number;
  entry_amount_sol: number;
  token_amount: number;
  status: string;
  pnl_sol: number | null;
  created_at: string;
  buy_tx_signature: string | null;
}

const DEFAULT_TP = 0.05;
const DEFAULT_SL = 0.03;

const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authenticated } = useAuth();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [newTradeIds, setNewTradeIds] = useState<Set<string>>(new Set());
  const [snapshots, setSnapshots] = useState<PnlSnapshot[]>([]);
  const [wallet, setWallet] = useState<AgentWallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [liveIndicator, setLiveIndicator] = useState(false);
  const [tab, setTab] = useState<"pnl" | "trades" | "positions" | "config" | "wallet">("pnl");
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionPrices, setPositionPrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [tpInput, setTpInput] = useState("");
  const [slInput, setSlInput] = useState("");
  const [savingTpSl, setSavingTpSl] = useState(false);
  const tradesRef = useRef<Trade[]>([]);
  tradesRef.current = trades;

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  // Realtime subscription for new trades
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`agent-trades-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_history", filter: `agent_id=eq.${id}` },
        (payload) => {
          const newTrade = payload.new as Trade;
          setTrades((prev) => [newTrade, ...prev.slice(0, 49)]);
          setNewTradeIds((prev) => new Set(prev).add(newTrade.id));
          // Flash live indicator
          setLiveIndicator(true);
          setTimeout(() => setLiveIndicator(false), 2000);
          // Clear highlight after 3s
          setTimeout(() => {
            setNewTradeIds((prev) => { const s = new Set(prev); s.delete(newTrade.id); return s; });
          }, 3000);
          // Toast alert for TP/SL triggered sells
          if (newTrade.action === "sell" && newTrade.signal) {
            const isTp = newTrade.signal.includes("take-profit");
            const isSl = newTrade.signal.includes("stop-loss");
            if (isTp || isSl) {
              toast({
                title: isTp ? "🎯 Take-Profit Triggered!" : "🛑 Stop-Loss Triggered",
                description: `${newTrade.token_symbol} sold · PnL: ${newTrade.pnl_sol >= 0 ? "+" : ""}${newTrade.pnl_sol?.toFixed(4)} SOL · ${newTrade.signal}`,
                variant: isTp ? "default" : "destructive",
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pnl_snapshots", filter: `agent_id=eq.${id}` },
        (payload) => {
          const snap = payload.new as PnlSnapshot;
          setSnapshots((prev) => {
            const updated = [...prev, snap];
            updated.sort((a, b) => new Date(a.snapshot_at).getTime() - new Date(b.snapshot_at).getTime());
            return updated;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agent_positions", filter: `agent_id=eq.${id}` },
        (payload) => {
          const updated = payload.new as Position;
          setPositions((prev) =>
            updated.status === "closed"
              ? prev.filter((p) => p.id !== updated.id)
              : prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const fetchAll = async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const [agentRes, tradesRes, snapshotsRes] = await Promise.all([
      supabase.from("agents").select("*").eq("id", id!).single(),
      supabase.from("trade_history").select("*").eq("agent_id", id!).order("created_at", { ascending: false }).limit(50),
      supabase.from("pnl_snapshots").select("*").eq("agent_id", id!).order("snapshot_at", { ascending: true }),
    ]);

    // Fetch wallet and open positions in parallel
    const [walletRes, positionsRes] = await Promise.all([
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/agent_wallets?agent_id=eq.${id}&select=public_key,balance_sol&limit=1`,
        { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } }
      ),
      supabase.from("agent_positions").select("*").eq("agent_id", id!).eq("status", "open").order("created_at", { ascending: false }),
    ]);

    const walletData = await walletRes.json();
    if (Array.isArray(walletData) && walletData.length > 0) setWallet(walletData[0] as AgentWallet);
    if (positionsRes.data) setPositions(positionsRes.data as Position[]);

    if (agentRes.error) {
      toast({ title: "Agent not found", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    const agentData = agentRes.data as AgentData;
    setAgent(agentData);
    setTpInput(((agentData.take_profit_pct ?? DEFAULT_TP) * 100).toFixed(1));
    setSlInput(((agentData.stop_loss_pct ?? DEFAULT_SL) * 100).toFixed(1));
    setTrades((tradesRes.data as Trade[]) || []);


    const realSnapshots = (snapshotsRes.data as PnlSnapshot[]) || [];
    if (realSnapshots.length === 0) {
      const mockSnapshots = Array.from({ length: 14 }, (_, i) => ({
        id: `mock-${i}`,
        pnl_sol: parseFloat((Math.random() * 6 - 1).toFixed(2)),
        total_trades: Math.floor(Math.random() * 20) + i * 3,
        win_rate: parseFloat((45 + Math.random() * 30).toFixed(1)),
        snapshot_at: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
      }));
      let cum = 0;
      mockSnapshots.forEach((s) => { cum += s.pnl_sol; s.pnl_sol = parseFloat(cum.toFixed(2)); });
      setSnapshots(mockSnapshots);
    } else {
      setSnapshots(realSnapshots);
    }

    setLoading(false);
  };

  const generateWallet = async () => {
    setWalletLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-wallet", { body: { agent_id: id } });
      if (error) throw error;
      setWallet({ public_key: data.public_key, balance_sol: 0 });
      toast({ title: data.already_exists ? "Wallet loaded" : "Wallet generated!", description: `Address: ${data.public_key.slice(0, 8)}...` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setWalletLoading(false);
  };

  // Fetch current prices for open positions from DexScreener
  const fetchCurrentPrices = async (positionList: Position[]) => {
    if (positionList.length === 0) return;
    setPricesLoading(true);
    const prices: Record<string, number> = {};
    await Promise.allSettled(
      positionList.map(async (pos) => {
        try {
          const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${pos.token_address}`);
          const data = await res.json();
          const pair = data.pairs?.[0];
          if (pair?.priceUsd) prices[pos.id] = parseFloat(pair.priceUsd);
        } catch { /* silent */ }
      })
    );
    setPositionPrices(prices);
    setPricesLoading(false);
  };

  const handleCopyTrade = async () => {
    if (!agent) return;
    if (!authenticated) { navigate("/auth"); return; }
    setCopying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const newName = `${agent.category}-copy-${Date.now().toString(36).slice(-4)}`;
      const { error } = await supabase.from("agents").insert({
        name: newName,
        category: agent.category,
        model: agent.model,
        system_prompt: agent.system_prompt,
        user_id: user.id,
        status: "stopped",
        is_public: false,
      });
      if (error) throw error;
      toast({ title: "Agent copied!", description: `${newName} added to your dashboard.` });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Copy failed", description: e.message, variant: "destructive" });
    }
    setCopying(false);
  };

  const getRiskLabel = (m: string) =>
    m.startsWith("risk:")
      ? { low: "Conservative", medium: "Balanced", high: "Aggressive" }[m.replace("risk:", "")] || m
      : m;
  const getFundAmount = (p: string | null) => p?.startsWith("fund:") ? p.replace("fund:", "") + " SOL" : "—";

  const toggleStatus = async () => {
    if (!agent) return;
    const newStatus = agent.status === "running" ? "stopped" : "running";
    const { error } = await supabase.from("agents").update({ status: newStatus }).eq("id", agent.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setAgent({ ...agent, status: newStatus });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) return null;

  const totalPnl = snapshots.length > 0 ? snapshots[snapshots.length - 1].pnl_sol : 0;
  const totalTrades = snapshots.length > 0 ? snapshots[snapshots.length - 1].total_trades : trades.length;
  const winRate = snapshots.length > 0 ? snapshots[snapshots.length - 1].win_rate : 0;
  const pnlPositive = totalPnl >= 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-12 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono text-[10px]">◆</span>
              <span className="text-xs font-mono font-medium">DeployX402</span>
              <span className="text-[10px] text-muted-foreground font-mono">/ agent / {agent.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Copy Trade Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopyTrade}
              disabled={copying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {copying ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitFork className="h-3 w-3" />}
              Copy Trade
            </motion.button>
            <button
              onClick={toggleStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                agent.status === "running"
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {agent.status === "running" ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {agent.status === "running" ? "stop" : "start"}
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start gap-4 mb-8"
        >
          {/* Agent icon */}
          <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${
            agent.status === "running" ? "border-primary/40 bg-primary/5 shadow-[0_0_16px_hsl(var(--primary)/0.15)]" : "border-border bg-card"
          }`}>
            <span className="text-primary font-mono text-lg">◆</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-medium tracking-tight">{agent.name}</h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                agent.status === "running"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground"
              }`}>
                {agent.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{agent.category}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{getRiskLabel(agent.model)}</span>
              <span className="text-[10px] font-mono text-muted-foreground">· funded {getFundAmount(agent.system_prompt)}</span>
              {agent.is_public && <span className="text-[10px] font-mono text-primary/70">· public</span>}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { label: "Total PnL", value: `${pnlPositive ? "+" : ""}${totalPnl.toFixed(2)} SOL`, icon: TrendingUp, positive: pnlPositive },
            { label: "Total Trades", value: totalTrades.toString(), icon: Zap, positive: true },
            { label: "Win Rate", value: `${winRate.toFixed(1)}%`, icon: BarChart3, positive: winRate > 50 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <s.icon className={`h-4 w-4 ${s.positive ? "text-primary" : "text-destructive"}`} />
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className={`text-sm font-mono font-bold ${s.positive ? "text-primary" : "text-destructive"}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
          {([
            { key: "pnl", label: "PnL Chart", icon: TrendingUp },
            { key: "trades", label: "Trade History", icon: Clock },
            { key: "positions", label: "Positions", icon: Target },
            { key: "wallet", label: "Wallet", icon: Wallet },
            { key: "config", label: "Strategy", icon: Settings },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                if (t.key === "positions") fetchCurrentPrices(positions);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono transition-colors border-b-2 -mb-px whitespace-nowrap ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
              {t.key === "trades" && liveIndicator && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
              {t.key === "positions" && positions.length > 0 && (
                <span className="ml-1 px-1 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-mono">{positions.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* PnL Chart */}
        {tab === "pnl" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Cumulative PnL (14d)</h3>
              <span className={`text-sm font-mono font-bold ${pnlPositive ? "text-primary" : "text-destructive"}`}>
                {pnlPositive ? "+" : ""}{totalPnl.toFixed(2)} SOL
              </span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={snapshots.map((s) => ({
                date: new Date(s.snapshot_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
                pnl: s.pnl_sol,
              }))}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 14%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(0, 0%, 38%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(0, 0%, 38%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(0, 0%, 9%)", border: "1px solid hsl(0, 0%, 16%)", borderRadius: 8, fontSize: 11, fontFamily: "JetBrains Mono" }}
                  labelStyle={{ color: "hsl(0, 0%, 55%)" }}
                  itemStyle={{ color: "hsl(160, 70%, 45%)" }}
                  formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(4)} SOL`, "PnL"]}
                />
                <Area type="monotone" dataKey="pnl" stroke="hsl(160, 70%, 45%)" fill="url(#pnlGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Snapshot stats row */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-border">
              {[
                { label: "Best Day", value: `+${Math.max(...snapshots.map(s => s.pnl_sol), 0).toFixed(2)} SOL` },
                { label: "Total Trades", value: totalTrades.toString() },
                { label: "Win Rate", value: `${winRate.toFixed(1)}%` },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</p>
                  <p className="text-xs font-mono font-medium text-foreground mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Trade History */}
        {tab === "trades" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {trades.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-dashed border-border">
                <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-mono">No trades recorded yet.</p>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">Start the agent to begin trading.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Recent trades</span>
                    {/* Live badge */}
                    <AnimatePresence>
                      {liveIndicator && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20"
                        >
                          <Radio className="h-2.5 w-2.5 text-primary animate-pulse" />
                          <span className="text-[9px] font-mono text-primary">LIVE</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{trades.length} records</span>
                </div>
                <AnimatePresence initial={false}>
                  {trades.map((trade) => {
                    const isNew = newTradeIds.has(trade.id);
                    return (
                      <motion.div
                        key={trade.id}
                        layout
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className={`rounded-xl border bg-card p-4 flex items-center justify-between transition-colors ${
                          isNew
                            ? "border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.12)]"
                            : "border-border hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            trade.action === "buy" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                          }`}>
                            {trade.action.toUpperCase()}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-mono font-medium">{trade.token_symbol}</span>
                              {isNew && <span className="text-[8px] font-mono text-primary bg-primary/10 px-1 rounded">NEW</span>}
                            </div>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              {trade.amount_sol} SOL @ ${trade.price.toFixed(6)}
                              {trade.signal && <span className="text-primary/70"> · {trade.signal}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <p className={`text-xs font-mono font-bold ${trade.pnl_sol >= 0 ? "text-primary" : "text-destructive"}`}>
                              {trade.pnl_sol >= 0 ? "+" : ""}{trade.pnl_sol.toFixed(4)} SOL
                            </p>
                            {trade.tx_signature && (
                              <a
                                href={`https://solscan.io/tx/${trade.tx_signature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="View on Solscan"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {new Date(trade.created_at).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}

        {/* Open Positions */}
        {tab === "positions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Open Positions</span>
              <button
                onClick={() => fetchCurrentPrices(positions)}
                disabled={pricesLoading}
                className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
              >
                {pricesLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Radio className="h-3 w-3" />}
                Refresh prices
              </button>
            </div>
            {positions.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-dashed border-border">
                <Target className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-mono">No open positions</p>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">Positions appear here when the agent buys a token.</p>
              </div>
            ) : (
              positions.map((pos) => {
                const currentPrice = positionPrices[pos.id];
                const priceChange = currentPrice ? (currentPrice - pos.entry_price) / pos.entry_price : null;
                const unrealizedPnl = priceChange !== null ? priceChange * pos.entry_amount_sol : null;
                const agentTp = (agent?.take_profit_pct ?? DEFAULT_TP);
                const agentSl = (agent?.stop_loss_pct ?? DEFAULT_SL);
                const tpDist = agentTp - (priceChange ?? 0);
                const slDist = (priceChange ?? 0) - (-agentSl);
                const pnlColor = unrealizedPnl === null ? "text-muted-foreground" : unrealizedPnl >= 0 ? "text-primary" : "text-destructive";
                return (
                  <motion.div
                    key={pos.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold">{pos.token_symbol}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">OPEN</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-mono font-bold ${pnlColor}`}>
                          {unrealizedPnl === null ? "—" : `${unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(4)} SOL`}
                        </span>
                        {pos.buy_tx_signature && (
                          <a href={`https://solscan.io/tx/${pos.buy_tx_signature}`} target="_blank" rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors" title="View entry tx">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Price info */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-secondary/40 p-2.5">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Entry</p>
                        <p className="text-[11px] font-mono">${pos.entry_price.toFixed(6)}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/40 p-2.5">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Current</p>
                        <p className={`text-[11px] font-mono ${pnlColor}`}>
                          {currentPrice ? `$${currentPrice.toFixed(6)}` : "—"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-secondary/40 p-2.5">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Change</p>
                        <p className={`text-[11px] font-mono ${pnlColor}`}>
                          {priceChange !== null ? `${priceChange >= 0 ? "+" : ""}${(priceChange * 100).toFixed(2)}%` : "—"}
                        </p>
                      </div>
                    </div>

                    {/* TP/SL progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5 text-destructive" /> SL -{(agentSl * 100).toFixed(1)}%</span>
                        <span className="text-primary/60">{pos.entry_amount_sol.toFixed(3)} SOL in</span>
                        <span className="flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5 text-primary" /> TP +{(agentTp * 100).toFixed(1)}%</span>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
                        {priceChange !== null && (
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${priceChange >= 0 ? "bg-primary" : "bg-destructive"}`}
                            style={{
                              width: `${Math.max(2, Math.min(100, ((priceChange - (-agentSl)) / (agentTp - (-agentSl))) * 100))}%`,
                            }}
                          />
                        )}
                        {/* TP marker */}
                        <div className="absolute right-0 top-0 h-full w-0.5 bg-primary/40" />
                      </div>
                      {priceChange !== null && (
                        <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                          <span className="text-destructive">SL in {(slDist * 100).toFixed(1)}%</span>
                          <span className="text-primary">TP in {(tpDist * 100).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[9px] font-mono text-muted-foreground">
                      Opened {new Date(pos.created_at).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* Strategy Config */}
        {tab === "config" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Strategy Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Strategy", value: agent.category },
                { label: "Risk Profile", value: getRiskLabel(agent.model) },
                { label: "Funded", value: getFundAmount(agent.system_prompt) },
                { label: "Status", value: agent.status },
                { label: "Visibility", value: agent.is_public ? "Public" : "Private" },
                { label: "Created", value: new Date(agent.created_at).toLocaleDateString() },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-secondary/30 border border-border p-3">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-sm font-mono text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {/* TP/SL Config */}
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-xs font-mono font-medium">Risk Management Targets</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" /> Take-Profit (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.1" max="100" step="0.1"
                      value={tpInput}
                      onChange={(e) => setTpInput(e.target.value)}
                      className="flex-1 h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="5.0"
                    />
                    <span className="text-xs font-mono text-muted-foreground">%</span>
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground">Sell when price rises by this %</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-destructive" /> Stop-Loss (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.1" max="100" step="0.1"
                      value={slInput}
                      onChange={(e) => setSlInput(e.target.value)}
                      className="flex-1 h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="3.0"
                    />
                    <span className="text-xs font-mono text-muted-foreground">%</span>
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground">Sell when price drops by this %</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const tp = parseFloat(tpInput) / 100;
                  const sl = parseFloat(slInput) / 100;
                  if (isNaN(tp) || isNaN(sl) || tp <= 0 || sl <= 0) {
                    toast({ title: "Invalid values", description: "TP and SL must be positive numbers.", variant: "destructive" });
                    return;
                  }
                  setSavingTpSl(true);
                  const { error } = await supabase.from("agents").update({ take_profit_pct: tp, stop_loss_pct: sl }).eq("id", agent.id);
                  if (error) {
                    toast({ title: "Save failed", description: error.message, variant: "destructive" });
                  } else {
                    setAgent({ ...agent, take_profit_pct: tp, stop_loss_pct: sl });
                    toast({ title: "Targets saved!", description: `TP: +${(tp * 100).toFixed(1)}% · SL: -${(sl * 100).toFixed(1)}%` });
                  }
                  setSavingTpSl(false);
                }}
                disabled={savingTpSl}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {savingTpSl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
                Save Risk Targets
              </button>
            </div>

            {/* Copy Trade CTA */}
            <div className="pt-4 border-t border-border">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleCopyTrade}
                disabled={copying}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary border border-border text-sm font-mono text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitFork className="h-4 w-4" />}
                Copy this strategy to my dashboard
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Wallet */}
        {tab === "wallet" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-center">
                <span className="text-primary font-mono">◆</span>
              </div>
              <div>
                <h3 className="text-sm font-mono font-medium">Agent Wallet</h3>
                <p className="text-[10px] font-mono text-muted-foreground">Dedicated Solana wallet for this agent</p>
              </div>
            </div>

            {wallet ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary/50 border border-border p-4">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Deposit Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-foreground break-all flex-1">{wallet.public_key}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(wallet.public_key); toast({ title: "Copied!" }); }}
                      className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <a
                      href={`https://solscan.io/account/${wallet.public_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/50 border border-border p-4">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Balance</p>
                    <p className="text-lg font-mono font-bold text-primary">{wallet.balance_sol.toFixed(4)} SOL</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 border border-border p-4">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Status</p>
                    <p className="text-lg font-mono font-bold text-foreground">{agent.status === "running" ? "Trading" : "Idle"}</p>
                  </div>
                </div>

                {/* Withdraw Section */}
                <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ArrowDownToLine className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-mono font-medium">Withdraw Funds</p>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    To withdraw, stop the agent, then transfer SOL from the agent wallet address to your personal wallet using any Solana wallet app.
                  </p>
                  <div className="rounded-lg bg-secondary/50 border border-border p-3 space-y-1.5">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Steps to withdraw</p>
                    <ol className="text-[10px] font-mono text-foreground space-y-1 list-decimal list-inside">
                      <li>Stop the agent (to pause trading)</li>
                      <li>Import the agent wallet in Phantom or Solflare</li>
                      <li>Send SOL to your personal address</li>
                    </ol>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.status === "running" && (
                      <button
                        onClick={toggleStatus}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-[10px] font-mono text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        <Square className="h-3 w-3" /> Stop Agent
                      </button>
                    )}
                    <a
                      href={`https://solscan.io/account/${wallet.public_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> View on Solscan
                    </a>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-mono text-primary font-medium mb-1">How to fund your agent</p>
                  <ol className="text-[10px] font-mono text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Copy the deposit address above</li>
                    <li>Send SOL from your wallet (Phantom, Solflare, etc.)</li>
                    <li>Start the agent — it will begin trading automatically</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-mono text-muted-foreground mb-4">No wallet generated yet</p>
                <button
                  onClick={generateWallet}
                  disabled={walletLoading}
                  className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-mono hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {walletLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Generate Wallet"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AgentDetail;
