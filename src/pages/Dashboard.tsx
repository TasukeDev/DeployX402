import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthContext";
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
  Zap,
  Plus,
  Play,
  Square,
  RotateCcw,
  Trash2,
  ArrowLeft,
  Rocket,
  Bot,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentChat } from "@/components/AgentChat";
import { AgentAnalytics } from "@/components/AgentAnalytics";

const CATEGORIES = [
  "Full Runtime",
  "Any AI Provider",
  "Code Execution",
  "Browser Control",
  "Persistent Memory",
  "23+ Channels",
  "Scheduled Tasks",
  "Email Integration",
  "File Operations",
  "Real-Time Logs",
];

const MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (Fast)" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (Balanced)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (Powerful)" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini (Efficient)" },
  { value: "openai/gpt-5", label: "GPT-5 (Top Tier)" },
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
  const { authenticated, logout, userDisplay } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [model, setModel] = useState("google/gemini-3-flash-preview");
  const [systemPrompt, setSystemPrompt] = useState("");

  // Track which agent is being acted upon
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [chatAgent, setChatAgent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!authenticated) {
      navigate("/auth");
      return;
    }
    fetchAgents();
  }, [authenticated, navigate]);

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
    if (!name || !category) return;
    setCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
      setCreating(false);
      return;
    }

    const { error } = await supabase.from("agents").insert({
      name,
      category,
      model,
      system_prompt: systemPrompt || null,
      user_id: user.id,
      status: "stopped",
    });

    if (error) {
      toast({ title: "Deploy failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Agent deployed!", description: `${name} is ready to go.` });
      setName("");
      setCategory("");
      setModel("google/gemini-3-flash-preview");
      setSystemPrompt("");
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
      toast({ title: `Agent ${newStatus === "running" ? "started" : newStatus}` });
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <nav className="border-b border-border/50 bg-background/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {userDisplay}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={logout}
              className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10">
        {/* Analytics */}
        {agents.length > 0 && (
          <AgentAnalytics
            agentIds={agents.map((a) => a.id)}
            agentStatuses={Object.fromEntries(agents.map((a) => [a.id, a.status]))}
            agentCreatedAts={Object.fromEntries(agents.map((a) => [a.id, a.created_at]))}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Your Agents</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Deploy, manage, and control your AI agents.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold"
          >
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
              <form
                onSubmit={handleDeploy}
                className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 space-y-4"
              >
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Deploy New Agent
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Agent Name
                    </label>
                    <Input
                      placeholder="My Cool Agent"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Category
                    </label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      AI Model
                    </label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      System Prompt (optional)
                    </label>
                    <Input
                      placeholder="You are a helpful assistant..."
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={creating || !name || !category}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Rocket className="h-4 w-4 mr-2" />
                    )}
                    Deploy Agent
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-border text-muted-foreground"
                  >
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
            <h3 className="text-lg font-bold mb-1">No agents yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Deploy your first agent to get started.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {agents.map((agent, i) => (
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
                        <span
                          className={`h-2 w-2 rounded-full ${statusDot(agent.status)}`}
                        />
                        <span
                          className={`text-xs font-medium capitalize ${statusColor(agent.status)}`}
                        >
                          {agent.status}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/5 text-primary/80 border border-primary/10">
                        {agent.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {MODELS.find((m) => m.value === agent.model)?.label ?? agent.model}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setChatAgent({ id: agent.id, name: agent.name })}
                    disabled={agent.status !== "running"}
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    Chat
                  </Button>
                  {agent.status === "stopped" ? (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(agent.id, "running")}
                      disabled={actingOn === agent.id}
                      className="bg-green-600 hover:bg-green-700 text-primary-foreground font-semibold"
                    >
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Start
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(agent.id, "stopped")}
                      disabled={actingOn === agent.id}
                      className="border-border text-muted-foreground hover:text-foreground"
                    >
                      <Square className="h-3.5 w-3.5 mr-1" />
                      Stop
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await updateStatus(agent.id, "stopped");
                      await updateStatus(agent.id, "running");
                    }}
                    disabled={actingOn === agent.id || agent.status === "stopped"}
                    className="border-border text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Restart
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteAgent(agent.id)}
                    disabled={actingOn === agent.id}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Chat overlay */}
      <AnimatePresence>
        {chatAgent && (
          <AgentChat
            agentId={chatAgent.id}
            agentName={chatAgent.name}
            onClose={() => setChatAgent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
