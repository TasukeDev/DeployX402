import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Bot, TrendingUp, Play, Square, Loader2,
  Settings, BarChart3, Clock, Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

interface AgentData {
  id: string; name: string; category: string; model: string;
  status: string; system_prompt: string | null; created_at: string;
  is_public: boolean;
}

interface Trade {
  id: string; token_symbol: string; action: string;
  amount_sol: number; token_amount: number; price: number;
  pnl_sol: number; signal: string | null; created_at: string;
}

interface PnlSnapshot {
  id: string; pnl_sol: number; total_trades: number;
  win_rate: number; snapshot_at: string;
}

const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [snapshots, setSnapshots] = useState<PnlSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pnl" | "trades" | "config">("pnl");

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    const [agentRes, tradesRes, snapshotsRes] = await Promise.all([
      supabase.from("agents").select("*").eq("id", id!).single(),
      supabase.from("trade_history").select("*").eq("agent_id", id!).order("created_at", { ascending: false }).limit(50),
      supabase.from("pnl_snapshots").select("*").eq("agent_id", id!).order("snapshot_at", { ascending: true }),
    ]);

    if (agentRes.error) {
      toast({ title: "Agent not found", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    setAgent(agentRes.data as AgentData);
    setTrades((tradesRes.data as Trade[]) || []);

    // If no snapshots, generate mock data for demo
    const realSnapshots = (snapshotsRes.data as PnlSnapshot[]) || [];
    if (realSnapshots.length === 0) {
      const mockSnapshots = Array.from({ length: 14 }, (_, i) => ({
        id: `mock-${i}`,
        pnl_sol: parseFloat((Math.random() * 6 - 1).toFixed(2)),
        total_trades: Math.floor(Math.random() * 20) + i * 3,
        win_rate: parseFloat((45 + Math.random() * 30).toFixed(1)),
        snapshot_at: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
      }));
      // accumulate pnl
      let cum = 0;
      mockSnapshots.forEach((s) => { cum += s.pnl_sol; s.pnl_sol = parseFloat(cum.toFixed(2)); });
      setSnapshots(mockSnapshots);
    } else {
      setSnapshots(realSnapshots);
    }

    setLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-12 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono text-[10px]">◆</span>
              <span className="text-xs font-mono font-medium">solagent</span>
              <span className="text-[10px] text-muted-foreground font-mono">/ agent / {agent.name}</span>
            </div>
          </div>
          <button
            onClick={toggleStatus}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              agent.status === "running"
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            {agent.status === "running" ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {agent.status === "running" ? "stop" : "start"}
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`h-3 w-3 rounded-full ${agent.status === "running" ? "bg-primary" : "bg-muted-foreground"}`} />
          <div>
            <h1 className="text-lg font-medium">{agent.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{agent.category}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{getRiskLabel(agent.model)}</span>
              <span className="text-[10px] font-mono text-muted-foreground">· {getFundAmount(agent.system_prompt)}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total PnL", value: `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)} SOL`, icon: TrendingUp, color: totalPnl >= 0 },
            { label: "Trades", value: totalTrades.toString(), icon: Zap, color: true },
            { label: "Win Rate", value: `${winRate.toFixed(1)}%`, icon: BarChart3, color: winRate > 50 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <s.icon className={`h-4 w-4 ${s.color ? "text-primary" : "text-destructive"}`} />
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</p>
                <p className={`text-sm font-mono font-bold ${s.color ? "text-primary" : "text-destructive"}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {([
            { key: "pnl", label: "PnL Chart", icon: TrendingUp },
            { key: "trades", label: "Trade History", icon: Clock },
            { key: "config", label: "Strategy", icon: Settings },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono transition-colors border-b-2 -mb-px ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3 w-3" /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "pnl" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-xs font-mono text-muted-foreground uppercase mb-4">Cumulative PnL (14d)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={snapshots.map((s) => ({
                date: new Date(s.snapshot_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
                pnl: s.pnl_sol,
              }))}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(0, 0%, 42%)" }} />
                <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(0, 0%, 42%)" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(0, 0%, 11%)", border: "1px solid hsl(0, 0%, 18%)", borderRadius: 8, fontSize: 11, fontFamily: "JetBrains Mono" }}
                  labelStyle={{ color: "hsl(0, 0%, 60%)" }}
                />
                <Area type="monotone" dataKey="pnl" stroke="hsl(160, 70%, 45%)" fill="url(#pnlGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {tab === "trades" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {trades.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-dashed border-border">
                <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-mono">No trades recorded yet.</p>
              </div>
            ) : (
              trades.map((trade) => (
                <div key={trade.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      trade.action === "buy" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                    }`}>
                      {trade.action.toUpperCase()}
                    </span>
                    <div>
                      <span className="text-sm font-mono font-medium">{trade.token_symbol}</span>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {trade.amount_sol} SOL @ ${trade.price.toFixed(6)}
                        {trade.signal && ` · ${trade.signal}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-mono font-bold ${trade.pnl_sol >= 0 ? "text-primary" : "text-destructive"}`}>
                      {trade.pnl_sol >= 0 ? "+" : ""}{trade.pnl_sol.toFixed(4)} SOL
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {new Date(trade.created_at).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {tab === "config" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-xs font-mono text-muted-foreground uppercase mb-2">Strategy Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Strategy", value: agent.category },
                { label: "Risk Profile", value: getRiskLabel(agent.model) },
                { label: "Funded", value: getFundAmount(agent.system_prompt) },
                { label: "Status", value: agent.status },
                { label: "Public", value: agent.is_public ? "Yes" : "No" },
                { label: "Created", value: new Date(agent.created_at).toLocaleDateString() },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">{item.label}</p>
                  <p className="text-sm font-mono text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AgentDetail;
