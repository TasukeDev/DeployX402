import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Copy, Zap, Trophy, ArrowRight, Loader2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";

interface FeaturedAgentData {
  id: string;
  name: string;
  category: string;
  model: string;
  system_prompt: string | null;
  pnl_sol: number;
  win_rate: number;
  total_trades: number;
  snapshots: { snapshot_at: string; pnl_sol: number }[];
}

const FeaturedAgent = () => {
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const { toast } = useToast();
  const [agent, setAgent] = useState<FeaturedAgentData | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const fetchFeatured = async () => {
      // Get all public agents with latest pnl snapshot
      const { data: agents } = await supabase
        .from("agents")
        .select("id, name, category, model, system_prompt")
        .eq("is_public", true);

      if (!agents || agents.length === 0) return;

      const { data: snapshots } = await supabase
        .from("pnl_snapshots")
        .select("agent_id, pnl_sol, win_rate, total_trades, snapshot_at")
        .in("agent_id", agents.map((a) => a.id))
        .order("snapshot_at", { ascending: false });

      if (!snapshots || snapshots.length === 0) return;

      // Get the latest snapshot per agent
      const latestMap: Record<string, typeof snapshots[0]> = {};
      for (const s of snapshots) {
        if (!latestMap[s.agent_id] || s.snapshot_at > latestMap[s.agent_id].snapshot_at) {
          latestMap[s.agent_id] = s;
        }
      }

      // Find top agent by PnL
      const topEntry = Object.values(latestMap).sort((a, b) => b.pnl_sol - a.pnl_sol)[0];
      if (!topEntry) return;

      const topAgent = agents.find((a) => a.id === topEntry.agent_id);
      if (!topAgent) return;

      // Get all snapshots for this agent for equity curve
      const agentSnaps = snapshots
        .filter((s) => s.agent_id === topAgent.id)
        .sort((a, b) => a.snapshot_at.localeCompare(b.snapshot_at))
        .slice(-10);

      setAgent({
        id: topAgent.id,
        name: topAgent.name,
        category: topAgent.category,
        model: topAgent.model,
        system_prompt: topAgent.system_prompt,
        pnl_sol: topEntry.pnl_sol,
        win_rate: topEntry.win_rate ?? 0,
        total_trades: topEntry.total_trades,
        snapshots: agentSnaps.map((s) => ({ snapshot_at: s.snapshot_at, pnl_sol: s.pnl_sol })),
      });
    };

    fetchFeatured();
  }, []);

  const handleCopyTrade = async () => {
    if (!authenticated) {
      navigate("/auth");
      return;
    }
    if (!agent) return;
    setCopying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: newAgent, error } = await supabase.from("agents").insert({
        name: `${agent.name} (Copy)`,
        category: agent.category,
        model: agent.model,
        system_prompt: agent.system_prompt,
        user_id: user.id,
        is_public: false,
        status: "stopped",
      }).select().single();

      if (error || !newAgent) throw error;

      toast({
        title: "Agent copied!",
        description: `"${newAgent.name}" added to your dashboard.`,
      });
      navigate(`/agent/${newAgent.id}`);
    } catch {
      toast({ title: "Failed to copy", description: "Please try again.", variant: "destructive" });
    } finally {
      setCopying(false);
    }
  };

  if (!agent) return null;

  const pnlPositive = agent.pnl_sol >= 0;
  const chartData = agent.snapshots.map((s, i) => ({
    i,
    pnl: parseFloat(s.pnl_sol.toFixed(4)),
  }));

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-10"
        >
          <Trophy className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">Featured Agent</span>
          <span className="h-px flex-1 bg-border/40 max-w-[80px]" />
          <span className="text-[9px] font-mono text-muted-foreground">top performing · live</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative border border-border/60 rounded-xl bg-card/40 backdrop-blur-sm overflow-hidden"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-0">
            {/* Left: agent info */}
            <div className="p-8 flex flex-col gap-6">
              {/* Agent header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-sm">
                      {agent.category}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-mono text-primary">RUNNING</span>
                  </div>
                  <h2 className="text-2xl font-mono font-bold text-foreground">{agent.name}</h2>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">{agent.model}</p>
                </div>
                <div className="flex items-center gap-1.5 border border-primary/20 bg-primary/5 px-2.5 py-1 rounded-sm">
                  <Trophy className="h-2.5 w-2.5 text-primary" />
                  <span className="text-[9px] font-mono text-primary">#1</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: "Cumulative PnL",
                    value: `${pnlPositive ? "+" : ""}${agent.pnl_sol.toFixed(3)} SOL`,
                    positive: pnlPositive,
                    icon: pnlPositive ? TrendingUp : TrendingDown,
                  },
                  {
                    label: "Win Rate",
                    value: `${agent.win_rate.toFixed(0)}%`,
                    positive: agent.win_rate >= 50,
                    icon: Zap,
                  },
                  {
                    label: "Total Trades",
                    value: agent.total_trades.toString(),
                    positive: true,
                    icon: Copy,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                    <div className="flex items-center gap-1.5">
                      <stat.icon className={`h-3 w-3 ${stat.positive ? "text-primary" : "text-destructive"}`} />
                      <span className={`text-lg font-mono font-bold tabular-nums ${stat.positive ? "text-foreground" : "text-destructive"}`}>
                        {stat.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleCopyTrade}
                  disabled={copying}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-none border border-primary/40 bg-primary/10 text-xs font-mono text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                >
                  {copying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
                  Copy Trade
                  {!copying && <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />}
                </button>
                <button
                  onClick={() => navigate(`/agent/${agent.id}`)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-none border border-border bg-transparent text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                >
                  View Agent
                </button>
              </div>
            </div>

            {/* Right: equity curve */}
            <div className="border-l border-border/40 p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Equity Curve</span>
                <span className={`text-[9px] font-mono ${pnlPositive ? "text-primary" : "text-destructive"}`}>
                  {pnlPositive ? "▲" : "▼"} All-time
                </span>
              </div>
              {chartData.length > 1 ? (
                <div className="flex-1 min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                      <defs>
                        <linearGradient id="featuredGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={pnlPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={pnlPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
                      <XAxis dataKey="i" hide />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontFamily: "monospace",
                        }}
                        formatter={(v: number) => [`${v.toFixed(4)} SOL`, "PnL"]}
                        labelFormatter={() => ""}
                      />
                      <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke={pnlPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                        strokeWidth={1.5}
                        fill="url(#featuredGradient)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 min-h-[180px] flex items-center justify-center">
                  <span className="text-[10px] font-mono text-muted-foreground">Collecting data...</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedAgent;
