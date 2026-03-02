import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthContext";
import { useWallet } from "@/components/WalletContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Square, RotateCcw, Trash2, ArrowLeft,
  Bot, Loader2, Eye, Info, Wallet, Copy, ExternalLink,
  TrendingUp, TrendingDown, BarChart3, Target,
} from "lucide-react";
import AgentNetwork from "@/components/AgentNetwork";
import ActivityFeed from "@/components/ActivityFeed";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const AGENT_TYPES = [
  { value: "scalper", label: "Scalper – Quick trades, small gains" },
  { value: "dca", label: "DCA – Dollar cost averaging" },
  { value: "sniper", label: "Sniper – Token launch hunter" },
  { value: "momentum", label: "Momentum – Trend follower" },
  { value: "social", label: "Social Alpha – Signal-based" },
  { value: "custom", label: "Custom – Build your own" },
];

interface Agent {
  id: string; name: string; category: string; model: string;
  status: string; system_prompt: string | null; created_at: string;
}

const Dashboard = () => {
  const { authenticated, userDisplay } = useAuth();
  const { connected, connect, shortAddress, balance, disconnect } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentPnl, setAgentPnl] = useState<Record<string, number>>({});
  const [agentWallets, setAgentWallets] = useState<Record<string, { public_key: string; balance_sol: number }>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [agentType, setAgentType] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [simInterval, setSimInterval] = useState<NodeJS.Timeout | null>(null);
  const [portfolioSnapshots, setPortfolioSnapshots] = useState<{ date: string; pnl: number }[]>([]);
  const [openPositionsCount, setOpenPositionsCount] = useState(0);
  const [portfolioUsd, setPortfolioUsd] = useState<{ totalUsd: number; entryUsd: number } | null>(null);

  useEffect(() => {
    if (!authenticated && !connected) { navigate("/auth"); return; }
    fetchAgents();
  }, [authenticated, connected, navigate]);

  // Run simulated trades every 15s when any agent is running
  useEffect(() => {
    const hasRunning = agents.some((a) => a.status === "running");
    if (hasRunning) {
      const runSim = () => supabase.functions.invoke("execute-trades").catch(console.error);
      runSim();
      const id = setInterval(runSim, 15000);
      setSimInterval(id);
      return () => clearInterval(id);
    } else if (simInterval) {
      clearInterval(simInterval);
      setSimInterval(null);
    }
  }, [agents.map((a) => `${a.id}:${a.status}`).join(",")]);

  // Realtime: refresh PnL whenever a new pnl_snapshot is inserted
  useEffect(() => {
    if (agents.length === 0) return;
    const channel = supabase
      .channel("dashboard-pnl-snapshots")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pnl_snapshots" },
        (payload) => {
          const snap = payload.new as { agent_id: string; pnl_sol: number };
          setAgentPnl((prev) => ({ ...prev, [snap.agent_id]: snap.pnl_sol }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [agents.length]);

  const fetchAgents = async () => {
    const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setLoading(false); return; }
    const agentList = data || [];
    setAgents(agentList);

    if (agentList.length > 0) {
      const ids = agentList.map((a) => a.id);

      // Fetch latest pnl_snapshot for each agent + all snapshots for equity curve + open positions
      const [snapsRes, allSnapsRes, positionsRes] = await Promise.all([
        supabase.from("pnl_snapshots").select("agent_id, pnl_sol, snapshot_at").in("agent_id", ids).order("snapshot_at", { ascending: false }),
        supabase.from("pnl_snapshots").select("agent_id, pnl_sol, snapshot_at").in("agent_id", ids).order("snapshot_at", { ascending: true }),
        supabase.from("agent_positions").select("id").in("agent_id", ids).eq("status", "open"),
      ]);

      if (snapsRes.data) {
        const latestMap: Record<string, number> = {};
        snapsRes.data.forEach((s) => { if (!(s.agent_id in latestMap)) latestMap[s.agent_id] = s.pnl_sol; });
        setAgentPnl(latestMap);
      }

      // Build combined equity curve: sum PnL across all agents per day
      if (allSnapsRes.data && allSnapsRes.data.length > 0) {
        const dailyMap: Record<string, number> = {};
        allSnapsRes.data.forEach((s) => {
          const day = new Date(s.snapshot_at).toLocaleDateString("en", { month: "short", day: "numeric" });
          dailyMap[day] = (dailyMap[day] ?? 0) + s.pnl_sol;
        });
        const curve = Object.entries(dailyMap).map(([date, pnl]) => ({ date, pnl: parseFloat(pnl.toFixed(4)) }));
        setPortfolioSnapshots(curve);
      }

      setOpenPositionsCount(positionsRes.data?.length ?? 0);

      // Fetch wallets for all agents
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) {
        const walletRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/agent_wallets?agent_id=in.(${ids.join(",")})&select=agent_id,public_key,balance_sol`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } }
        );
        const walletData = await walletRes.json();
        if (Array.isArray(walletData)) {
          const wMap: Record<string, { public_key: string; balance_sol: number }> = {};
          walletData.forEach((w: any) => { wMap[w.agent_id] = { public_key: w.public_key, balance_sol: w.balance_sol }; });
          setAgentWallets(wMap);

          // Fetch USD portfolio value from on-chain positions
          const openPosRes = await supabase
            .from("agent_positions")
            .select("token_address, token_amount, entry_price")
            .in("agent_id", ids)
            .eq("status", "open");
          if (openPosRes.data && openPosRes.data.length > 0) {
            const entryUsd = openPosRes.data.reduce((sum, p) => sum + p.entry_price * p.token_amount, 0);
            // Fetch current prices for unique tokens
            const uniqueMints = [...new Set(openPosRes.data.map(p => p.token_address).filter(Boolean))];
            let currentUsd = 0;
            await Promise.allSettled(uniqueMints.map(async (mint) => {
              try {
                const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
                const data = await res.json();
                const priceUsd = parseFloat(data.pairs?.[0]?.priceUsd || "0");
                if (priceUsd > 0) {
                  const posForMint = openPosRes.data!.filter(p => p.token_address === mint);
                  posForMint.forEach(p => { currentUsd += priceUsd * p.token_amount; });
                }
              } catch { /* silent */ }
            }));
            if (currentUsd > 0 || entryUsd > 0) setPortfolioUsd({ totalUsd: currentUsd, entryUsd });
          }
        }
      }
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!agentType) return;
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Error", description: "Not authenticated", variant: "destructive" }); setCreating(false); return; }
    const name = `${agentType}-${Date.now().toString(36).slice(-4)}`;
    const { data: newAgent, error } = await supabase.from("agents").insert({
      name, category: agentType, model: "risk:medium",
      system_prompt: null, user_id: user.id, status: "stopped",
      is_public: true,
    }).select("id").single();
    if (error) {
      toast({ title: "Deploy failed", description: error.message, variant: "destructive" });
    } else {
      // Auto-generate wallet for the new agent
      try {
        const { data: walletData } = await supabase.functions.invoke("generate-wallet", {
          body: { agent_id: newAgent.id },
        });
        toast({
          title: "Agent deployed!",
          description: walletData?.public_key
            ? `${name} · Wallet: ${walletData.public_key.slice(0, 6)}...${walletData.public_key.slice(-4)}`
            : `${name} is ready.`,
        });
      } catch {
        toast({ title: "Agent created!", description: `${name} is ready. Generate a wallet from the agent detail page.` });
      }
      setAgentType("");
      fetchAgents();
    }
    setCreating(false);
  };

  const updateStatus = async (agentId: string, newStatus: string) => {
    setActingOn(agentId);
    const { error } = await supabase.from("agents").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", agentId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, status: newStatus } : a))); toast({ title: `Agent ${newStatus === "running" ? "started" : newStatus}` }); }
    setActingOn(null);
  };

  const deleteAgent = async (agentId: string) => {
    setActingOn(agentId);
    const { error } = await supabase.from("agents").delete().eq("id", agentId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setAgents((prev) => prev.filter((a) => a.id !== agentId)); toast({ title: "Agent deleted" }); }
    setActingOn(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono text-xs">◆</span>
              <span className="text-sm font-mono font-medium">solagent</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <button onClick={() => navigate("/dashboard")} className="text-xs font-mono text-foreground nav-link-underline">Admin</button>
            <button onClick={() => navigate("/docs")} className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors nav-link-underline">Docs</button>
            <button onClick={() => navigate("/browse")} className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors nav-link-underline">Browse Agents</button>
          </div>
          <div className="flex items-center gap-3">
            {connected ? (
              <>
                <span className="text-[10px] font-mono text-muted-foreground">{shortAddress}</span>
                {balance !== null && <span className="text-[10px] font-mono text-primary">{balance.toFixed(2)} SOL</span>}
                <button onClick={disconnect} className="text-[10px] font-mono text-muted-foreground hover:text-foreground ml-1">disconnect</button>
              </>
            ) : authenticated ? (
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold text-primary uppercase">
                    {userDisplay?.charAt(0) ?? "U"}
                  </span>
                </div>
                <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors border border-border/50 px-2 py-1 rounded-md">sign out</button>
              </div>
            ) : (
              <button onClick={() => navigate("/auth")} className="px-4 py-1.5 rounded-full border border-border text-xs font-mono text-foreground hover:bg-secondary transition-colors">
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Top section: Create + Network */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Left — Create agent */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Logo + heading */}
              <div className="flex items-center gap-4 mb-10">
                <div className="h-16 w-16 rounded-2xl bg-card border border-border flex items-center justify-center">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-medium text-foreground tracking-tight">
                    Create an AI trading agent.
                  </h1>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Agent type selector card */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-xs font-mono font-medium text-foreground mb-1">Choose your agent type</h3>
                <p className="text-[10px] font-mono text-muted-foreground mb-5">Select a trading preset to get started</p>
                <div className="flex items-center gap-3">
                  <Select value={agentType} onValueChange={setAgentType}>
                    <SelectTrigger className="flex-1 bg-secondary/50 border-border h-11 font-mono text-xs">
                      <SelectValue placeholder="Select an agent type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="font-mono text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !agentType}
                    className="px-6 py-2.5 rounded-lg border border-border bg-secondary text-sm font-mono text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-40"
                  >
                    {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right — Agent Network */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <AgentNetwork agents={agents} />
          </motion.div>
        </div>

        {/* Portfolio Overview */}
        {!loading && agents.length > 0 && (() => {
          const totalPnl = Object.values(agentPnl).reduce((a, b) => a + b, 0);
          const runningCount = agents.filter((a) => a.status === "running").length;
          const pnlPos = totalPnl >= 0;
          return (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="mb-10 rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                  <h2 className="text-xs font-mono font-medium text-foreground uppercase tracking-wider">Portfolio Overview</h2>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{agents.length} agents</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-secondary/40 border border-border p-3 flex items-center gap-3">
                  {pnlPos ? <TrendingUp className="h-4 w-4 text-primary shrink-0" /> : <TrendingDown className="h-4 w-4 text-destructive shrink-0" />}
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Total PnL</p>
                    <p className={`text-sm font-mono font-bold ${pnlPos ? "text-primary" : "text-destructive"}`}>
                      {pnlPos ? "+" : ""}{totalPnl.toFixed(3)} SOL
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/40 border border-border p-3 flex items-center gap-3">
                  <Target className="h-4 w-4 text-primary/70 shrink-0" />
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Open Positions</p>
                    <p className="text-sm font-mono font-bold text-foreground">{openPositionsCount}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/40 border border-border p-3 flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${runningCount > 0 ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Active Agents</p>
                    <p className="text-sm font-mono font-bold text-foreground">{runningCount} / {agents.length}</p>
                  </div>
                </div>
              </div>

              {/* USD Portfolio Value */}
              {portfolioUsd && (
                <div className="rounded-lg border border-border bg-secondary/20 p-4 mb-5">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                    Live USD Portfolio Value
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Current</p>
                      <p className="text-base font-mono font-bold text-foreground">
                        {portfolioUsd.totalUsd > 0 ? `$${portfolioUsd.totalUsd.toFixed(2)}` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Entry</p>
                      <p className="text-base font-mono font-bold text-foreground">
                        {portfolioUsd.entryUsd > 0 ? `$${portfolioUsd.entryUsd.toFixed(2)}` : "—"}
                      </p>
                    </div>
                    <div>
                      {(() => {
                        const pnlUsd = portfolioUsd.totalUsd - portfolioUsd.entryUsd;
                        const pnlPct = portfolioUsd.entryUsd > 0 ? (pnlUsd / portfolioUsd.entryUsd) * 100 : null;
                        const up = pnlUsd >= 0;
                        return (
                          <>
                            <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Unrealized PnL</p>
                            <p className={`text-base font-mono font-bold ${portfolioUsd.totalUsd > 0 && portfolioUsd.entryUsd > 0 ? (up ? "text-primary" : "text-destructive") : "text-foreground"}`}>
                              {portfolioUsd.totalUsd > 0 && portfolioUsd.entryUsd > 0
                                ? `${up ? "+" : ""}$${pnlUsd.toFixed(2)}`
                                : "—"}
                            </p>
                            {pnlPct !== null && portfolioUsd.totalUsd > 0 && (
                              <p className={`text-[10px] font-mono mt-0.5 ${up ? "text-primary/70" : "text-destructive/70"}`}>
                                {up ? "+" : ""}{pnlPct.toFixed(2)}%
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {portfolioSnapshots.length > 0 ? (
                <div>
                  <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Combined Equity Curve</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={portfolioSnapshots}>
                      <defs>
                        <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10, fontFamily: "JetBrains Mono" }}
                        formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(4)} SOL`, "PnL"]}
                      />
                      <Area type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" fill="url(#portfolioGrad)" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center rounded-lg bg-secondary/20 border border-dashed border-border">
                  <p className="text-[10px] font-mono text-muted-foreground">Equity curve appears after first trades</p>
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* Deployed agents */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        ) : agents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono font-medium text-foreground">Deployed Agents</h2>
              <span className="text-[10px] font-mono text-muted-foreground">{agents.length} total</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-2">
                {agents.map((agent, i) => {
                  const pnl = agentPnl[agent.id] ?? null;
                  const isRunning = agent.status === "running";
                  const agentWallet = agentWallets[agent.id] ?? null;
                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.04 }}
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                      className={`relative rounded-xl border border-border bg-card flex flex-col transition-colors duration-200 hover:border-primary/20 overflow-hidden ${agentWallet && agentWallet.balance_sol < 0.005 ? "border-destructive/30" : ""}`}
                    >
                      <div className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${agentWallet && agentWallet.balance_sol < 0.005 ? "pt-8" : ""}`}>
                      {/* Needs Funding banner */}
                      {agentWallet && agentWallet.balance_sol < 0.005 && (
                        <div className="absolute top-0 left-0 right-0 flex items-center gap-1.5 bg-destructive/10 border-b border-destructive/20 px-4 py-1">
                          <Wallet className="h-2.5 w-2.5 text-destructive shrink-0" />
                          <span className="text-[9px] font-mono text-destructive">Needs funding — </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/agent/${agent.id}?tab=wallet`); }}
                            className="text-[9px] font-mono text-destructive underline underline-offset-2 hover:text-destructive/80 transition-colors"
                          >
                            Add SOL →
                          </button>
                        </div>
                      )}

                      {/* Agent icon watermark */}
                      <span className={`absolute left-5 top-1/2 -translate-y-1/2 font-mono text-2xl pointer-events-none ${isRunning ? "text-primary/15" : "text-muted-foreground/10"}`}>◆</span>

                      <div className="flex items-center gap-3 min-w-0 relative z-10">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${isRunning ? "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" : "bg-muted-foreground"}`} />
                        <div className="min-w-0 ml-8">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium truncate">{agent.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{agent.category}</span>
                          </div>
                          {agentWallet ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Wallet className="h-2.5 w-2.5 text-muted-foreground" />
                              <span className="text-[9px] font-mono text-muted-foreground">
                                {agentWallet.public_key.slice(0, 4)}...{agentWallet.public_key.slice(-4)}
                              </span>
                              <span className={`text-[9px] font-mono font-medium ${agentWallet.balance_sol >= 0.005 ? "text-primary" : "text-destructive"}`}>
                                {agentWallet.balance_sol.toFixed(4)} SOL
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(agentWallet.public_key); }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="Copy wallet address"
                              >
                                <Copy className="h-2.5 w-2.5" />
                              </button>
                              <a
                                href={`https://solscan.io/account/${agentWallet.public_key}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="View on Solscan"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-[9px] font-mono text-muted-foreground mt-0.5 block">no wallet · go to agent detail</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-mono font-bold ${pnl === null ? "text-muted-foreground" : pnl >= 0 ? "text-primary" : "text-destructive"}`}>
                          {pnl === null ? "—" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} SOL`}
                        </span>

                        <button onClick={() => navigate(`/agent/${agent.id}`)} className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Eye className="h-3 w-3" />
                        </button>
                        {agent.status === "stopped" ? (
                          <button onClick={() => updateStatus(agent.id, "running")} disabled={actingOn === agent.id} className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50">
                            <Play className="h-3 w-3" />
                          </button>
                        ) : (
                          <button onClick={() => updateStatus(agent.id, "stopped")} disabled={actingOn === agent.id} className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                            <Square className="h-3 w-3" />
                          </button>
                        )}
                        <button onClick={async () => { await updateStatus(agent.id, "stopped"); await updateStatus(agent.id, "running"); }} disabled={actingOn === agent.id || agent.status === "stopped"} className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                          <RotateCcw className="h-3 w-3" />
                        </button>
                        <button onClick={() => deleteAgent(agent.id)} disabled={actingOn === agent.id} className="p-1.5 rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="lg:col-span-1">
                <ActivityFeed agentIds={agents.map((a) => a.id)} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
