import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthContext";
import { useWallet } from "@/components/WalletContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Play, Square, RotateCcw, Trash2, ArrowLeft,
  Rocket, Bot, Loader2, TrendingUp, Wallet, DollarSign, BarChart3, Eye,
} from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import { motion, AnimatePresence } from "framer-motion";

const STRATEGIES = [
  "Pump.fun Sniper", "DCA + Momentum", "Social Alpha",
  "Mean Reversion", "Low-Cap Gems", "Copy Trader", "Custom",
];

const RISK_LEVELS = [
  { value: "low", label: "Conservative" },
  { value: "medium", label: "Balanced" },
  { value: "high", label: "Aggressive" },
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
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState("");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [fundAmount, setFundAmount] = useState("");
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

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !strategy) return;
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Error", description: "Not authenticated", variant: "destructive" }); setCreating(false); return; }
    const { error } = await supabase.from("agents").insert({
      name, category: strategy, model: `risk:${riskLevel}`,
      system_prompt: fundAmount ? `fund:${fundAmount}` : null, user_id: user.id, status: "stopped",
    });
    if (error) toast({ title: "Deploy failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Agent deployed!", description: `${name} is ready.` }); setName(""); setStrategy(""); setRiskLevel("medium"); setFundAmount(""); setShowForm(false); fetchAgents(); }
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
  const getRiskLabel = (m: string) => m.startsWith("risk:") ? (RISK_LEVELS.find(r => r.value === m.replace("risk:", ""))?.label || m) : m;
  const getFundAmount = (p: string | null) => p?.startsWith("fund:") ? p.replace("fund:", "") + " SOL" : "—";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-12 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono text-[10px]">◆</span>
              <span className="text-xs font-mono font-medium">solagent</span>
              <span className="text-[10px] text-muted-foreground font-mono">/ dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <span className="text-[10px] font-mono text-muted-foreground">{shortAddress}</span>
                {balance !== null && <span className="text-[10px] font-mono text-primary">{balance.toFixed(2)} SOL</span>}
                <button onClick={disconnect} className="text-[10px] font-mono text-muted-foreground hover:text-foreground ml-2">disconnect</button>
              </>
            ) : (
              <button onClick={connect} className="text-xs font-mono text-primary hover:text-primary/80 flex items-center gap-1.5">
                <Wallet className="h-3 w-3" /> connect
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: "Funded", value: `${agents.reduce((s, a) => s + (parseFloat(getFundAmount(a.system_prompt)) || 0), 0).toFixed(2)} SOL`, icon: DollarSign },
            { label: "Active", value: agents.filter(a => a.status === "running").length.toString(), icon: Bot },
            { label: "PnL", value: `${agents.reduce((s, a) => s + mockPnl(a.id), 0).toFixed(1)} SOL`, icon: BarChart3 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <s.icon className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</p>
                <p className="text-sm font-mono font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-medium">Agents</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/browse")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
              browse marketplace
            </button>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-xs font-mono text-primary hover:bg-primary/20 transition-colors">
              <Plus className="h-3 w-3" /> new agent
            </button>
          </div>
        </div>

        {/* Deploy form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <form onSubmit={handleDeploy} className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-mono font-medium">deploy agent</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">name</label>
                    <Input placeholder="alpha-sniper" value={name} onChange={(e) => setName(e.target.value)} required className="bg-secondary/50 border-border h-9 font-mono text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">strategy</label>
                    <Select value={strategy} onValueChange={setStrategy} required>
                      <SelectTrigger className="bg-secondary/50 border-border h-9 font-mono text-xs"><SelectValue placeholder="select" /></SelectTrigger>
                      <SelectContent>{STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">risk</label>
                    <Select value={riskLevel} onValueChange={setRiskLevel}>
                      <SelectTrigger className="bg-secondary/50 border-border h-9 font-mono text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{RISK_LEVELS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">fund (sol)</label>
                    <Input type="number" step="0.01" min="0" placeholder="0.5" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} className="bg-secondary/50 border-border h-9 font-mono text-xs" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={creating || !name || !strategy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />} deploy
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">cancel</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-border">
            <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No agents deployed yet.</p>
            <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-xs font-mono text-primary hover:bg-primary/20 transition-colors">
              <Plus className="h-3 w-3 inline mr-1" /> deploy first agent
            </button>
          </div>
        ) : (
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
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-border/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${isRunning ? "bg-primary" : "bg-muted-foreground"}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium truncate">{agent.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{agent.category}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">{getRiskLabel(agent.model)}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">· {getFundAmount(agent.system_prompt)}</span>
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;
