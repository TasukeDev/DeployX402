import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bot, Copy, Users, Search, Loader2, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { AgentChat } from "@/components/AgentChat";

interface PublicAgent {
  id: string;
  name: string;
  category: string;
  model: string;
  status: string;
  created_at: string;
}

const BrowseAgents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agents, setAgents] = useState<PublicAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [chatAgent, setChatAgent] = useState<PublicAgent | null>(null);

  useEffect(() => {
    fetchPublicAgents();
  }, []);

  const fetchPublicAgents = async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("id, name, category, model, status, created_at")
      .or("is_public.eq.true")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setAgents(data || []);
    setLoading(false);
  };

  const mockPnl = (id: string) => {
    const h = id.charCodeAt(0) + id.charCodeAt(1);
    return ((h % 80) - 20) / 10;
  };

  const mockCopiers = (id: string) => (id.charCodeAt(2) % 30) + 2;
  const mockWinRate = (id: string) => 45 + (id.charCodeAt(3) % 40);

  const getRiskLabel = (m: string) =>
    m.startsWith("risk:")
      ? { low: "Conservative", medium: "Balanced", high: "Aggressive" }[m.replace("risk:", "")] || m
      : m;

  const strategies = ["all", ...new Set(agents.map((a) => a.category))];
  const filtered = agents.filter(
    (a) =>
      (filter === "all" || a.category === filter) &&
      a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyTrade = async (agent: PublicAgent) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to copy trade.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    const { error } = await supabase.from("agents").insert({
      name: `${agent.name} (copy)`,
      category: agent.category,
      model: agent.model,
      user_id: user.id,
      status: "stopped",
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Agent copied!", description: `${agent.name} has been added to your dashboard.` });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-12 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono text-[10px]">◆</span>
              <span className="text-xs font-mono font-medium">solagent</span>
              <span className="text-[10px] text-muted-foreground font-mono">/ marketplace</span>
            </div>
          </div>
          <button onClick={() => navigate("/dashboard")} className="text-xs font-mono text-primary hover:text-primary/80">
            my agents →
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-xl font-medium mb-1">Browse Agents</h1>
          <p className="text-sm text-muted-foreground font-mono">Discover and copy-trade top-performing public agents</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50 border-border h-9 font-mono text-xs"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {strategies.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-colors ${
                  filter === s
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-border">
            <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No public agents found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((agent, i) => {
              const pnl = mockPnl(agent.id);
              const copiers = mockCopiers(agent.id);
              const winRate = mockWinRate(agent.id);
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`h-2 w-2 rounded-full ${agent.status === "running" ? "bg-primary" : "bg-muted-foreground"}`} />
                        <span className="text-sm font-mono font-medium">{agent.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {agent.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyTrade(agent)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-[10px] font-mono text-primary hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Copy className="h-3 w-3" /> copy trade
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase">PnL</p>
                      <p className={`text-sm font-mono font-bold ${pnl >= 0 ? "text-primary" : "text-destructive"}`}>
                        {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} SOL
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase">Win Rate</p>
                      <p className="text-sm font-mono font-bold text-foreground">{winRate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase">Copiers</p>
                      <p className="text-sm font-mono font-bold text-foreground flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" /> {copiers}
                      </p>
                    </div>
                  </div>

                  <button
                      onClick={() => navigate(`/agent/${agent.id}`)}
                      className="mt-3 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                    >
                      view details →
                    </button>
                    <button
                      onClick={() => setChatAgent(agent)}
                      className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="h-3 w-3" /> chat with agent →
                    </button>
                  </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat modal overlay */}
      <AnimatePresence>
        {chatAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setChatAgent(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <AgentChat
                agentId={chatAgent.id}
                agentName={chatAgent.name}
                onClose={() => setChatAgent(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrowseAgents;
