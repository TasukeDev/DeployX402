import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, TrendingUp, TrendingDown, Play, Square, Loader2,
  Settings, BarChart3, Clock, Zap, Wallet, Copy, ExternalLink, GitFork, Radio,
  Target, AlertTriangle, ArrowDownToLine, RefreshCw, MessageSquare, Send, Bot, User,
  ScanSearch, ShieldAlert, Settings2, Terminal, Share2,
} from "lucide-react";
import { TokenScanner } from "@/components/TokenScanner";
import { RiskAnalytics } from "@/components/RiskAnalytics";
import { StrategyBuilder } from "@/components/StrategyBuilder";
import { AgentLogs } from "@/components/AgentLogs";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

interface AgentData {
  id: string; name: string; category: string; model: string;
  status: string; system_prompt: string | null; created_at: string;
  is_public: boolean; user_id: string;
  take_profit_pct: number; stop_loss_pct: number;
}

interface Trade {
  id: string; token_symbol: string; action: string;
  amount_sol: number; token_amount: number; price: number;
  pnl_sol: number; signal: string | null; created_at: string;
  tx_signature?: string | null;
}

interface PnlSnapshot {
  id: string; pnl_sol: number; total_trades: number;
  win_rate: number; snapshot_at: string;
}

interface AgentWallet {
  public_key: string;
  balance_sol: number;
  agent_id?: string;
}

interface Position {
  id: string;
  token_symbol: string;
  token_address: string;
  entry_price: number;
  entry_amount_sol: number;
  token_amount: number;
  status: string;
  pnl_sol: number | null;
  created_at: string;
  buy_tx_signature: string | null;
}

const DEFAULT_TP = 0.05;
const DEFAULT_SL = 0.03;

const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { authenticated } = useAuth();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [newTradeIds, setNewTradeIds] = useState<Set<string>>(new Set());
  const [snapshots, setSnapshots] = useState<PnlSnapshot[]>([]);
  const [wallet, setWallet] = useState<AgentWallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [liveIndicator, setLiveIndicator] = useState(false);
  const initialTab = (searchParams.get("tab") as "pnl" | "trades" | "positions" | "config" | "wallet" | "chat" | "scanner" | "risk" | "strategy" | "logs") || "pnl";
  const [tab, setTab] = useState<"pnl" | "trades" | "positions" | "config" | "wallet" | "chat" | "scanner" | "risk" | "strategy" | "logs">(initialTab);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionPrices, setPositionPrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [tpInput, setTpInput] = useState("");
  const [slInput, setSlInput] = useState("");
  const [savingTpSl, setSavingTpSl] = useState(false);
  const [sellingAll, setSellingAll] = useState(false);
  const [sellAllConfirmOpen, setSellAllConfirmOpen] = useState(false);
  const [onChainTokens, setOnChainTokens] = useState<Array<{ mint: string; symbol: string; uiAmount: number; priceUsd: number | null; amount: number; decimals: number }>>([]);
  const [sparklines, setSparklines] = useState<Record<string, { t: number; p: number }[]>>({});
  const [onChainSyncing, setOnChainSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const tradesRef = useRef<Trade[]>([]);
  tradesRef.current = trades;

  // Auto-scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading || !agent) return;
    const userMsg = { role: "user" as const, content: text };
    setChatInput("");
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    let assistantSoFar = "";
    const allMsgs = [...chatMessages, userMsg];

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setChatMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ agent_id: agent.id, messages: allMsgs }),
        }
      );

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        upsert(`Error: ${err.error || "Request failed"}`);
        setChatLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl).replace(/\r$/, "");
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const c = JSON.parse(json).choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {}
        }
      }
    } catch (e) {
      upsert("Error: Connection failed.");
    }
    setChatLoading(false);
  };

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  // Realtime subscription for new trades
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`agent-trades-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_history", filter: `agent_id=eq.${id}` },
        (payload) => {
          const newTrade = payload.new as Trade;
          setTrades((prev) => [newTrade, ...prev.slice(0, 49)]);
          setNewTradeIds((prev) => new Set(prev).add(newTrade.id));
          // Flash live indicator
          setLiveIndicator(true);
          setTimeout(() => setLiveIndicator(false), 2000);
          // Clear highlight after 3s
          setTimeout(() => {
            setNewTradeIds((prev) => { const s = new Set(prev); s.delete(newTrade.id); return s; });
          }, 3000);
          // Toast alert for TP/SL triggered sells
          if (newTrade.action === "sell" && newTrade.signal) {
            const isTp = newTrade.signal.includes("take-profit");
            const isSl = newTrade.signal.includes("stop-loss");
            if (isTp || isSl) {
              toast({
                title: isTp ? "🎯 Take-Profit Triggered!" : "🛑 Stop-Loss Triggered",
                description: `${newTrade.token_symbol} sold · PnL: ${newTrade.pnl_sol >= 0 ? "+" : ""}${newTrade.pnl_sol?.toFixed(4)} SOL · ${newTrade.signal}`,
                variant: isTp ? "default" : "destructive",
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pnl_snapshots", filter: `agent_id=eq.${id}` },
        (payload) => {
          const snap = payload.new as PnlSnapshot;
          setSnapshots((prev) => {
            const updated = [...prev, snap];
            updated.sort((a, b) => new Date(a.snapshot_at).getTime() - new Date(b.snapshot_at).getTime());
            return updated;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agent_positions", filter: `agent_id=eq.${id}` },
        (payload) => {
          const updated = payload.new as Position;
          setPositions((prev) =>
            updated.status === "closed"
              ? prev.filter((p) => p.id !== updated.id)
              : prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const fetchAll = async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const [agentRes, tradesRes, snapshotsRes] = await Promise.all([
      supabase.from("agents").select("*").eq("id", id!).single(),
      supabase.from("trade_history").select("*").eq("agent_id", id!).order("created_at", { ascending: false }).limit(50),
      supabase.from("pnl_snapshots").select("*").eq("agent_id", id!).order("snapshot_at", { ascending: true }),
    ]);

    // Fetch wallet and open positions in parallel
    const [walletRes, positionsRes] = await Promise.all([
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/agent_wallets?agent_id=eq.${id}&select=public_key,balance_sol&limit=1`,
        { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } }
      ),
      supabase.from("agent_positions").select("*").eq("agent_id", id!).eq("status", "open").order("created_at", { ascending: false }),
    ]);

    const walletData = await walletRes.json();
    if (Array.isArray(walletData) && walletData.length > 0) {
      const w = walletData[0] as AgentWallet;
      // Fetch live on-chain balance via edge function (avoids browser CORS block on public RPC)
      try {
        const { data: balData } = await supabase.functions.invoke("withdraw-sol", {
          body: { action: "get_balance", agent_id: id },
        });
        if (balData?.balance_sol !== undefined) w.balance_sol = balData.balance_sol;
      } catch { /* keep DB value on RPC failure */ }
      setWallet(w);
    }
    if (positionsRes.data) setPositions(positionsRes.data as Position[]);

    if (agentRes.error) {
      toast({ title: "Agent not found", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    const agentData = agentRes.data as AgentData;
    setAgent(agentData);
    setTpInput(((agentData.take_profit_pct ?? DEFAULT_TP) * 100).toFixed(1));
    setSlInput(((agentData.stop_loss_pct ?? DEFAULT_SL) * 100).toFixed(1));
    setTrades((tradesRes.data as Trade[]) || []);


    const realSnapshots = (snapshotsRes.data as PnlSnapshot[]) || [];
    setSnapshots(realSnapshots);

    setLoading(false);
  };

  const [balanceRefreshing, setBalanceRefreshing] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [txsLoading, setTxsLoading] = useState(false);

  const fetchRecentTxs = useCallback(async (agentId: string) => {
    setTxsLoading(true);
    try {
      const { data } = await supabase.functions.invoke("withdraw-sol", {
        body: { action: "get_transactions", agent_id: agentId },
      });
      if (data?.transactions) setRecentTxs(data.transactions);
    } catch { /* silent */ }
    setTxsLoading(false);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!wallet) return;
    setBalanceRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("withdraw-sol", {
        body: { action: "get_balance", agent_id: wallet.agent_id ?? id },
      });
      if (error) throw error;
      if (data?.balance_sol !== undefined) {
        setWallet(prev => prev ? { ...prev, balance_sol: data.balance_sol } : prev);
      }
    } catch {
      toast({ title: "Failed to fetch balance", variant: "destructive" });
    }
    setBalanceRefreshing(false);
  }, [wallet, id, toast]);

  // Auto-refresh balance every 30s when on wallet tab, and fetch txs once
  useEffect(() => {
    if (tab !== "wallet" || !wallet) return;
    const agentId = wallet.agent_id ?? id ?? "";
    fetchRecentTxs(agentId);
    const interval = setInterval(() => refreshBalance(), 30000);
    return () => clearInterval(interval);
  }, [tab, wallet, refreshBalance, fetchRecentTxs, id]);

  const fetchSparklines = useCallback(async (tokens: Array<{ mint: string }>) => {
    const results: Record<string, { t: number; p: number }[]> = {};
    await Promise.allSettled(tokens.map(async (tok) => {
      try {
        // Get the first pair address for this token from DexScreener
        const searchRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tok.mint}`);
        const searchData = await searchRes.json();
        const pairAddress = searchData.pairs?.[0]?.pairAddress;
        const chainId = searchData.pairs?.[0]?.chainId;
        if (!pairAddress || !chainId) return;
        // Fetch 1h OHLCV bars (last 24 bars = 24h)
        const ohlcvRes = await fetch(
          `https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairAddress}`
        );
        const ohlcvData = await ohlcvRes.json();
        const priceHistory = ohlcvData.pair?.priceUsd;
        // DexScreener doesn't have direct OHLCV, use txns price points as proxy
        // Instead build a synthetic sparkline from m5/h1/h6/h24 price change
        const pair = searchData.pairs?.[0];
        if (!pair) return;
        const now = Date.now();
        const current = parseFloat(pair.priceUsd || "0");
        const h24Change = parseFloat(pair.priceChange?.h24 || "0") / 100;
        const h6Change = parseFloat(pair.priceChange?.h6 || "0") / 100;
        const h1Change = parseFloat(pair.priceChange?.h1 || "0") / 100;
        const m5Change = parseFloat(pair.priceChange?.m5 || "0") / 100;
        // Reconstruct approximate price points
        const p24h = current / (1 + h24Change);
        const p6h = current / (1 + h6Change);
        const p1h = current / (1 + h1Change);
        const p5m = current / (1 + m5Change);
        results[tok.mint] = [
          { t: now - 24 * 3600000, p: p24h },
          { t: now - 6 * 3600000, p: p6h },
          { t: now - 3600000, p: p1h },
          { t: now - 300000, p: p5m },
          { t: now, p: current },
        ];
      } catch { /* silent */ }
    }));
    setSparklines(results);
  }, []);

  const syncOnChain = useCallback(async () => {
    if (!id) return;
    setOnChainSyncing(true);
    try {
      const [onChainRes, posData] = await Promise.all([
        supabase.functions.invoke("get-onchain-balances", { body: { agent_id: id } }),
        supabase.from("agent_positions").select("*").eq("agent_id", id).eq("status", "open").order("created_at", { ascending: false }),
      ]);
      if (onChainRes.data?.tokens) {
        setOnChainTokens(onChainRes.data.tokens);
        fetchSparklines(onChainRes.data.tokens);
      }
      if (onChainRes.data?.sol_balance !== undefined) {
        setWallet(prev => prev ? { ...prev, balance_sol: onChainRes.data.sol_balance } : prev);
      }
      if (posData.data) setPositions(posData.data as Position[]);
      setLastSyncedAt(new Date());
    } catch { /* silent */ }
    setOnChainSyncing(false);
  }, [id, fetchSparklines]);

  // Periodic on-chain sync: every 30s on positions tab
  useEffect(() => {
    if (tab !== "positions" || !id) return;
    syncOnChain();
    const interval = setInterval(syncOnChain, 30000);
    return () => clearInterval(interval);
  }, [tab, id]);

  const withdrawSol = useCallback(async () => {
    if (!wallet || !withdrawAddress.trim() || !withdrawAmount) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    setWithdrawing(true);
    try {
      const { data, error } = await supabase.functions.invoke("withdraw-sol", {
        body: { agent_id: id, to_address: withdrawAddress.trim(), amount_sol: amount },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setWallet(prev => prev ? { ...prev, balance_sol: data.new_balance } : prev);
      setWithdrawAddress("");
      setWithdrawAmount("");
      toast({
        title: "Withdrawal sent!",
        description: `${amount} SOL → ${withdrawAddress.slice(0, 6)}...${withdrawAddress.slice(-4)} · ${data.tx_signature?.slice(0, 8)}...`,
      });
    } catch (e: any) {
      toast({ title: "Withdrawal failed", description: e.message, variant: "destructive" });
    }
    setWithdrawing(false);
  }, [wallet, withdrawAddress, withdrawAmount, id, toast]);

  const generateWallet = async () => {
    setWalletLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-wallet", { body: { agent_id: id } });
      if (error) throw error;
      setWallet({ public_key: data.public_key, balance_sol: 0 });
      toast({ title: data.already_exists ? "Wallet loaded" : "Wallet generated!", description: `Address: ${data.public_key.slice(0, 8)}...` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setWalletLoading(false);
  };

  // Fetch current prices for open positions from DexScreener
  const fetchCurrentPrices = async (positionList: Position[]) => {
    if (positionList.length === 0) return;
    setPricesLoading(true);
    const prices: Record<string, number> = {};
    await Promise.allSettled(
      positionList.map(async (pos) => {
        try {
          const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${pos.token_address}`);
          const data = await res.json();
          const pair = data.pairs?.[0];
          if (pair?.priceUsd) prices[pos.id] = parseFloat(pair.priceUsd);
        } catch { /* silent */ }
      })
    );
    setPositionPrices(prices);
    setPricesLoading(false);
  };

  const sellAll = async () => {
    if (!agent) return;
    setSellingAll(true);
    try {
      // Stop the agent first so it doesn't buy again immediately
      await supabase.from("agents").update({ status: "stopped" }).eq("id", agent.id);
      setAgent((prev) => prev ? { ...prev, status: "stopped" } : prev);

      const { data, error } = await supabase.functions.invoke("sell-all-positions", {
        body: { agent_id: agent.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: `Sold ${data.sold} position${data.sold !== 1 ? "s" : ""}`,
        description: "All open positions closed. Agent has been stopped.",
      });
      setPositions([]);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Sell-all failed", description: e.message, variant: "destructive" });
    }
    setSellingAll(false);
  };

  const handleCopyTrade = async () => {
    if (!agent) return;
    if (!authenticated) { navigate("/auth"); return; }
    setCopying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const newName = `${agent.category}-copy-${Date.now().toString(36).slice(-4)}`;
      const { error } = await supabase.from("agents").insert({
        name: newName,
        category: agent.category,
        model: agent.model,
        system_prompt: agent.system_prompt,
        user_id: user.id,
        status: "stopped",
        is_public: false,
      });
      if (error) throw error;
      toast({ title: "Agent copied!", description: `${newName} added to your dashboard.` });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Copy failed", description: e.message, variant: "destructive" });
    }
    setCopying(false);
  };

  const getRiskLabel = (m: string) =>
    m.startsWith("risk:")
      ? { low: "Conservative", medium: "Balanced", high: "Aggressive" }[m.replace("risk:", "")] || m
      : m;
  const getFundAmount = (p: string | null) => p?.startsWith("fund:") ? p.replace("fund:", "") + " SOL" : "—";

  const toggleStatus = async () => {
    if (!agent) return;
    const newStatus = agent.status === "running" ? "stopped" : "running";
    const { error } = await supabase.from("agents").update({ status: newStatus }).eq("id", agent.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setAgent({ ...agent, status: newStatus });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) return null;

  const totalPnl = snapshots.length > 0 ? (snapshots[snapshots.length - 1].pnl_sol ?? 0) : 0;
  const totalTrades = snapshots.length > 0 ? snapshots[snapshots.length - 1].total_trades : trades.length;
  const winRate = snapshots.length > 0 ? (snapshots[snapshots.length - 1].win_rate ?? 0) : 0;
  const pnlPositive = totalPnl >= 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-12 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono text-[10px]">◆</span>
              <span className="text-xs font-mono font-medium">DeployX402</span>
              <span className="text-[10px] text-muted-foreground font-mono">/ agent / {agent.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Copy Trade Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopyTrade}
              disabled={copying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {copying ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitFork className="h-3 w-3" />}
              Copy Trade
            </motion.button>
            <button
              onClick={toggleStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                agent.status === "running"
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {agent.status === "running" ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {agent.status === "running" ? "stop" : "start"}
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start gap-4 mb-8"
        >
          {/* Agent icon */}
          <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${
            agent.status === "running" ? "border-primary/40 bg-primary/5 shadow-[0_0_16px_hsl(var(--primary)/0.15)]" : "border-border bg-card"
          }`}>
            <span className="text-primary font-mono text-lg">◆</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-medium tracking-tight">{agent.name}</h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                agent.status === "running"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground"
              }`}>
                {agent.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{agent.category}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{getRiskLabel(agent.model)}</span>
              <span className="text-[10px] font-mono text-muted-foreground">· funded {getFundAmount(agent.system_prompt)}</span>
              {agent.is_public && <span className="text-[10px] font-mono text-primary/70">· public</span>}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { label: "Total PnL", value: `${pnlPositive ? "+" : ""}${totalPnl.toFixed(2)} SOL`, icon: TrendingUp, positive: pnlPositive },
            { label: "Total Trades", value: totalTrades.toString(), icon: Zap, positive: true },
            { label: "Win Rate", value: `${winRate.toFixed(1)}%`, icon: BarChart3, positive: winRate > 50 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <s.icon className={`h-4 w-4 ${s.positive ? "text-primary" : "text-destructive"}`} />
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className={`text-sm font-mono font-bold ${s.positive ? "text-primary" : "text-destructive"}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
          {([
            { key: "pnl", label: "PnL Chart", icon: TrendingUp },
            { key: "trades", label: "Trade History", icon: Clock },
            { key: "positions", label: "Positions", icon: Target },
            { key: "scanner", label: "Scanner", icon: ScanSearch },
            { key: "risk", label: "Risk", icon: ShieldAlert },
            { key: "strategy", label: "Builder", icon: Settings2 },
            { key: "logs", label: "Logs", icon: Terminal },
            { key: "chat", label: "Chat", icon: MessageSquare },
            { key: "wallet", label: "Wallet", icon: Wallet },
            { key: "config", label: "Config", icon: Settings },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                if (t.key === "positions") fetchCurrentPrices(positions);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono transition-colors border-b-2 -mb-px whitespace-nowrap ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
              {t.key === "trades" && liveIndicator && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
              {t.key === "positions" && positions.length > 0 && (
                <span className="ml-1 px-1 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-mono">{positions.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* PnL Chart */}
        {tab === "pnl" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Cumulative PnL</h3>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-mono font-bold ${pnlPositive ? "text-primary" : "text-destructive"}`}>
                  {snapshots.length > 0 ? `${pnlPositive ? "+" : ""}${totalPnl.toFixed(4)} SOL` : "—"}
                </span>
                <button
                  onClick={() => {
                    const pnlText = `${pnlPositive ? "+" : ""}${totalPnl.toFixed(3)} SOL`;
                    const text = `🤖 My AI trading agent "${agent.name}" on @DeployX402\n\n📈 PnL: ${pnlText}\n🎯 Win Rate: ${winRate.toFixed(0)}% across ${totalTrades} trades\n\nDeploy your own autonomous Solana trading agent 👇`;
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://github.com/TasukeDev/DeployX402")}`,
                      "_blank", "noopener,noreferrer"
                    );
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                  title="Share on X"
                >
                  <Share2 className="h-3 w-3" />
                  Share
                </button>
              </div>
            </div>

            {snapshots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[280px] rounded-xl border border-dashed border-border gap-3">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-mono text-muted-foreground">No trades yet</p>
                <p className="text-[11px] font-mono text-muted-foreground text-center max-w-xs">
                  Fund the agent wallet with SOL and start the agent to begin real on-chain trading.
                </p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={snapshots.map((s) => ({
                    date: new Date(s.snapshot_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
                    pnl: s.pnl_sol,
                  }))}>
                    <defs>
                      <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, fontFamily: "JetBrains Mono" }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                      itemStyle={{ color: "hsl(var(--primary))" }}
                      formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(4)} SOL`, "PnL"]}
                    />
                    <Area type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" fill="url(#pnlGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-border">
                  {[
                    { label: "Best PnL", value: `+${Math.max(...snapshots.map(s => s.pnl_sol), 0).toFixed(4)} SOL` },
                    { label: "Total Trades", value: totalTrades.toString() },
                    { label: "Win Rate", value: `${winRate.toFixed(1)}%` },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</p>
                      <p className="text-xs font-mono font-medium text-foreground mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Trade History */}
        {tab === "trades" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {trades.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-dashed border-border">
                <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-mono">No trades recorded yet.</p>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">Start the agent to begin trading.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Recent trades</span>
                    {/* Live badge */}
                    <AnimatePresence>
                      {liveIndicator && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20"
                        >
                          <Radio className="h-2.5 w-2.5 text-primary animate-pulse" />
                          <span className="text-[9px] font-mono text-primary">LIVE</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{trades.length} records</span>
                </div>
                <AnimatePresence initial={false}>
                  {trades.map((trade) => {
                    const isNew = newTradeIds.has(trade.id);
                    return (
                      <motion.div
                        key={trade.id}
                        layout
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className={`rounded-xl border bg-card p-4 flex items-center justify-between transition-colors ${
                          isNew
                            ? "border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.12)]"
                            : "border-border hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            trade.action === "buy" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                          }`}>
                            {trade.action.toUpperCase()}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-mono font-medium">{trade.token_symbol}</span>
                              {isNew && <span className="text-[8px] font-mono text-primary bg-primary/10 px-1 rounded">NEW</span>}
                            </div>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              {trade.amount_sol} SOL @ ${trade.price.toFixed(6)}
                              {trade.signal && <span className="text-primary/70"> · {trade.signal}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {trade.pnl_sol !== null && (
                              <p className={`text-xs font-mono font-bold ${trade.pnl_sol >= 0 ? "text-primary" : "text-destructive"}`}>
                                {trade.pnl_sol >= 0 ? "+" : ""}{trade.pnl_sol.toFixed(4)} SOL
                              </p>
                            )}
                            {trade.tx_signature && (
                              <a
                                href={`https://solscan.io/tx/${trade.tx_signature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="View on Solscan"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {new Date(trade.created_at).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}

        {/* Open Positions */}
        {tab === "positions" && (() => {
          // ── Portfolio totals ──────────────────────────────────────────────
          const totalCurrentUsd = onChainTokens.reduce((sum, t) => sum + (t.priceUsd !== null ? t.uiAmount * t.priceUsd : 0), 0);
          const totalEntryUsd = positions.reduce((sum, p) => {
            const priceUsd = Object.values(positionPrices)[positions.indexOf(p)] ?? null;
            return sum + p.entry_amount_sol * (priceUsd ?? 0);
          }, 0);
          // Entry value via entry_price × token_amount (USD)
          const totalEntryUsdFromDb = positions.reduce((sum, p) => sum + p.entry_price * p.token_amount, 0);
          const portfolioPnlUsd = totalCurrentUsd - totalEntryUsdFromDb;
          const hasPriceData = onChainTokens.some(t => t.priceUsd !== null);

          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {/* ── Portfolio summary card ── */}
              {(onChainTokens.length > 0 || positions.length > 0) && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Portfolio Overview</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{onChainTokens.length} token{onChainTokens.length !== 1 ? "s" : ""} held</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-secondary/40 p-2.5">
                      <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Current Value</p>
                      <p className="text-sm font-mono font-bold">
                        {hasPriceData ? `$${totalCurrentUsd.toFixed(2)}` : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-2.5">
                      <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Entry Value</p>
                      <p className="text-sm font-mono font-bold">
                        {totalEntryUsdFromDb > 0 ? `$${totalEntryUsdFromDb.toFixed(2)}` : "—"}
                      </p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${hasPriceData && totalEntryUsdFromDb > 0 ? (portfolioPnlUsd >= 0 ? "bg-primary/10" : "bg-destructive/10") : "bg-secondary/40"}`}>
                      <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Unrealized PnL</p>
                      <p className={`text-sm font-mono font-bold ${hasPriceData && totalEntryUsdFromDb > 0 ? (portfolioPnlUsd >= 0 ? "text-primary" : "text-destructive") : ""}`}>
                        {hasPriceData && totalEntryUsdFromDb > 0
                          ? `${portfolioPnlUsd >= 0 ? "+" : ""}$${portfolioPnlUsd.toFixed(2)}`
                          : "—"}
                      </p>
                      {hasPriceData && totalEntryUsdFromDb > 0 && (
                        <p className={`text-[9px] font-mono mt-0.5 ${portfolioPnlUsd >= 0 ? "text-primary/70" : "text-destructive/70"}`}>
                          {portfolioPnlUsd >= 0 ? "+" : ""}{((portfolioPnlUsd / totalEntryUsdFromDb) * 100).toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Header row ── */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Open Positions</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchCurrentPrices(positions)}
                    disabled={pricesLoading}
                    className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                  >
                    {pricesLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Radio className="h-3 w-3" />}
                    Refresh prices
                  </button>
                  <button
                    onClick={() => setSellAllConfirmOpen(true)}
                    disabled={sellingAll}
                    className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors disabled:opacity-50"
                  >
                    {sellingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowDownToLine className="h-3 w-3" />}
                    Sell All
                  </button>
                </div>
              </div>

              {/* ── Sync status bar ── */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                  <div className={`h-1.5 w-1.5 rounded-full ${onChainSyncing ? "bg-primary animate-pulse" : lastSyncedAt ? "bg-primary/70" : "bg-muted-foreground/40"}`} />
                  {onChainSyncing
                    ? "Syncing on-chain..."
                    : lastSyncedAt
                      ? `Last synced ${lastSyncedAt.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                      : "Not synced yet"}
                </div>
                <button
                  onClick={syncOnChain}
                  disabled={onChainSyncing}
                  className="flex items-center gap-1 text-[10px] font-mono text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${onChainSyncing ? "animate-spin" : ""}`} />
                  Sync Now
                </button>
              </div>

              {/* ── On-chain holdings ── */}
              {onChainTokens.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    On-Chain Holdings
                  </span>
                  {onChainTokens.map((tok) => {
                    const valueUsd = tok.priceUsd !== null ? tok.uiAmount * tok.priceUsd : null;
                    const isTracked = positions.some(p => p.token_address === tok.mint);
                    const sparkData = sparklines[tok.mint] ?? [];
                    const sparkFirst = sparkData[0]?.p ?? 0;
                    const sparkLast = sparkData[sparkData.length - 1]?.p ?? 0;
                    const sparkUp = sparkLast >= sparkFirst;
                    const sparkColor = sparkUp ? "hsl(var(--primary))" : "hsl(var(--destructive))";
                    const h24Change = sparkData.length >= 2 && sparkFirst > 0
                      ? ((sparkLast - sparkFirst) / sparkFirst) * 100
                      : null;
                    return (
                      <div key={tok.mint} className="rounded-xl border border-border bg-card p-3 space-y-2">
                        {/* Top row: symbol + badge + value */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-bold">{tok.symbol}</span>
                              {isTracked
                                ? <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">tracked</span>
                                : <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground border border-border">untracked</span>
                              }
                              {h24Change !== null && (
                                <span className={`text-[9px] font-mono font-medium ${sparkUp ? "text-primary" : "text-destructive"}`}>
                                  {sparkUp ? "+" : ""}{h24Change.toFixed(2)}% 24h
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{tok.mint.slice(0, 8)}...{tok.mint.slice(-6)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono font-semibold">{tok.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                            {valueUsd !== null && (
                              <p className="text-[10px] font-mono text-muted-foreground">≈ ${valueUsd.toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                        {/* Sparkline */}
                        {sparkData.length >= 2 ? (
                          <div className="h-10 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={sparkData} margin={{ top: 1, right: 0, bottom: 1, left: 0 }}>
                                <defs>
                                  <linearGradient id={`spark-${tok.mint.slice(0, 8)}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.25} />
                                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <Area
                                  type="monotone"
                                  dataKey="p"
                                  stroke={sparkColor}
                                  strokeWidth={1.5}
                                  fill={`url(#spark-${tok.mint.slice(0, 8)})`}
                                  dot={false}
                                  isAnimationActive={false}
                                />
                                <Tooltip
                                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 9, fontFamily: "JetBrains Mono", padding: "4px 8px" }}
                                  formatter={(v: number) => [`$${v.toFixed(6)}`, tok.symbol]}
                                  labelFormatter={() => ""}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-8 flex items-center">
                            <div className="h-px w-full bg-border/50 opacity-50" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── DB tracked positions ── */}
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mt-2">DB Tracked Positions</span>
              {positions.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-border">
                  <Target className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-mono">No open positions</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-1">Positions appear here when the agent buys a token.</p>
                </div>
              ) : (
                positions.map((pos) => {
                  const currentPrice = positionPrices[pos.id];
                  const priceChange = currentPrice ? (currentPrice - pos.entry_price) / pos.entry_price : null;
                  const unrealizedPnl = priceChange !== null ? priceChange * pos.entry_amount_sol : null;
                  const agentTp = (agent?.take_profit_pct ?? DEFAULT_TP);
                  const agentSl = (agent?.stop_loss_pct ?? DEFAULT_SL);
                  const tpDist = agentTp - (priceChange ?? 0);
                  const slDist = (priceChange ?? 0) - (-agentSl);
                  const pnlColor = unrealizedPnl === null ? "text-muted-foreground" : unrealizedPnl >= 0 ? "text-primary" : "text-destructive";
                  return (
                    <motion.div
                      key={pos.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold">{pos.token_symbol}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">OPEN</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-mono font-bold ${pnlColor}`}>
                            {unrealizedPnl === null ? "—" : `${unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(4)} SOL`}
                          </span>
                          {pos.buy_tx_signature && (
                            <a href={`https://solscan.io/tx/${pos.buy_tx_signature}`} target="_blank" rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors" title="View entry tx">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-secondary/40 p-2.5">
                          <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Entry</p>
                          <p className="text-[11px] font-mono">${pos.entry_price.toFixed(6)}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/40 p-2.5">
                          <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Current</p>
                          <p className={`text-[11px] font-mono ${pnlColor}`}>{currentPrice ? `$${currentPrice.toFixed(6)}` : "—"}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/40 p-2.5">
                          <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Change</p>
                          <p className={`text-[11px] font-mono ${pnlColor}`}>
                            {priceChange !== null ? `${priceChange >= 0 ? "+" : ""}${(priceChange * 100).toFixed(2)}%` : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                          <span className="flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5 text-destructive" /> SL -{(agentSl * 100).toFixed(1)}%</span>
                          <span className="text-primary/60">{pos.entry_amount_sol.toFixed(3)} SOL in</span>
                          <span className="flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5 text-primary" /> TP +{(agentTp * 100).toFixed(1)}%</span>
                        </div>
                        <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
                          {priceChange !== null && (
                            <div
                              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${priceChange >= 0 ? "bg-primary" : "bg-destructive"}`}
                              style={{ width: `${Math.max(2, Math.min(100, ((priceChange - (-agentSl)) / (agentTp - (-agentSl))) * 100))}%` }}
                            />
                          )}
                          <div className="absolute right-0 top-0 h-full w-0.5 bg-primary/40" />
                        </div>
                        {priceChange !== null && (
                          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                            <span className="text-destructive">SL in {(slDist * 100).toFixed(1)}%</span>
                            <span className="text-primary">TP in {(tpDist * 100).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] font-mono text-muted-foreground">
                        Opened {new Date(pos.created_at).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </motion.div>
                  );
                })
              )}

              {/* ── Sell All Confirmation Dialog ── */}
              <AnimatePresence>
                {sellAllConfirmOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setSellAllConfirmOpen(false); }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 40, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 40, scale: 0.97 }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="w-full max-w-sm rounded-2xl border border-destructive/30 bg-card shadow-2xl overflow-hidden"
                    >
                      {/* Dialog header */}
                      <div className="bg-destructive/10 border-b border-destructive/20 px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-full bg-destructive/20 p-1.5">
                            <ArrowDownToLine className="h-4 w-4 text-destructive" />
                          </div>
                          <div>
                            <h3 className="text-sm font-mono font-bold text-foreground">Confirm Sell All</h3>
                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">This action cannot be undone</p>
                          </div>
                        </div>
                      </div>

                      {/* Token list to be sold */}
                      <div className="px-5 py-4 space-y-3">
                        <p className="text-[11px] font-mono text-muted-foreground">The following on-chain tokens will be liquidated via Jupiter:</p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {onChainTokens.length > 0 ? onChainTokens.map((tok) => {
                            const valueUsd = tok.priceUsd !== null ? tok.uiAmount * tok.priceUsd : null;
                            return (
                              <div key={tok.mint} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-semibold">{tok.symbol}</span>
                                  <span className="text-[9px] font-mono text-muted-foreground">{tok.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                                </div>
                                {valueUsd !== null && (
                                  <span className="text-[10px] font-mono text-muted-foreground">≈ ${valueUsd.toFixed(2)}</span>
                                )}
                              </div>
                            );
                          }) : (
                            <div className="rounded-lg bg-secondary/40 px-3 py-2">
                              <p className="text-[10px] font-mono text-muted-foreground">No on-chain tokens detected yet — sync first to check.</p>
                            </div>
                          )}
                          {positions.length > 0 && onChainTokens.length === 0 && positions.map((pos) => (
                            <div key={pos.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-semibold">{pos.token_symbol}</span>
                                <span className="text-[9px] font-mono text-muted-foreground">{pos.token_amount.toFixed(4)}</span>
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground">{pos.entry_amount_sol.toFixed(4)} SOL in</span>
                            </div>
                          ))}
                        </div>

                        {/* Warning */}
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                          <p className="text-[10px] font-mono text-destructive leading-relaxed">
                            The agent will be <strong>stopped immediately</strong> and will not resume trading until you manually restart it.
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 px-5 pb-5">
                        <button
                          onClick={() => setSellAllConfirmOpen(false)}
                          className="flex-1 text-xs font-mono py-2.5 rounded-xl border border-border bg-secondary/40 hover:bg-secondary/70 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => { setSellAllConfirmOpen(false); sellAll(); }}
                          disabled={sellingAll}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-mono py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                        >
                          {sellingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}
                          Sell All Now
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })()}

        {/* Strategy Config */}
        {tab === "config" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Strategy Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Strategy", value: agent.category },
                { label: "Risk Profile", value: getRiskLabel(agent.model) },
                { label: "Funded", value: getFundAmount(agent.system_prompt) },
                { label: "Status", value: agent.status },
                { label: "Visibility", value: agent.is_public ? "Public" : "Private" },
                { label: "Created", value: new Date(agent.created_at).toLocaleDateString() },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-secondary/30 border border-border p-3">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-sm font-mono text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {/* TP/SL Config */}
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-xs font-mono font-medium">Risk Management Targets</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" /> Take-Profit (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.1" max="100" step="0.1"
                      value={tpInput}
                      onChange={(e) => setTpInput(e.target.value)}
                      className="flex-1 h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="5.0"
                    />
                    <span className="text-xs font-mono text-muted-foreground">%</span>
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground">Sell when price rises by this %</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-destructive" /> Stop-Loss (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.1" max="100" step="0.1"
                      value={slInput}
                      onChange={(e) => setSlInput(e.target.value)}
                      className="flex-1 h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="3.0"
                    />
                    <span className="text-xs font-mono text-muted-foreground">%</span>
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground">Sell when price drops by this %</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const tp = parseFloat(tpInput) / 100;
                  const sl = parseFloat(slInput) / 100;
                  if (isNaN(tp) || isNaN(sl) || tp <= 0 || sl <= 0) {
                    toast({ title: "Invalid values", description: "TP and SL must be positive numbers.", variant: "destructive" });
                    return;
                  }
                  setSavingTpSl(true);
                  const { error } = await supabase.from("agents").update({ take_profit_pct: tp, stop_loss_pct: sl }).eq("id", agent.id);
                  if (error) {
                    toast({ title: "Save failed", description: error.message, variant: "destructive" });
                  } else {
                    setAgent({ ...agent, take_profit_pct: tp, stop_loss_pct: sl });
                    toast({ title: "Targets saved!", description: `TP: +${(tp * 100).toFixed(1)}% · SL: -${(sl * 100).toFixed(1)}%` });
                  }
                  setSavingTpSl(false);
                }}
                disabled={savingTpSl}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {savingTpSl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
                Save Risk Targets
              </button>
            </div>

            {/* Copy Trade CTA */}
            <div className="pt-4 border-t border-border">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleCopyTrade}
                disabled={copying}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary border border-border text-sm font-mono text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitFork className="h-4 w-4" />}
                Copy this strategy to my dashboard
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Chat */}
        {tab === "chat" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col" style={{ height: 520 }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs font-mono font-medium">{agent.name}</span>
              {agent.status === "running" && (
                <span className="ml-auto flex items-center gap-1 text-[9px] font-mono text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> live
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-muted-foreground py-16">
                  <Bot className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-mono mb-1">Chat with your agent</p>
                  <p className="text-[10px] font-mono opacity-60">Tell it which coin to trade, adjust its strategy, or ask about its performance</p>
                  <div className="mt-4 flex flex-col items-center gap-2">
                    {["Buy BONK now", "Trade WIF with 0.01 SOL", "What's your current strategy?"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setChatInput(s)}
                        className="px-3 py-1.5 rounded-lg border border-border/60 bg-secondary/50 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 text-xs font-mono leading-relaxed">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="text-xs font-mono">{msg.content}</span>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-xl px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-secondary/20">
              <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Message ${agent.name}… e.g. "Buy BONK with 0.01 SOL"`}
                  disabled={chatLoading}
                  className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  {chatLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Wallet */}
        {tab === "wallet" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-center">
                <span className="text-primary font-mono">◆</span>
              </div>
              <div>
                <h3 className="text-sm font-mono font-medium">Agent Wallet</h3>
                <p className="text-[10px] font-mono text-muted-foreground">Dedicated Solana wallet for this agent</p>
              </div>
            </div>

            {wallet ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary/50 border border-border p-4">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Deposit Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-foreground break-all flex-1">{wallet.public_key}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(wallet.public_key); toast({ title: "Copied!" }); }}
                      className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <a
                      href={`https://solscan.io/account/${wallet.public_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                {/* QR Code for funding */}
                <div className="flex flex-col items-center gap-3 rounded-lg bg-secondary/50 border border-border p-5">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider self-start">Scan to Fund</p>
                  <div className="p-3 rounded-xl bg-white">
                    <QRCodeSVG
                      value={`solana:${wallet.public_key}`}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground text-center">
                    Scan with Phantom, Solflare, or any Solana wallet app to send SOL
                  </p>
                </div>

                {/* Funding warning */}
                {wallet.balance_sol < 0.005 && (
                  <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <span className="text-destructive mt-0.5 shrink-0">⚠</span>
                    <div>
                      <p className="text-[11px] font-mono font-semibold text-destructive">Insufficient balance to trade</p>
                      <p className="text-[10px] font-mono text-destructive/80 mt-0.5">
                        This agent needs at least <span className="font-bold">0.005 SOL</span> to start trading. Scan the QR code above or copy the deposit address and send SOL from any Solana wallet.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/50 border border-border p-4">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1 flex items-center justify-between">
                      Balance
                      <button
                        onClick={refreshBalance}
                        disabled={balanceRefreshing}
                        className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        title="Refresh balance"
                      >
                        <RefreshCw className={`h-3 w-3 ${balanceRefreshing ? "animate-spin" : ""}`} />
                      </button>
                    </p>
                    <p className="text-lg font-mono font-bold text-primary">{wallet.balance_sol.toFixed(4)} SOL</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 border border-border p-4">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Status</p>
                    <p className="text-lg font-mono font-bold text-foreground">{agent.status === "running" ? "Trading" : "Idle"}</p>
                  </div>
                </div>

                {/* Withdraw Section */}
                <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine className="h-3.5 w-3.5 text-primary" />
                      <p className="text-xs font-mono font-medium">Withdraw SOL</p>
                    </div>
                    <a
                      href={`https://solscan.io/account/${wallet.public_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-2.5 w-2.5" /> Solscan
                    </a>
                  </div>

                  {agent.status === "running" && (
                    <div className="flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/20 p-2.5">
                      <AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-[10px] font-mono text-warning">Agent is currently trading. Stop it before withdrawing to avoid conflicts.</p>
                        <button
                          onClick={toggleStatus}
                          className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-warning underline underline-offset-2 hover:no-underline"
                        >
                          <Square className="h-2.5 w-2.5" /> Stop agent now
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">Destination Address</label>
                      <input
                        type="text"
                        placeholder="Solana wallet address (base58)"
                        value={withdrawAddress}
                        onChange={e => setWithdrawAddress(e.target.value)}
                        className="w-full text-[11px] font-mono bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">
                        Amount (SOL) · Available: {Math.max(0, wallet.balance_sol - 0.000005).toFixed(6)} SOL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={e => setWithdrawAmount(e.target.value)}
                          className="flex-1 text-[11px] font-mono bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <button
                          onClick={() => setWithdrawAmount(Math.max(0, wallet.balance_sol - 0.001).toFixed(6))}
                          className="px-2.5 py-1.5 rounded-md bg-secondary border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Max
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={withdrawSol}
                      disabled={withdrawing || !withdrawAddress.trim() || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-mono font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {withdrawing ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Sending...</>
                      ) : (
                        <><ArrowDownToLine className="h-3 w-3" /> Withdraw SOL</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <p className="text-xs font-mono font-medium">Recent Transactions</p>
                    </div>
                    <button
                      onClick={() => fetchRecentTxs(wallet.agent_id ?? id ?? "")}
                      disabled={txsLoading}
                      className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${txsLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  {txsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentTxs.length === 0 ? (
                    <p className="text-[10px] font-mono text-muted-foreground text-center py-3">No transactions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {recentTxs.slice(0, 8).map((tx: any, i: number) => {
                        const sig = tx.txHash || tx.signature || "";
                        const ts = tx.blockTime ? new Date(tx.blockTime * 1000) : null;
                        const ok = tx.status !== "fail" && !tx.err;
                        const lamports = tx.lamport ?? tx.fee ?? null;
                        return (
                          <div key={sig || i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ok ? "bg-primary" : "bg-destructive"}`} />
                              <div className="min-w-0">
                                <a
                                  href={`https://solscan.io/tx/${sig}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-mono text-foreground hover:text-primary transition-colors truncate block max-w-[140px]"
                                >
                                  {sig.slice(0, 8)}...{sig.slice(-4)}
                                </a>
                                {ts && (
                                  <p className="text-[9px] font-mono text-muted-foreground">
                                    {ts.toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {lamports !== null && (
                                <span className="text-[10px] font-mono text-muted-foreground">{(lamports / 1e9).toFixed(5)} SOL</span>
                              )}
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                                {ok ? "ok" : "fail"}
                              </span>
                              <a
                                href={`https://solscan.io/tx/${sig}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-mono text-primary font-medium mb-1">How to fund your agent</p>
                  <ol className="text-[10px] font-mono text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Copy the deposit address above</li>
                    <li>Send SOL from your wallet (Phantom, Solflare, etc.)</li>
                    <li>Start the agent — it will begin trading automatically</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-mono text-muted-foreground mb-4">No wallet generated yet</p>
                <button
                  onClick={generateWallet}
                  disabled={walletLoading}
                  className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-mono hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {walletLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Generate Wallet"}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Token Scanner */}
        {tab === "scanner" && (
          <TokenScanner agentId={agent.id} onBuySignal={(token) => {
            setChatInput(`Buy ${token.baseToken.symbol} (${token.baseToken.address}) with 0.01 SOL`);
            setTab("chat");
          }} />
        )}

        {/* Risk Analytics */}
        {tab === "risk" && (
          <RiskAnalytics trades={trades} snapshots={snapshots} />
        )}

        {/* Strategy Builder */}
        {tab === "strategy" && (
          <StrategyBuilder
            agentId={agent.id}
            takeProfitPct={agent.take_profit_pct}
            stopLossPct={agent.stop_loss_pct}
          />
        )}

        {/* Agent Logs */}
        {tab === "logs" && (
          <AgentLogs agentId={agent.id} trades={trades} />
        )}
      </div>
    </div>
  );
};

export default AgentDetail;
