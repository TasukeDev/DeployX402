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
  Bot, Loader2, Eye, Info,
} from "lucide-react";
import AgentNetwork from "@/components/AgentNetwork";
import ActivityFeed from "@/components/ActivityFeed";
import { motion, AnimatePresence } from "framer-motion";

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
  const { authenticated } = useAuth();
  const { connected, connect, shortAddress, balance, disconnect } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentPnl, setAgentPnl] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [agentType, setAgentType] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [simInterval, setSimInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authenticated && !connected) { navigate("/auth"); return; }
    fetchAgents();
  }, [authenticated, connected, navigate]);

  // Run simulated trades every 15s when any agent is running
  useEffect(() => {
    const hasRunning = agents.some((a) => a.status === "running");
    if (hasRunning) {
      const runSim = () => supabase.functions.invoke("simulate-trades").catch(console.error);
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

    // Fetch latest pnl_snapshot for each agent
    if (agentList.length > 0) {
      const ids = agentList.map((a) => a.id);
      const { data: snaps } = await supabase
        .from("pnl_snapshots")
        .select("agent_id, pnl_sol, snapshot_at")
        .in("agent_id", ids)
        .order("snapshot_at", { ascending: false });

      if (snaps) {
        // Keep only the latest snapshot per agent
        const latestMap: Record<string, number> = {};
        snaps.forEach((s) => {
          if (!(s.agent_id in latestMap)) latestMap[s.agent_id] = s.pnl_sol;
        });
        setAgentPnl(latestMap);
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
    const { error } = await supabase.from("agents").insert({
      name, category: agentType, model: "risk:medium",
      system_prompt: null, user_id: user.id, status: "stopped",
    });
    if (error) toast({ title: "Deploy failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Agent created!", description: `${name} is ready.` }); setAgentType(""); fetchAgents(); }
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
                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.04 }}
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                      className="relative rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors duration-200 hover:border-primary/20 overflow-hidden"
                    >
                      {/* Agent icon watermark */}
                      <span className={`absolute left-5 top-1/2 -translate-y-1/2 font-mono text-2xl pointer-events-none ${isRunning ? "text-primary/15" : "text-muted-foreground/10"}`}>◆</span>

                      <div className="flex items-center gap-3 min-w-0 relative z-10">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${isRunning ? "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" : "bg-muted-foreground"}`} />
                        <div className="min-w-0 ml-8">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium truncate">{agent.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{agent.category}</span>
                          </div>
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
