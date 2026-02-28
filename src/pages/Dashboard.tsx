import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthContext";
import { useWallet } from "@/components/WalletContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Play,
  Square,
  RotateCcw,
  Trash2,
  ArrowLeft,
  Rocket,
  Bot,
  Loader2,
  TrendingUp,
  Wallet,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STRATEGIES = [
  "Pump.fun Sniper",
  "DCA + Momentum",
  "Social Alpha",
  "Mean Reversion",
  "Low-Cap Gems",
  "Copy Trader",
  "Custom",
];

const RISK_LEVELS = [
  { value: "low", label: "Low Risk (Conservative)" },
  { value: "medium", label: "Medium Risk (Balanced)" },
  { value: "high", label: "High Risk (Aggressive)" },
];

interface Agent {
  id: string;
  name: string;
  category: string;
  model: string;
  status: string;
  system_prompt: string | null;
  created_at: string;
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
    if (!authenticated && !connected) {
      navigate("/auth");
      return;
    }
    fetchAgents();
  }, [authenticated, connected, navigate]);

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setAgents(data || []);
    }
    setLoading(false);
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !strategy) return;
    setCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
      setCreating(false);
      return;
    }

    const { error } = await supabase.from("agents").insert({
      name,
      category: strategy,
      model: `risk:${riskLevel}`,
      system_prompt: fundAmount ? `fund:${fundAmount}` : null,
      user_id: user.id,
      status: "stopped",
    });

    if (error) {
      toast({ title: "Deploy failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Agent deployed!", description: `${name} is ready to trade.` });
      setName("");
      setStrategy("");
      setRiskLevel("medium");
      setFundAmount("");
      setShowForm(false);
      fetchAgents();
    }
    setCreating(false);
  };

  const updateStatus = async (agentId: string, newStatus: string) => {
    setActingOn(agentId);
    const { error } = await supabase
      .from("agents")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", agentId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status: newStatus } : a))
      );
      toast({ title: `Agent ${newStatus === "running" ? "started trading" : newStatus}` });
    }
    setActingOn(null);
  };

  const deleteAgent = async (agentId: string) => {
    setActingOn(agentId);
    const { error } = await supabase.from("agents").delete().eq("id", agentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
      toast({ title: "Agent deleted" });
    }
    setActingOn(null);
  };

  const statusColor = (status: string) => {
    if (status === "running") return "text-green-400";
    if (status === "deploying") return "text-yellow-400";
    return "text-muted-foreground";
  };

  const statusDot = (status: string) => {
    if (status === "running") return "bg-green-400";
    if (status === "deploying") return "bg-yellow-400";
    return "bg-muted-foreground";
  };

  // Mock PnL data per agent
  const mockPnl = (id: string) => {
    const hash = id.charCodeAt(0) + id.charCodeAt(1);
    const pnl = ((hash % 80) - 20) / 10;
    return pnl;
  };

  const getRiskLabel = (model: string) => {
    if (model.startsWith("risk:")) {
      const level = model.replace("risk:", "");
      return RISK_LEVELS.find(r => r.value === level)?.label || level;
    }
    return model;
  };

  const getFundAmount = (prompt: string | null) => {
    if (prompt?.startsWith("fund:")) return prompt.replace("fund:", "") + " SOL";
    return "—";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <nav className="border-b border-border/50 bg-background/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="SolAgent" className="h-8 w-8 rounded-lg" />
              <span className="text-lg font-bold tracking-tight">Trading Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {connected ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs">
                  <Wallet className="h-3 w-3 text-primary" />
                  <span className="text-foreground font-medium">{shortAddress}</span>
                  {balance !== null && (
                    <span className="text-muted-foreground">{balance.toFixed(2)} SOL</span>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={disconnect} className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
                  Disconnect
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={connect} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Wallet className="h-3.5 w-3.5 mr-1.5" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Funded", value: `${agents.reduce((sum, a) => sum + (parseFloat(getFundAmount(a.system_prompt)) || 0), 0).toFixed(2)} SOL`, icon: DollarSign },
            { label: "Active Agents", value: agents.filter(a => a.status === "running").length.toString(), icon: Bot },
            { label: "Total PnL", value: `${agents.reduce((sum, a) => sum + mockPnl(a.id), 0).toFixed(1)} SOL`, icon: BarChart3 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-extrabold text-foreground">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Your Trading Agents</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Deploy, fund, and manage your AI trading agents on Solana.
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Button>
        </div>

        {/* Create Agent Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <form onSubmit={handleDeploy} className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Deploy Trading Agent
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Agent Name</label>
                    <Input placeholder="My Sniper Bot" value={name} onChange={(e) => setName(e.target.value)} required className="bg-secondary border-border" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Strategy</label>
                    <Select value={strategy} onValueChange={setStrategy} required>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        {STRATEGIES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Risk Level</label>
                    <Select value={riskLevel} onValueChange={setRiskLevel}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RISK_LEVELS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Fund Amount (SOL)</label>
                    <Input type="number" step="0.01" min="0" placeholder="0.5" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} className="bg-secondary border-border" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={creating || !name || !strategy} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                    {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                    Deploy Agent
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-border text-muted-foreground">
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agents list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-border/60">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-1">No trading agents yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Deploy your first agent to start trading memecoins.
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {agents.map((agent, i) => {
              const pnl = mockPnl(agent.id);
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold truncate">{agent.name}</h3>
                        <span className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${statusDot(agent.status)}`} />
                          <span className={`text-xs font-medium capitalize ${statusColor(agent.status)}`}>
                            {agent.status === "running" ? "Trading" : agent.status}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/5 text-primary/80 border border-primary/10">
                          {agent.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {getRiskLabel(agent.model)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Funded: {getFundAmount(agent.system_prompt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* PnL display */}
                    <div className="text-right mr-2">
                      <div className={`text-sm font-bold ${pnl >= 0 ? "text-green-400" : "text-destructive"}`}>
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} SOL
                      </div>
                      <p className="text-[10px] text-muted-foreground">PnL</p>
                    </div>

                    {agent.status === "stopped" ? (
                      <Button size="sm" onClick={() => updateStatus(agent.id, "running")} disabled={actingOn === agent.id} className="bg-green-600 hover:bg-green-700 text-primary-foreground font-semibold">
                        <Play className="h-3.5 w-3.5 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(agent.id, "stopped")} disabled={actingOn === agent.id} className="border-border text-muted-foreground hover:text-foreground">
                        <Square className="h-3.5 w-3.5 mr-1" />
                        Stop
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={async () => { await updateStatus(agent.id, "stopped"); await updateStatus(agent.id, "running"); }} disabled={actingOn === agent.id || agent.status === "stopped"} className="border-border text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteAgent(agent.id)} disabled={actingOn === agent.id} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
