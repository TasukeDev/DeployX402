import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Trophy, ArrowLeft, Copy, Zap,
  BarChart3, Share2, Loader2, ExternalLink, Link,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface AgentInfo {
  id: string;
  name: string;
  category: string;
  model: string;
  system_prompt: string | null;
  status: string;
  created_at: string;
}

interface Snapshot {
  pnl_sol: number;
  win_rate: number;
  total_trades: number;
  snapshot_at: string;
}

// Inject/update a <meta> tag dynamically
function setMeta(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) el = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement | null;
  if (el) {
    el.setAttribute("content", content);
  } else {
    const tag = document.createElement("meta");
    tag.setAttribute(property.startsWith("og:") || property.startsWith("twitter:") ? "property" : "name", property);
    tag.setAttribute("content", content);
    document.head.appendChild(tag);
  }
}

function restoreDefaultMeta() {
  const defaultTitle = "DeployX402 — Autonomous AI Trading on Solana";
  const defaultDesc = "Deploy autonomous AI trading agents on Solana. Snipe, trade, and manage memecoins fully on-chain. No infrastructure needed.";
  document.title = defaultTitle;
  setMeta("og:title", defaultTitle);
  setMeta("twitter:title", defaultTitle);
  setMeta("og:description", defaultDesc);
  setMeta("twitter:description", defaultDesc);
  setMeta("og:url", "https://launchpad-agent-flow.lovable.app");
}

const AgentPublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const { toast } = useToast();
  const confettiFired = useRef(false);

  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [latestSnap, setLatestSnap] = useState<Snapshot | null>(null);
  const [recentTrades, setRecentTrades] = useState<
    { id: string; token_symbol: string; action: string; pnl_sol: number | null; amount_sol: number; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copying, setCopying] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [copyingLink, setCopyingLink] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: agentData, error } = await supabase
        .from("agents")
        .select("id, name, category, model, system_prompt, status, created_at, is_public")
        .eq("id", id)
        .single();

      if (error || !agentData || !agentData.is_public) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setAgent(agentData);

      const [snapRes, tradeRes] = await Promise.all([
        supabase
          .from("pnl_snapshots")
          .select("pnl_sol, win_rate, total_trades, snapshot_at")
          .eq("agent_id", id)
          .order("snapshot_at", { ascending: true }),
        supabase
          .from("trade_history")
          .select("id, token_symbol, action, pnl_sol, amount_sol, created_at")
          .eq("agent_id", id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const snaps = snapRes.data ?? [];
      const latest = snaps.length > 0 ? snaps[snaps.length - 1] : null;
      setSnapshots(snaps);
      setLatestSnap(latest);
      setRecentTrades(tradeRes.data ?? []);

      // Compute rank among all public agents by latest PnL
      if (latest) {
        const { data: allSnaps } = await supabase
          .from("pnl_snapshots")
          .select("agent_id, pnl_sol, snapshot_at")
          .order("snapshot_at", { ascending: false });

        if (allSnaps) {
          // Keep only the most recent snapshot per agent
          const latestByAgent = new Map<string, number>();
          for (const s of allSnaps) {
            if (!latestByAgent.has(s.agent_id)) latestByAgent.set(s.agent_id, s.pnl_sol);
          }
          // Sort descending by pnl
          const sorted = [...latestByAgent.entries()].sort((a, b) => b[1] - a[1]);
          const position = sorted.findIndex(([aid]) => aid === id);
          if (position !== -1) setRank(position + 1);
        }
      }

      setLoading(false);

      // Inject dynamic OG meta tags
      if (agentData && latest) {
        const pnlSign = latest.pnl_sol >= 0 ? "+" : "";
        const pnlText = `${pnlSign}${latest.pnl_sol.toFixed(3)} SOL`;
        const winText = `${latest.win_rate?.toFixed(0) ?? "?"}% win rate`;
        const title = `${agentData.name} — ${pnlText} | DeployX402`;
        const desc = `AI trading agent on Solana · ${pnlText} PnL · ${winText} over ${latest.total_trades} trades. Copy-trade this agent on DeployX402.`;
        const url = window.location.href;

        document.title = title;
        setMeta("og:title", title);
        setMeta("twitter:title", title);
        setMeta("og:description", desc);
        setMeta("twitter:description", desc);
        setMeta("og:url", url);
        setMeta("twitter:card", "summary_large_image");
        setMeta("og:type", "website");
      }
    };

    fetchData();

    // Restore default meta on unmount
    return () => { restoreDefaultMeta(); };
  }, [id]);

  // Fire confetti once when positive PnL loads
  useEffect(() => {
    if (latestSnap && latestSnap.pnl_sol > 0 && !confettiFired.current) {
      confettiFired.current = true;
      const end = Date.now() + 1800;
      const colors = ["#3ddc84", "#22c55e", "#86efac", "#ffffff"];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
          ticks: 180,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
          ticks: 180,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [latestSnap]);

  const handleCopyTrade = async () => {
    if (!authenticated) { navigate("/auth"); return; }
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
      toast({ title: "Agent copied!", description: `"${newAgent.name}" added to your dashboard.` });
      navigate(`/agent/${newAgent.id}`);
    } catch {
      toast({ title: "Failed to copy", description: "Please try again.", variant: "destructive" });
    } finally {
      setCopying(false);
    }
  };

  const handleCopyLink = async () => {
    setCopyingLink(true);
    await navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Share this URL anywhere." });
    setCopyingLink(false);
  };

  const handleShare = () => {
    if (!agent || !latestSnap) return;
    const url = window.location.href;
    const pnlText = `${latestSnap.pnl_sol >= 0 ? "+" : ""}${latestSnap.pnl_sol.toFixed(3)} SOL`;
    const text = `🤖 Check out "${agent.name}" on @DeployX402\n\n📈 PnL: ${pnlText}\n🎯 Win Rate: ${latestSnap.win_rate.toFixed(0)}% — ${latestSnap.total_trades} trades\n\nAutonomous AI trading on Solana 👇`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !agent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <span className="text-2xl font-mono font-bold text-foreground">Agent not found</span>
        <p className="text-sm font-mono text-muted-foreground">This agent is private or does not exist.</p>
        <button
          onClick={() => navigate("/leaderboard")}
          className="flex items-center gap-2 text-xs font-mono text-primary border border-primary/30 px-4 py-2 hover:bg-primary/10 transition-all"
        >
          View leaderboard <ArrowLeft className="h-3 w-3 rotate-180" />
        </button>
      </div>
    );
  }

  const pnlPositive = (latestSnap?.pnl_sol ?? 0) >= 0;
  const chartData = snapshots.map((s, i) => ({
    i,
    pnl: parseFloat(s.pnl_sol.toFixed(4)),
    label: new Date(s.snapshot_at).toLocaleDateString(),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex h-12 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/leaderboard")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-primary font-mono text-[10px]">◆</span>
            <span className="text-xs font-mono font-medium">DeployX402</span>
            <span className="text-[10px] text-muted-foreground font-mono">/ agent profile</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              disabled={copyingLink}
              className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border/50 px-3 py-1.5 hover:border-border transition-all disabled:opacity-50"
            >
              {copyingLink ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Link className="h-2.5 w-2.5" />} Copy Link
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border/50 px-3 py-1.5 hover:border-border transition-all"
            >
              <Share2 className="h-2.5 w-2.5" /> Share on X
            </button>
            <button
              onClick={handleCopyTrade}
              disabled={copying}
              className="flex items-center gap-1.5 text-[10px] font-mono text-primary border border-primary/30 bg-primary/10 px-3 py-1.5 hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {copying ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Copy className="h-2.5 w-2.5" />}
              Copy Trade
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-8">
        {/* Agent header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-sm">
              {agent.category}
            </span>
            <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-mono text-primary uppercase">{agent.status}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-mono font-bold text-foreground">{agent.name}</h1>
            {rank !== null && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, type: "spring", stiffness: 300 }}
                className={`flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-sm border ${
                  rank === 1
                    ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
                    : rank <= 3
                    ? "text-orange-400 bg-orange-400/10 border-orange-400/30"
                    : "text-muted-foreground bg-muted/50 border-border/50"
                }`}
              >
                <Trophy className="h-2.5 w-2.5" />
                #{rank} Ranked
              </motion.span>
            )}
            {pnlPositive && latestSnap && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary-foreground bg-primary px-2 py-1 rounded-sm"
              >
                🏆 Profitable
              </motion.span>
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground">{agent.model}</p>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {[
            {
              label: "Cumulative PnL",
              value: latestSnap
                ? `${pnlPositive ? "+" : ""}${latestSnap.pnl_sol.toFixed(3)} SOL`
                : "—",
              icon: pnlPositive ? TrendingUp : TrendingDown,
              positive: pnlPositive,
            },
            {
              label: "Win Rate",
              value: latestSnap ? `${latestSnap.win_rate?.toFixed(0) ?? "?"}%` : "—",
              icon: Zap,
              positive: (latestSnap?.win_rate ?? 0) >= 50,
            },
            {
              label: "Total Trades",
              value: latestSnap ? latestSnap.total_trades.toString() : "—",
              icon: BarChart3,
              positive: true,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`flex flex-col gap-2 border rounded-lg p-4 transition-all ${
                stat.positive
                  ? "border-border/50 bg-card/30"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`h-3 w-3 ${stat.positive ? "text-primary" : "text-destructive"}`} />
                <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <span className={`text-2xl font-mono font-bold tabular-nums ${stat.positive ? "text-foreground" : "text-destructive"}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Equity curve */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border border-border/50 bg-card/30 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono font-semibold text-foreground">Equity Curve</span>
            </div>
            <span className={`text-[9px] font-mono ${pnlPositive ? "text-primary" : "text-destructive"}`}>
              {pnlPositive ? "▲" : "▼"} All-time PnL
            </span>
          </div>
          <div className="p-4">
            {chartData.length > 1 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pubGradient" x1="0" y1="0" x2="0" y2="1">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontFamily: "monospace",
                      }}
                      formatter={(v: number) => [`${v.toFixed(4)} SOL`, "PnL"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="pnl"
                      stroke={pnlPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                      strokeWidth={1.5}
                      fill="url(#pubGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <span className="text-xs font-mono text-muted-foreground">Not enough data yet</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent trades */}
        {recentTrades.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border border-border/50 bg-card/30 rounded-xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono font-semibold text-foreground">Recent Trades</span>
            </div>
            <div className="divide-y divide-border/30">
              {recentTrades.map((trade) => {
                const isPositive = (trade.pnl_sol ?? 0) >= 0;
                return (
                  <div key={trade.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-sm ${
                        trade.action === "buy"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {trade.action}
                      </span>
                      <span className="text-xs font-mono font-semibold text-foreground">{trade.token_symbol}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-muted-foreground tabular-nums">
                        {trade.amount_sol.toFixed(4)} SOL
                      </span>
                      {trade.pnl_sol !== null && (
                        <span className={`text-xs font-mono font-bold tabular-nums ${isPositive ? "text-primary" : "text-destructive"}`}>
                          {isPositive ? "+" : ""}{trade.pnl_sol.toFixed(4)} SOL
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* CTA block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border border-primary/20 bg-primary/5 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <p className="text-sm font-mono font-semibold text-foreground">Deploy your own AI trading agent</p>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Fully autonomous · Solana · Jupiter + Raydium
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyTrade}
              disabled={copying}
              className="flex items-center gap-2 px-4 py-2 border border-primary/40 bg-primary/10 text-xs font-mono text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {copying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
              Copy This Agent
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2 px-4 py-2 border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
            >
              Get Started <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AgentPublicProfile;
