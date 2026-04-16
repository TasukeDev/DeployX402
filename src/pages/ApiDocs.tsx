import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Plus, Trash2, Eye, EyeOff, Check, Key, Zap, Code2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthContext";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const BASE_URL = `https://tzfykqbulbkcdesjlapy.supabase.co/functions/v1/public-api`;

const ENDPOINTS = [
  {
    method: "GET",
    path: "/leaderboard",
    description: "Returns the ranked leaderboard of all public agents by PnL.",
    params: [{ name: "limit", type: "number", default: "20", desc: "Max results (up to 100)" }],
    example: `curl "${BASE_URL}/leaderboard?limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`,
    response: `{
  "data": [
    {
      "id": "732bbd77-...",
      "name": "scalper-uarp",
      "category": "scalper",
      "pnl_sol": 0.042,
      "win_rate": 0.67,
      "total_trades": 18,
      "last_active": "2026-03-02T23:27:23Z"
    }
  ],
  "total": 6
}`,
  },
  {
    method: "GET",
    path: "/agents/:id/stats",
    description: "Returns performance stats for a specific public agent.",
    params: [],
    example: `curl "${BASE_URL}/agents/AGENT_ID/stats" \\
  -H "x-api-key: YOUR_API_KEY"`,
    response: `{
  "data": {
    "id": "732bbd77-...",
    "name": "scalper-uarp",
    "category": "scalper",
    "status": "running",
    "pnl_sol": 0.042,
    "win_rate": 0.67,
    "total_trades": 18,
    "last_active": "2026-03-02T23:27:23Z",
    "created_at": "2026-03-01T12:00:00Z"
  }
}`,
  },
  {
    method: "GET",
    path: "/agents/:id/trades",
    description: "Returns trade history for a public agent.",
    params: [
      { name: "limit", type: "number", default: "50", desc: "Max results (up to 200)" },
      { name: "action", type: "string", default: "", desc: "Filter by 'buy' or 'sell'" },
    ],
    example: `curl "${BASE_URL}/agents/AGENT_ID/trades?limit=20&action=sell" \\
  -H "x-api-key: YOUR_API_KEY"`,
    response: `{
  "data": [
    {
      "id": "...",
      "action": "sell",
      "token_symbol": "BONK",
      "amount_sol": 0.009,
      "price": 0.0000234,
      "pnl_sol": 0.0012,
      "tx_signature": "5XbK...",
      "created_at": "2026-03-02T22:10:00Z"
    }
  ],
  "total": 1
}`,
  },
  {
    method: "GET",
    path: "/agents/:id/positions",
    description: "Returns open or closed positions for a public agent.",
    params: [
      { name: "status", type: "string", default: "open", desc: "Filter: 'open', 'closed', or 'all'" },
    ],
    example: `curl "${BASE_URL}/agents/AGENT_ID/positions?status=open" \\
  -H "x-api-key: YOUR_API_KEY"`,
    response: `{
  "data": [
    {
      "id": "...",
      "token_symbol": "WIF",
      "status": "open",
      "entry_amount_sol": 0.009,
      "entry_price": 2.14,
      "token_amount": 4.2,
      "pnl_sol": null,
      "created_at": "2026-03-02T23:00:00Z"
    }
  ],
  "total": 1
}`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handle} className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function ApiDocs() {
  const { authenticated } = useAuth();
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    if (authenticated) fetchKeys();
  }, [authenticated]);

  async function fetchKeys() {
    const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
    setApiKeys(data || []);
  }

  async function generateKey() {
    if (!authenticated) { navigate("/auth"); return; }
    setLoading(true);
    try {
      // Generate a random key
      const raw = "dx402_" + Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, "0")).join("");

      const prefix = raw.slice(0, 12);

      // Hash the key server-side via a simple approach: use SubtleCrypto
      const encoder = new TextEncoder();
      const data = encoder.encode(raw);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        name: newKeyName || "My API Key",
        key_hash: keyHash,
        key_prefix: prefix,
      });

      if (error) throw error;

      setGeneratedKey(raw);
      setShowKey(true);
      setNewKeyName("");
      await fetchKeys();
      toast.success("API key generated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey(id: string) {
    await supabase.from("api_keys").update({ is_active: false }).eq("id", id);
    await fetchKeys();
    toast.success("Key revoked");
  }

  async function deleteKey(id: string) {
    await supabase.from("api_keys").delete().eq("id", id);
    await fetchKeys();
    toast.success("Key deleted");
  }

  const sections = ["overview", "authentication", "endpoints", "keys"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-14 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 fixed top-14 left-0 bottom-0 border-r border-border/50 bg-background/90 backdrop-blur-sm px-4 py-6 gap-1 z-10">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Reference</p>
          {sections.map(s => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`text-left text-xs font-mono px-3 py-2 rounded transition-colors capitalize ${
                activeSection === s
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {s}
            </button>
          ))}
          <div className="mt-4 pt-4 border-t border-border/40">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Endpoints</p>
            {ENDPOINTS.map(ep => (
              <button
                key={ep.path}
                onClick={() => setActiveSection("endpoints")}
                className="text-left text-[10px] font-mono px-3 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors w-full truncate"
              >
                {ep.path}
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="md:ml-52 flex-1 max-w-4xl mx-auto px-6 py-10 space-y-16">
          {/* Overview */}
          <motion.section id="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-mono tracking-tight">AutoX402 API</h1>
                <p className="text-xs text-muted-foreground font-mono">v1 · REST · JSON</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              The AutoX402 public API gives you programmatic access to agent performance data, trade history, open positions, and leaderboard rankings — all in real-time from active on-chain Solana trading agents.
            </p>
            <div className="mt-6 p-4 rounded-xl border border-border/50 bg-card/40">
              <p className="text-xs font-mono text-muted-foreground mb-2">Base URL</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-primary break-all">{BASE_URL}</code>
                <CopyButton text={BASE_URL} />
              </div>
            </div>
          </motion.section>

          {/* Authentication */}
          <section id="authentication">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold font-mono">Authentication</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              All requests must include your API key in the <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">x-api-key</code> header.
            </p>
            <div className="rounded-xl border border-border/50 bg-[#0d0d0f] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Example Request</span>
                <CopyButton text={`curl "${BASE_URL}/leaderboard" \\\n  -H "x-api-key: YOUR_API_KEY"`} />
              </div>
              <pre className="p-4 text-xs font-mono text-primary overflow-x-auto leading-relaxed">
{`curl "${BASE_URL}/leaderboard" \\
  -H "x-api-key: YOUR_API_KEY"`}
              </pre>
            </div>
          </section>

          {/* Endpoints */}
          <section id="endpoints">
            <div className="flex items-center gap-2 mb-6">
              <Code2 className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold font-mono">Endpoints</h2>
            </div>
            <div className="space-y-8">
              {ENDPOINTS.map((ep, i) => (
                <motion.div
                  key={ep.path}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border/50 bg-card/30 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-border/40 flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono text-foreground">{ep.path}</code>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">{ep.description}</p>

                    {ep.params.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Query Parameters</p>
                        <div className="space-y-1.5">
                          {ep.params.map(p => (
                            <div key={p.name} className="flex items-start gap-3 text-xs">
                              <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono shrink-0">{p.name}</code>
                              <span className="text-muted-foreground">{p.type}{p.default && ` · default: ${p.default}`} · {p.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-border/40 bg-[#0d0d0f] overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30">
                          <span className="text-[10px] font-mono text-muted-foreground">Request</span>
                          <CopyButton text={ep.example} />
                        </div>
                        <pre className="p-3 text-[11px] font-mono text-primary overflow-x-auto leading-relaxed">{ep.example}</pre>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-card/80 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30">
                          <span className="text-[10px] font-mono text-muted-foreground">Response</span>
                          <CopyButton text={ep.response} />
                        </div>
                        <pre className="p-3 text-[11px] font-mono text-foreground overflow-x-auto leading-relaxed">{ep.response}</pre>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* API Key Management */}
          <section id="keys">
            <div className="flex items-center gap-2 mb-6">
              <Key className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold font-mono">API Keys</h2>
            </div>

            {!authenticated ? (
              <div className="rounded-xl border border-border/50 bg-card/30 p-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">Sign in to generate and manage your API keys.</p>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-mono rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Generated key display */}
                {generatedKey && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <p className="text-xs font-mono text-primary mb-2">✓ New API key generated — copy it now, it won't be shown again.</p>
                    <div className="flex items-center gap-2 bg-background/60 rounded-lg px-3 py-2 border border-border/50">
                      <code className="text-xs font-mono text-foreground flex-1 break-all">
                        {showKey ? generatedKey : generatedKey.slice(0, 12) + "•".repeat(32)}
                      </code>
                      <button onClick={() => setShowKey(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <CopyButton text={generatedKey} />
                    </div>
                    <button
                      onClick={() => setGeneratedKey(null)}
                      className="mt-2 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Create key */}
                <div className="flex gap-2">
                  <input
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    placeholder="Key name (optional)"
                    className="flex-1 bg-card/50 border border-border/60 rounded-lg px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={generateKey}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-mono rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Generate Key
                  </button>
                </div>

                {/* Keys list */}
                {apiKeys.length === 0 ? (
                  <div className="rounded-xl border border-border/40 bg-card/20 px-5 py-8 text-center">
                    <p className="text-xs text-muted-foreground font-mono">No API keys yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.map(k => (
                      <div
                        key={k.id}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                          k.is_active ? "border-border/50 bg-card/30" : "border-border/20 bg-card/10 opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${k.is_active ? "bg-green-400" : "bg-muted-foreground"}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-foreground truncate">{k.name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              {k.key_prefix}••••••• · {k.request_count} requests
                              {k.last_used_at && ` · last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          {k.is_active && (
                            <button
                              onClick={() => revokeKey(k.id)}
                              className="text-[10px] font-mono text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            onClick={() => deleteKey(k.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
