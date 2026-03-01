import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const SOL_MINT = "So11111111111111111111111111111111111111112";

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

async function getJupiterQuote(inputMint: string, outputMint: string, amount: number): Promise<any> {
  const url = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=300`;
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
  const numSigs = txBytes[0];
  const sigStart = 1;
  const message = txBytes.slice(1 + numSigs * 64);
  const signature = new Uint8Array(await crypto.subtle.sign("Ed25519", privateKey, message));
  const signedTx = new Uint8Array(txBytes);
  signedTx.set(signature, sigStart);
  return btoa(String.fromCharCode(...signedTx));
}

async function extractTxSignature(signedTxBase64: string): Promise<string> {
  const txBytes = Uint8Array.from(atob(signedTxBase64), (c) => c.charCodeAt(0));
  return encodeBase58(txBytes.slice(1, 65));
}

async function sendTransaction(signedTxBase64: string): Promise<string> {
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
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

// Fetch all SPL token accounts with a non-zero balance for a wallet
async function getOnChainTokenBalances(publicKey: string): Promise<Array<{ mint: string; amount: number; decimals: number }>> {
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        publicKey,
        { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { encoding: "jsonParsed", commitment: "confirmed" },
      ],
    }),
  });
  const data = await res.json();
  const accounts = data.result?.value || [];
  return accounts
    .map((acc: any) => {
      const info = acc.account?.data?.parsed?.info;
      return {
        mint: info?.mint,
        amount: parseFloat(info?.tokenAmount?.amount || "0"),
        decimals: info?.tokenAmount?.decimals ?? 6,
      };
    })
    .filter((t: any) => t.mint && t.amount > 0);
}

async function updatePnlSnapshot(supabase: any, agentId: string, userId: string, realizedPnl: number, isWin: boolean) {
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

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { agent_id } = await req.json();
    if (!agent_id) {
      return new Response(JSON.stringify({ error: "agent_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, user_id, name")
      .eq("id", agent_id)
      .eq("user_id", user.id)
      .single();

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get wallet
    const { data: wallet } = await supabase
      .from("agent_wallets")
      .select("public_key, encrypted_private_key, balance_sol")
      .eq("agent_id", agent_id)
      .single();

    if (!wallet) {
      return new Response(JSON.stringify({ error: "No wallet found for agent" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    // ── Step 1: Sell DB open positions ───────────────────────────────────────
    const { data: openPositions } = await supabase
      .from("agent_positions")
      .select("*")
      .eq("agent_id", agent_id)
      .eq("status", "open");

    for (const pos of (openPositions || [])) {
      try {
        const currentPrice = await getTokenPrice(pos.token_address);
        const tokenAmountRaw = Math.floor(pos.token_amount * 1e6);
        if (tokenAmountRaw < 1) continue;

        const sellQuote = await getJupiterQuote(pos.token_address, SOL_MINT, tokenAmountRaw);
        const sellSwapTx = await getJupiterSwapTx(sellQuote, wallet.public_key);
        const signedSellTx = await signTransaction(sellSwapTx, wallet.encrypted_private_key);
        await sendTransaction(signedSellTx);
        const txSig = await extractTxSignature(signedSellTx);

        const solReceived = parseInt(sellQuote.outAmount || "0") / 1e9;
        const realizedPnl = solReceived - pos.entry_amount_sol;
        const exitPrice = currentPrice ?? pos.entry_price;

        await supabase.from("agent_positions").update({
          status: "closed",
          closed_at: new Date().toISOString(),
          exit_price: exitPrice,
          pnl_sol: parseFloat(realizedPnl.toFixed(6)),
        }).eq("id", pos.id);

        await supabase.from("trade_history").insert({
          agent_id,
          user_id: user.id,
          token_symbol: pos.token_symbol,
          token_address: pos.token_address,
          action: "sell",
          amount_sol: pos.entry_amount_sol,
          token_amount: pos.token_amount,
          price: exitPrice,
          pnl_sol: parseFloat(realizedPnl.toFixed(6)),
          signal: `manual sell-all · ${realizedPnl >= 0 ? "+" : ""}${(realizedPnl / pos.entry_amount_sol * 100).toFixed(2)}%`,
          tx_signature: txSig,
        });

        await updatePnlSnapshot(supabase, agent_id, user.id, realizedPnl, realizedPnl > 0);
        results.push({ token: pos.token_symbol, status: "sold", source: "db", pnl: realizedPnl, tx: txSig });
        console.log(`Sold DB position ${pos.token_symbol}: ${txSig}`);
      } catch (e) {
        console.error(`Failed to sell DB position ${pos.token_symbol}:`, e);
        results.push({ token: pos.token_symbol, status: "error", source: "db", error: String(e) });
      }
    }

    // ── Step 2: Sell any remaining on-chain token balances ───────────────────
    const onChainTokens = await getOnChainTokenBalances(wallet.public_key);
    console.log(`On-chain token balances found: ${JSON.stringify(onChainTokens)}`);

    for (const tok of onChainTokens) {
      // Skip if already handled by DB position
      const alreadySold = results.find(r => r.status === "sold" && r.source === "db");
      // We still try to sell — Jupiter will handle dust gracefully
      try {
        if (tok.amount < 1) {
          console.log(`Skipping dust: mint=${tok.mint} amount=${tok.amount}`);
          continue;
        }

        console.log(`Selling on-chain token: mint=${tok.mint} amount=${tok.amount}`);
        const sellQuote = await getJupiterQuote(tok.mint, SOL_MINT, tok.amount);
        const sellSwapTx = await getJupiterSwapTx(sellQuote, wallet.public_key);
        const signedSellTx = await signTransaction(sellSwapTx, wallet.encrypted_private_key);
        await sendTransaction(signedSellTx);
        const txSig = await extractTxSignature(signedSellTx);

        const solReceived = parseInt(sellQuote.outAmount || "0") / 1e9;
        const currentPrice = await getTokenPrice(tok.mint);

        // Log in trade_history as an on-chain cleanup sell
        await supabase.from("trade_history").insert({
          agent_id,
          user_id: user.id,
          token_symbol: tok.mint.slice(0, 6),
          token_address: tok.mint,
          action: "sell",
          amount_sol: solReceived,
          token_amount: tok.amount / Math.pow(10, tok.decimals),
          price: currentPrice ?? 0,
          pnl_sol: 0,
          signal: "on-chain cleanup sell",
          tx_signature: txSig,
        });

        results.push({ token: tok.mint, status: "sold", source: "onchain", solReceived, tx: txSig });
        console.log(`On-chain sell complete: ${txSig}`);
      } catch (e) {
        console.error(`Failed on-chain sell for ${tok.mint}:`, e);
        results.push({ token: tok.mint, status: "error", source: "onchain", error: String(e) });
      }
    }

    // Update wallet balance
    const newBalance = await getSolBalance(wallet.public_key);
    await supabase.from("agent_wallets").update({ balance_sol: newBalance }).eq("agent_id", agent_id);

    const soldCount = results.filter(r => r.status === "sold").length;
    return new Response(
      JSON.stringify({ message: "Sell-all complete", sold: soldCount, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sell-all-positions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
