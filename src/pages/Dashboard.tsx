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
  Plus, Play, Square, RotateCcw, Trash2, ArrowLeft,
  Rocket, Bot, Loader2, Eye, Wallet, Info,
} from "lucide-react";
import AgentNetwork from "@/components/AgentNetwork";
import ActivityFeed from "@/components/ActivityFeed";
import agentHalo from "@/assets/agent-halo.png";
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
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [agentType, setAgentType] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated && !connected) { navigate("/auth"); return; }
    fetchAgents();
  }, [authenticated, connected, navigate]);

  const fetchAgents = async () => {
    const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setAgents(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!agentType) return;
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Error", description: "Not authenticated", variant: "destructive" }); setCreating(false); return; }
    const typeMeta = AGENT_TYPES.find((t) => t.value === agentType);
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

  const mockPnl = (id: string) => { const h = id.charCodeAt(0) + id.charCodeAt(1); return ((h % 80) - 20) / 10; };

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
                  const pnl = mockPnl(agent.id);
                  const isRunning = agent.status === "running";
                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.04 }}
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                      className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors duration-200 hover:border-primary/20"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`relative h-9 w-9 rounded-full shrink-0 overflow-hidden border-2 ${isRunning ? "border-primary/40" : "border-border"}`}>
                          <img
                            src={agentHalo}
                            alt={agent.name}
                            className={`h-full w-full object-cover ${isRunning ? "drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "opacity-60 grayscale-[30%]"}`}
                          />
                          {isRunning && <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-primary border border-card" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium truncate">{agent.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{agent.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-mono font-bold ${pnl >= 0 ? "text-primary" : "text-destructive"}`}>
                          {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} SOL
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
