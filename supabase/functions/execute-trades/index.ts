import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(bytes: Uint8Array): string {
  const result: number[] = [];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < result.length; j++) {
      carry += result[j] * 256;
      result[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      result.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  for (const byte of bytes) {
    if (byte === 0) result.push(0);
    else break;
  }
  return result.reverse().map((i) => BASE58_ALPHABET[i]).join("");
}

interface TokenCandidate {
  symbol: string;
  address: string;
  priceUsd: number;
  volume24h: number;
  priceChange24h: number;
  priceChange1h: number;
  liquidity: number;
  buys24h: number;
  sells24h: number;
  pairCreatedAt: number;
  marketCap: number;
  signal?: string;
}

// Well-known high-liquidity fallback tokens
const FALLBACK_TOKENS: TokenCandidate[] = [
  { symbol: "BONK", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", priceUsd: 0.00002, volume24h: 5000000, priceChange24h: 0, priceChange1h: 0, liquidity: 500000, buys24h: 500, sells24h: 300, pairCreatedAt: Date.now() - 86400000 * 30, marketCap: 1000000 },
  { symbol: "WIF",  address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", priceUsd: 1.5, volume24h: 8000000, priceChange24h: 0, priceChange1h: 0, liquidity: 1000000, buys24h: 700, sells24h: 400, pairCreatedAt: Date.now() - 86400000 * 20, marketCap: 1500000000 },
  { symbol: "JUP",  address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",  priceUsd: 0.8, volume24h: 3000000, priceChange24h: 0, priceChange1h: 0, liquidity: 800000, buys24h: 400, sells24h: 250, pairCreatedAt: Date.now() - 86400000 * 60, marketCap: 1200000000 },
  { symbol: "RAY",  address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", priceUsd: 2.0, volume24h: 4000000, priceChange24h: 0, priceChange1h: 0, liquidity: 600000, buys24h: 350, sells24h: 200, pairCreatedAt: Date.now() - 86400000 * 90, marketCap: 600000000 },
];

// ── Composite momentum score used by scalper & momentum categories ────────────
function scoreToken(t: TokenCandidate): number {
  let score = 0;

  // 1h price change (strongest signal)
  if (t.priceChange1h > 30) score += 40;
  else if (t.priceChange1h > 15) score += 28;
  else if (t.priceChange1h > 5)  score += 16;
  else if (t.priceChange1h < -10) score -= 20;

  // Volume (liquidity confidence)
  if (t.volume24h > 2000000) score += 20;
  else if (t.volume24h > 500000) score += 14;
  else if (t.volume24h > 100000) score += 8;

  // Buy pressure
  const totalTxns = t.buys24h + t.sells24h;
  if (totalTxns > 0) {
    const buyRatio = t.buys24h / totalTxns;
    if (buyRatio > 0.65) score += 20;
    else if (buyRatio > 0.55) score += 10;
    else if (buyRatio < 0.35) score -= 10;
  }

  // Liquidity safety
  if (t.liquidity > 200000) score += 10;
  else if (t.liquidity > 50000) score += 5;
  else if (t.liquidity < 10000) score -= 15;

  // Pair age (newer = riskier but more volatile)
  const ageHours = (Date.now() - t.pairCreatedAt) / 3600000;
  if (ageHours < 2)   score += 5;   // very new
  else if (ageHours < 12) score += 10; // fresh momentum

  return score;
}

// ── Fetch a WIDE set of DexScreener tokens for multi-coin scanning ────────────
async function getScalperTokens(): Promise<TokenCandidate[]> {
  try {
    // Step 1: get top boosted token addresses on Solana
    const boostRes = await fetch("https://api.dexscreener.com/token-boosts/top/v1", {
      signal: AbortSignal.timeout(7000),
    });
    if (!boostRes.ok) throw new Error("boost fetch failed");
    const boostData = await boostRes.json() as Array<{ tokenAddress: string; chainId: string }>;

    const addresses = boostData
      .filter((d) => d.chainId === "solana")
      .slice(0, 20)
      .map((d) => d.tokenAddress);

    if (addresses.length === 0) throw new Error("no addresses");

    // Step 2: fetch live pair data for those addresses
    const pairsRes = await fetch(
      `https://api.dexscreener.com/tokens/v1/solana/${addresses.join(",")}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!pairsRes.ok) throw new Error("pairs fetch failed");
    const pairsData = await pairsRes.json();
    const pairs = Array.isArray(pairsData) ? pairsData : (pairsData.pairs ?? []);

    // Dedupe by base token address — keep highest volume pair per token
    const seen = new Map<string, TokenCandidate>();
    for (const p of pairs) {
      if (!p?.baseToken?.address || p.chainId !== "solana") continue;
      if (p.baseToken.address === SOL_MINT || p.baseToken.address === USDC_MINT) continue;
      const priceUsd = parseFloat(p.priceUsd || "0");
      if (priceUsd <= 0) continue;

      const candidate: TokenCandidate = {
        symbol: p.baseToken.symbol,
        address: p.baseToken.address,
        priceUsd,
        volume24h: parseFloat(p.volume?.h24 || "0"),
        priceChange24h: parseFloat(p.priceChange?.h24 || "0"),
        priceChange1h: parseFloat(p.priceChange?.h1 || "0"),
        liquidity: parseFloat(p.liquidity?.usd || "0"),
        buys24h: p.txns?.h24?.buys ?? 0,
        sells24h: p.txns?.h24?.sells ?? 0,
        pairCreatedAt: p.pairCreatedAt ?? (Date.now() - 86400000),
        marketCap: parseFloat(p.marketCap || p.fdv || "0"),
      };

      const existing = seen.get(p.baseToken.address);
      if (!existing || candidate.volume24h > existing.volume24h) {
        seen.set(p.baseToken.address, candidate);
      }
    }

    const tokens = [...seen.values()].filter(
      (t) => t.volume24h > 10000 && t.liquidity > 5000
    );
    console.log(`Scalper scanner: ${tokens.length} tokens fetched from DexScreener`);
    return tokens.length > 0 ? tokens : FALLBACK_TOKENS;
  } catch (e) {
    console.error("getScalperTokens error:", e);
    return FALLBACK_TOKENS;
  }
}

// ── Fetch curated high-liquidity tokens (used for momentum / general) ─────────
async function getTrendingTokens(): Promise<TokenCandidate[]> {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263,EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm,JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN,HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3,4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
      { headers: { "Accept": "application/json" } }
    );
    if (!res.ok) return FALLBACK_TOKENS;
    const data = await res.json();
    const pairs = data.pairs || [];
    const seen = new Set<string>();
    const tokens: TokenCandidate[] = pairs
      .filter((p: any) =>
        p.chainId === "solana" &&
        p.baseToken?.address &&
        p.baseToken.address !== SOL_MINT &&
        p.baseToken.address !== USDC_MINT &&
        parseFloat(p.volume?.h24 || "0") > 10000 &&
        parseFloat(p.priceUsd || "0") > 0 &&
        !seen.has(p.baseToken.address) && seen.add(p.baseToken.address)
      )
      .slice(0, 10)
      .map((p: any) => ({
        symbol: p.baseToken.symbol,
        address: p.baseToken.address,
        priceUsd: parseFloat(p.priceUsd || "0"),
        volume24h: parseFloat(p.volume?.h24 || "0"),
        priceChange24h: parseFloat(p.priceChange?.h24 || "0"),
        priceChange1h: parseFloat(p.priceChange?.h1 || "0"),
        liquidity: parseFloat(p.liquidity?.usd || "0"),
        buys24h: p.txns?.h24?.buys ?? 0,
        sells24h: p.txns?.h24?.sells ?? 0,
        pairCreatedAt: p.pairCreatedAt ?? (Date.now() - 86400000 * 7),
        marketCap: parseFloat(p.marketCap || p.fdv || "0"),
      }));
    return tokens.length > 0 ? tokens : FALLBACK_TOKENS;
  } catch {
    return FALLBACK_TOKENS;
  }
}

// ── Token price lookup ────────────────────────────────────────────────────────
async function getTokenPrice(tokenAddress: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    if (!res.ok) return null;
    const data = await res.json();
    const pair = data.pairs?.[0];
    return pair ? parseFloat(pair.priceUsd || "0") : null;
  } catch {
    return null;
  }
}

// ── Category-aware token selection ───────────────────────────────────────────
interface PickResult { token: TokenCandidate; signal: string }

function pickToken(tokens: TokenCandidate[], category: string): PickResult {
  if (tokens.length === 0) throw new Error("No tokens available");

  switch (category) {
    case "scalper": {
      // Score all tokens, pick the highest composite score
      const scored = tokens
        .map((t) => ({ token: t, score: scoreToken(t) }))
        .sort((a, b) => b.score - a.score);
      const best = scored[0];
      const t = best.token;
      // Build a human-readable signal
      const buyRatio = t.buys24h + t.sells24h > 0
        ? ((t.buys24h / (t.buys24h + t.sells24h)) * 100).toFixed(0)
        : "?";
      const ageH = ((Date.now() - t.pairCreatedAt) / 3600000).toFixed(0);
      return {
        token: t,
        signal: `Scalper: ${t.priceChange1h > 0 ? "+" : ""}${t.priceChange1h.toFixed(1)}% 1h · ${buyRatio}% buys · vol $${(t.volume24h / 1000).toFixed(0)}K · ${ageH}h old · score ${best.score}`,
      };
    }

    case "momentum": {
      // Pick the token with highest 1h price change (positive momentum)
      const sorted = [...tokens].sort((a, b) => b.priceChange1h - a.priceChange1h);
      const t = sorted[0];
      return {
        token: t,
        signal: `Momentum: +${t.priceChange1h.toFixed(1)}% 1h · 24h vol $${(t.volume24h / 1000).toFixed(0)}K · 24h ${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(1)}%`,
      };
    }

    case "sniper": {
      // Target freshest pairs (< 24h) with decent buy pressure
      const newPairs = tokens.filter((t) => {
        const ageH = (Date.now() - t.pairCreatedAt) / 3600000;
        return ageH < 24 && t.buys24h > t.sells24h;
      });
      const pool = newPairs.length > 0 ? newPairs : tokens.slice(0, 5);
      const t = pool[Math.floor(Math.random() * pool.length)];
      const ageH = ((Date.now() - t.pairCreatedAt) / 3600000).toFixed(1);
      return {
        token: t,
        signal: `Sniper: new pair ${ageH}h · liq $${(t.liquidity / 1000).toFixed(0)}K · buys ${t.buys24h} vs sells ${t.sells24h}`,
      };
    }

    default: {
      const t = tokens[Math.floor(Math.random() * Math.min(tokens.length, 10))];
      return {
        token: t,
        signal: `DexScreener vol: $${(t.volume24h / 1000).toFixed(0)}k · 24h: ${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(1)}%`,
      };
    }
  }
}

async function getJupiterQuote(inputMint: string, outputMint: string, amountLamports: number): Promise<any> {
  const url = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=150`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jupiter quote failed: ${await res.text()}`);
  return res.json();
}

async function getJupiterSwapTx(quote: any, userPublicKey: string): Promise<string> {
  const res = await fetch("https://lite-api.jup.ag/swap/v1/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });
  if (!res.ok) throw new Error(`Jupiter swap failed: ${await res.text()}`);
  const data = await res.json();
  return data.swapTransaction;
}

async function signTransaction(swapTxBase64: string, pkcs8Base64: string): Promise<string> {
  const pkcs8Bytes = Uint8Array.from(atob(pkcs8Base64), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8Bytes.buffer,
    { name: "Ed25519" },
    false,
    ["sign"]
  );

  const txBytes = Uint8Array.from(atob(swapTxBase64), (c) => c.charCodeAt(0));
  let offset = 0;
  const numSigs = txBytes[offset];
  offset += 1;
  const sigStart = offset;
  offset += numSigs * 64;
  const message = txBytes.slice(offset);

  const signature = new Uint8Array(await crypto.subtle.sign("Ed25519", privateKey, message));
  const signedTx = new Uint8Array(txBytes);
  signedTx.set(signature, sigStart);

  return btoa(String.fromCharCode(...signedTx));
}

async function extractTxSignature(signedTxBase64: string): Promise<string> {
  const txBytes = Uint8Array.from(atob(signedTxBase64), (c) => c.charCodeAt(0));
  const sigBytes = txBytes.slice(1, 65);
  return encodeBase58(sigBytes);
}

async function sendTransaction(signedTxBase64: string): Promise<string> {
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "sendTransaction",
      params: [signedTxBase64, { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed" }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`RPC error: ${JSON.stringify(data.error)}`);
  return data.result;
}

async function getSolBalance(publicKey: string): Promise<number> {
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "getBalance",
      params: [publicKey, { commitment: "confirmed" }],
    }),
  });
  const data = await res.json();
  return (data.result?.value || 0) / 1e9;
}

async function updatePnlSnapshot(
  supabase: any,
  agentId: string,
  userId: string,
  realizedPnl: number,
  isWin: boolean
) {
  const { data: latestSnap } = await supabase
    .from("pnl_snapshots")
    .select("pnl_sol, total_trades, win_rate")
    .eq("agent_id", agentId)
    .order("snapshot_at", { ascending: false })
    .limit(1)
    .single();

  const prevPnl = latestSnap?.pnl_sol || 0;
  const prevTrades = latestSnap?.total_trades || 0;
  const prevWins = prevTrades > 0 && latestSnap?.win_rate
    ? Math.round(prevTrades * (latestSnap.win_rate / 100)) : 0;
  const newTotalTrades = prevTrades + 1;
  const newTotalWins = prevWins + (isWin ? 1 : 0);

  await supabase.from("pnl_snapshots").insert({
    agent_id: agentId,
    user_id: userId,
    pnl_sol: parseFloat((prevPnl + realizedPnl).toFixed(6)),
    total_trades: newTotalTrades,
    win_rate: parseFloat(((newTotalWins / newTotalTrades) * 100).toFixed(1)),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch running agents
    const { data: runningAgents, error: agentsError } = await supabase
      .from("agents")
      .select("id, user_id, category, name, take_profit_pct, stop_loss_pct")
      .eq("status", "running");

    if (agentsError) throw agentsError;
    if (!runningAgents || runningAgents.length === 0) {
      return new Response(JSON.stringify({ message: "No running agents", trades: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all strategy configs for running agents
    const agentIds = runningAgents.map((a: any) => a.id);
    const { data: strategyConfigs } = await supabase
      .from("agent_strategy_configs")
      .select("*")
      .in("agent_id", agentIds);

    const configByAgent: Record<string, any> = {};
    for (const cfg of (strategyConfigs || [])) {
      configByAgent[cfg.agent_id] = cfg;
    }

    // Determine which categories are active so we only fetch what we need
    const categories = new Set(runningAgents.map((a: any) => a.category));

    // Fetch token pools — scalper gets wide scan, others get curated list
    const [scalperTokens, trendingTokens] = await Promise.all([
      categories.has("scalper") ? getScalperTokens() : Promise.resolve(FALLBACK_TOKENS),
      (categories.has("momentum") || categories.has("sniper") || categories.has("general"))
        ? getTrendingTokens()
        : Promise.resolve(FALLBACK_TOKENS),
    ]);

    console.log(`Scalper pool: ${scalperTokens.length} tokens | Trending pool: ${trendingTokens.length} tokens`);

    const results = [];

    for (const agent of runningAgents) {
      try {
        const TAKE_PROFIT_PCT = agent.take_profit_pct ?? 0.05;
        const STOP_LOSS_PCT   = -(agent.stop_loss_pct ?? 0.03);
        const cfg = configByAgent[agent.id] ?? null;

        // ── Step 1: Check open positions for TP/SL ──────────────────────────
        const { data: openPositions } = await supabase
          .from("agent_positions")
          .select("*")
          .eq("agent_id", agent.id)
          .eq("status", "open");

        for (const pos of (openPositions || [])) {
          const currentPrice = await getTokenPrice(pos.token_address);
          if (!currentPrice || currentPrice <= 0) continue;

          const priceChange = (currentPrice - pos.entry_price) / pos.entry_price;
          const shouldSell = priceChange >= TAKE_PROFIT_PCT || priceChange <= STOP_LOSS_PCT;
          if (!shouldSell) continue;

          const reason = priceChange >= TAKE_PROFIT_PCT ? "take-profit" : "stop-loss";
          console.log(`Agent ${agent.name}: ${reason} triggered for ${pos.token_symbol} (${(priceChange * 100).toFixed(2)}%)`);

          const { data: wallet } = await supabase
            .from("agent_wallets")
            .select("public_key, encrypted_private_key, balance_sol")
            .eq("agent_id", agent.id)
            .single();

          if (!wallet) { console.log(`No wallet for agent ${agent.id}`); continue; }

          const tokenAmountRaw = Math.floor(pos.token_amount * 1e6);
          const sellQuote = await getJupiterQuote(pos.token_address, SOL_MINT, tokenAmountRaw);
          const sellSwapTx = await getJupiterSwapTx(sellQuote, wallet.public_key);
          const signedSellTx = await signTransaction(sellSwapTx, wallet.encrypted_private_key);
          await sendTransaction(signedSellTx);
          const onChainSellSig = await extractTxSignature(signedSellTx);

          const solReceived = parseInt(sellQuote.outAmount || "0") / 1e9;
          const realizedPnl = solReceived - pos.entry_amount_sol;
          const newBalance = await getSolBalance(wallet.public_key);

          await supabase.from("agent_positions").update({
            status: "closed",
            closed_at: new Date().toISOString(),
            exit_price: currentPrice,
            pnl_sol: parseFloat(realizedPnl.toFixed(6)),
          }).eq("id", pos.id);

          await supabase.from("trade_history").insert({
            agent_id: agent.id,
            user_id: agent.user_id,
            token_symbol: pos.token_symbol,
            token_address: pos.token_address,
            action: "sell",
            amount_sol: pos.entry_amount_sol,
            token_amount: pos.token_amount,
            price: currentPrice,
            pnl_sol: parseFloat(realizedPnl.toFixed(6)),
            signal: `${reason} @ ${(priceChange * 100 > 0 ? "+" : "")}${(priceChange * 100).toFixed(2)}%`,
            tx_signature: onChainSellSig,
          });

          await supabase.from("agent_wallets").update({ balance_sol: newBalance }).eq("agent_id", agent.id);
          await updatePnlSnapshot(supabase, agent.id, agent.user_id, realizedPnl, realizedPnl > 0);

          results.push({ agent: agent.name, action: "sell", reason, token: pos.token_symbol, pnl: realizedPnl, tx: onChainSellSig });
          console.log(`Sell tx confirmed: ${onChainSellSig}`);
        }

        // ── Step 2: Maybe open a new BUY position ────────────────────────────
        const maxPositions = cfg?.max_open_positions ?? 3;
        const openCount = (openPositions || []).filter((p: any) => p.status === "open").length;
        if (openCount >= maxPositions) {
          results.push({ agent: agent.name, action: "skip", reason: "max_positions" });
          continue;
        }

        // ~80% chance to buy per cycle
        if (Math.random() > 0.8) continue;

        const { data: wallet, error: walletError } = await supabase
          .from("agent_wallets")
          .select("public_key, encrypted_private_key, balance_sol")
          .eq("agent_id", agent.id)
          .single();

        if (walletError || !wallet) {
          console.log(`No wallet for agent ${agent.id}`);
          results.push({ agent: agent.name, status: "no_wallet" });
          continue;
        }

        const currentBalance = await getSolBalance(wallet.public_key);
        await supabase.from("agent_wallets").update({ balance_sol: currentBalance }).eq("agent_id", agent.id);

        if (currentBalance < 0.005) {
          console.log(`Insufficient balance: ${currentBalance} SOL for agent ${agent.name}`);
          results.push({ agent: agent.name, status: "insufficient_balance", balance: currentBalance });
          continue;
        }

        // Select token pool by category
        const isScalper = agent.category === "scalper";
        let eligibleTokens = isScalper ? scalperTokens : trendingTokens;

        // Apply strategy config filters
        if (cfg) {
          const filtered = eligibleTokens.filter((t) => {
            if (t.volume24h < (cfg.min_volume_24h ?? 0)) return false;
            if (t.priceChange1h < (cfg.min_price_change_1h ?? 0)) return false;
            return true;
          });
          if (filtered.length > 0) {
            eligibleTokens = filtered;
            console.log(`Agent ${agent.name}: strategy filter kept ${filtered.length}/${(isScalper ? scalperTokens : trendingTokens).length} tokens`);
          } else {
            console.log(`Agent ${agent.name}: no tokens passed strategy filters, using all`);
          }
        }

        const entryStrategy = cfg?.entry_strategy ?? agent.category;
        const { token, signal } = pickToken(eligibleTokens, entryStrategy);

        const configuredAmount = cfg?.trade_amount_sol ?? null;
        const tradeAmountSol = configuredAmount
          ? Math.min(configuredAmount, currentBalance - 0.001)
          : Math.min(currentBalance * (0.05 + Math.random() * 0.10), 0.05);
        const tradeAmountLamports = Math.floor(tradeAmountSol * 1e9);

        if (tradeAmountLamports < 10000) {
          console.log(`Trade amount too small: ${tradeAmountLamports} lamports`);
          continue;
        }

        console.log(`Agent ${agent.name} [${agent.category}]: BUY ${token.symbol} for ${tradeAmountSol.toFixed(4)} SOL | ${signal}`);

        const quote = await getJupiterQuote(SOL_MINT, token.address, tradeAmountLamports);
        const outAmount = parseInt(quote.outAmount || "0");
        if (outAmount <= 0) throw new Error(`Jupiter returned 0 outAmount for ${token.symbol}`);

        const swapTxBase64 = await getJupiterSwapTx(quote, wallet.public_key);
        const signedTxBase64 = await signTransaction(swapTxBase64, wallet.encrypted_private_key);
        await sendTransaction(signedTxBase64);
        const onChainSig = await extractTxSignature(signedTxBase64);

        const newBalance = await getSolBalance(wallet.public_key);
        await supabase.from("agent_wallets").update({ balance_sol: newBalance }).eq("agent_id", agent.id);

        await supabase.from("agent_positions").insert({
          agent_id: agent.id,
          user_id: agent.user_id,
          token_symbol: token.symbol,
          token_address: token.address,
          entry_price: token.priceUsd,
          entry_amount_sol: tradeAmountSol,
          token_amount: outAmount / 1e6,
          buy_tx_signature: onChainSig,
          status: "open",
        });

        await supabase.from("trade_history").insert({
          agent_id: agent.id,
          user_id: agent.user_id,
          token_symbol: token.symbol,
          token_address: token.address,
          action: "buy",
          amount_sol: tradeAmountSol,
          token_amount: outAmount / 1e6,
          price: token.priceUsd,
          pnl_sol: 0,
          signal,
          tx_signature: onChainSig,
        });

        await updatePnlSnapshot(supabase, agent.id, agent.user_id, -0.0001, false);

        results.push({ agent: agent.name, action: "buy", category: agent.category, token: token.symbol, amount: tradeAmountSol, signal, tx: onChainSig });
        console.log(`Buy tx confirmed: ${onChainSig}`);

      } catch (agentError) {
        console.error(`Error for agent ${agent.id} (${agent.name}):`, agentError);
        results.push({ agent: agent.name, status: "error", error: String(agentError) });
      }
    }

    return new Response(
      JSON.stringify({ message: "Trading cycle complete", results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("execute-trades error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
