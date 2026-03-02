import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink, Zap, Filter, Sparkles, X, Loader2 } from "lucide-react";

interface Token {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd: string;
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  volume: { h24: number };
  liquidity: { usd: number };
  marketCap: number;
  fdv: number;
  txns: { h24: { buys: number; sells: number } };
  pairCreatedAt: number;
}

interface TokenScannerProps {
  agentId: string;
  onBuySignal?: (token: Token) => void;
}

const FILTERS = ["All", "Trending", "New", "High Volume"] as const;
type FilterType = typeof FILTERS[number];

const scoreToken = (t: Token): { score: number; signals: string[] } => {
  const signals: string[] = [];
  let score = 0;

  if (t.priceChange.h1 > 20) { score += 30; signals.push("🚀 +20% 1h"); }
  else if (t.priceChange.h1 > 10) { score += 20; signals.push("📈 +10% 1h"); }

  if (t.volume.h24 > 500000) { score += 25; signals.push("💧 High Volume"); }
  else if (t.volume.h24 > 100000) { score += 15; signals.push("📊 Med Volume"); }

  if (t.txns.h24.buys > t.txns.h24.sells * 1.5) { score += 20; signals.push("🟢 Buy Pressure"); }

  const ageHours = (Date.now() - t.pairCreatedAt) / 3600000;
  if (ageHours < 6) { score += 15; signals.push("🆕 New Pair"); }

  if (t.liquidity.usd > 50000) { score += 10; signals.push("🔒 Good Liquidity"); }

  return { score, signals };
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

export const TokenScanner = ({ agentId, onBuySignal }: TokenScannerProps) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("Trending");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.dexscreener.com/token-boosts/top/v1",
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error("DexScreener error");
      const data = await res.json();

      const addresses: string[] = (data as Array<{ tokenAddress: string; chainId: string }>)
        .filter((d) => d.chainId === "solana")
        .slice(0, 15)
        .map((d) => d.tokenAddress);

      if (addresses.length === 0) throw new Error("No tokens");

      const pairsRes = await fetch(
        `https://api.dexscreener.com/tokens/v1/solana/${addresses.join(",")}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!pairsRes.ok) throw new Error("Pairs error");
      const pairsData = await pairsRes.json();
      const pairs: Token[] = Array.isArray(pairsData) ? pairsData : (pairsData.pairs ?? []);

      const seen = new Map<string, Token>();
      for (const p of pairs) {
        const existing = seen.get(p.baseToken.address);
        if (!existing || p.volume.h24 > existing.volume.h24) seen.set(p.baseToken.address, p);
      }
      setTokens([...seen.values()].slice(0, 20));
      setLastUpdated(new Date());
    } catch (e) {
      console.error("TokenScanner fetch error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, [fetchTokens]);

  const filtered = tokens.filter((t) => {
    if (filter === "All") return true;
    if (filter === "Trending") return t.priceChange.h1 > 5;
    if (filter === "New") return (Date.now() - t.pairCreatedAt) < 12 * 3600000;
    if (filter === "High Volume") return t.volume.h24 > 100000;
    return true;
  }).sort((a, b) => scoreToken(b).score - scoreToken(a).score);

  // ── AI Market Analysis ──────────────────────────────────────────────────────
  const runAiAnalysis = async () => {
    if (filtered.length === 0) return;
    setAiLoading(true);
    setShowAi(true);
    setAiAnalysis("");

    const top5 = filtered.slice(0, 5).map((t, i) => {
      const { score, signals } = scoreToken(t);
      return `${i + 1}. ${t.baseToken.symbol} — Price: $${parseFloat(t.priceUsd).toFixed(6)}, 1h: ${t.priceChange.h1 >= 0 ? "+" : ""}${t.priceChange.h1?.toFixed(1)}%, 24h vol: $${(t.volume.h24 / 1000).toFixed(0)}K, Liq: $${(t.liquidity.usd / 1000).toFixed(0)}K, Buys/Sells: ${t.txns.h24.buys}/${t.txns.h24.sells}, Score: ${score}/100, Signals: ${signals.join(", ")}`;
    }).join("\n");

    const prompt = `You are a professional Solana DeFi analyst. Analyze these top 5 trending tokens from DexScreener right now and give a concise, actionable market analysis. For each token give: risk level (low/medium/high), whether to buy/watch/avoid, and why in one sentence. End with a 2-sentence overall market sentiment summary.\n\nCurrent opportunities:\n${top5}`;

    let assistantSoFar = "";
    try {
      const session = await import("@/integrations/supabase/client").then(m => m.supabase.auth.getSession());
      const token = session.data.session?.access_token;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          agent_id: agentId,
          messages: [{ role: "user", content: prompt }],
          system_override: "You are a concise Solana DeFi trading analyst. Be direct and actionable. No fluff.",
        }),
      });

      if (!resp.ok || !resp.body) {
        setAiAnalysis("⚠️ Analysis unavailable. Try again.");
        setAiLoading(false);
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
            const chunk = JSON.parse(json).choices?.[0]?.delta?.content;
            if (chunk) {
              assistantSoFar += chunk;
              setAiAnalysis(assistantSoFar);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error("AI analysis error:", e);
      setAiAnalysis("⚠️ Connection error. Please try again.");
    }
    setAiLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Token Scanner</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">LIVE</span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {lastUpdated.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          {/* AI Analysis button */}
          <button
            onClick={runAiAnalysis}
            disabled={aiLoading || filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI Analysis
          </button>
          <button
            onClick={fetchTokens}
            disabled={loading}
            className="p-1.5 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* AI Analysis Panel */}
      <AnimatePresence>
        {showAi && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-primary/30 bg-primary/5 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-mono text-primary uppercase tracking-wider font-medium">AI Market Analysis</span>
                {aiLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </div>
              <button
                onClick={() => setShowAi(false)}
                className="p-1 rounded hover:bg-secondary transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            <div className="text-[11px] font-mono text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {aiAnalysis || (aiLoading ? (
                <span className="text-muted-foreground">Analyzing top opportunities…</span>
              ) : "")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-1.5">
        <Filter className="h-3 w-3 text-muted-foreground" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors ${
              filter === f
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Token List */}
      {loading && tokens.length === 0 ? (
        <div className="flex items-center justify-center h-40 rounded-xl border border-dashed border-border">
          <div className="text-center">
            <RefreshCw className="h-5 w-5 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-xs font-mono text-muted-foreground">Scanning DexScreener...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((token, i) => {
              const { score, signals } = scoreToken(token);
              const priceUsd = parseFloat(token.priceUsd || "0");
              const h1 = token.priceChange.h1 ?? 0;
              const h24 = token.priceChange.h24 ?? 0;
              const isBullish = h1 > 0;

              return (
                <motion.div
                  key={token.pairAddress}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border bg-card p-3.5 hover:border-border/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary border border-border">
                        <span className="text-[10px] font-mono font-bold text-foreground">
                          {token.baseToken.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-mono font-medium">{token.baseToken.symbol}</span>
                          {score >= 50 && (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">HOT</span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {signals.slice(0, 2).map((s) => (
                            <span key={s} className="text-[9px] font-mono text-muted-foreground">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-medium">
                        ${priceUsd < 0.0001 ? priceUsd.toExponential(2) : priceUsd.toFixed(priceUsd < 0.01 ? 6 : 4)}
                      </p>
                      <div className={`flex items-center justify-end gap-0.5 text-[10px] font-mono font-medium ${isBullish ? "text-primary" : "text-destructive"}`}>
                        {isBullish ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                        {h1 >= 0 ? "+" : ""}{h1.toFixed(1)}% 1h
                      </div>
                      <p className={`text-[9px] font-mono ${h24 >= 0 ? "text-primary/60" : "text-destructive/60"}`}>
                        {h24 >= 0 ? "+" : ""}{h24.toFixed(1)}% 24h
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-2.5 pt-2.5 border-t border-border">
                    <div>
                      <p className="text-[8px] font-mono text-muted-foreground uppercase">Vol 24h</p>
                      <p className="text-[10px] font-mono">${(token.volume.h24 / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-muted-foreground uppercase">Liquidity</p>
                      <p className="text-[10px] font-mono">${(token.liquidity.usd / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-muted-foreground uppercase">Buys/Sells</p>
                      <p className="text-[10px] font-mono text-primary">{token.txns.h24.buys}<span className="text-muted-foreground">/</span><span className="text-destructive">{token.txns.h24.sells}</span></p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-muted-foreground uppercase">Score</p>
                      <p className={`text-[10px] font-mono font-medium ${score >= 50 ? "text-primary" : score >= 30 ? "text-amber-400" : "text-muted-foreground"}`}>{score}/100</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {onBuySignal && (
                      <button
                        onClick={() => onBuySignal(token)}
                        className="flex-1 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary hover:bg-primary/20 transition-colors"
                      >
                        + Queue Buy Signal
                      </button>
                    )}
                    <a
                      href={token.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && !loading && (
            <div className="text-center py-10 rounded-xl border border-dashed border-border">
              <p className="text-xs font-mono text-muted-foreground">No tokens match this filter</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
