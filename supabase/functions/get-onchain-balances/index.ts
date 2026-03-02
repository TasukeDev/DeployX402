import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

async function getOnChainTokenBalances(publicKey: string): Promise<Array<{ mint: string; amount: number; decimals: number; uiAmount: number }>> {
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
      const decimals = info?.tokenAmount?.decimals ?? 6;
      const amount = parseFloat(info?.tokenAmount?.amount || "0");
      const uiAmount = parseFloat(info?.tokenAmount?.uiAmount || "0");
      return { mint: info?.mint, amount, decimals, uiAmount };
    })
    .filter((t: any) => t.mint && t.uiAmount > 0);
}

async function getTokenMeta(mint: string): Promise<{ symbol: string; priceUsd: number | null }> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    if (!res.ok) return { symbol: mint.slice(0, 6), priceUsd: null };
    const data = await res.json();
    const pair = data.pairs?.[0];
    return {
      symbol: pair?.baseToken?.symbol || mint.slice(0, 6),
      priceUsd: pair ? parseFloat(pair.priceUsd || "0") : null,
    };
  } catch {
    return { symbol: mint.slice(0, 6), priceUsd: null };
  }
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { agent_id } = await req.json();
    if (!agent_id) {
      return new Response(JSON.stringify({ error: "agent_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // First verify the agent belongs to the user (or is public and user is authenticated)
    const { data: agent } = await supabase
      .from("agents")
      .select("id, user_id, is_public")
      .eq("id", agent_id)
      .single();

    if (!agent || (agent.user_id !== user.id && !agent.is_public)) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up wallet by agent_id only (ownership already verified above)
    const { data: wallet } = await supabase
      .from("agent_wallets")
      .select("public_key")
      .eq("agent_id", agent_id)
      .single();

    if (!wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch on-chain token balances + SOL balance in parallel
    const [tokens, solBalance] = await Promise.all([
      getOnChainTokenBalances(wallet.public_key),
      getSolBalance(wallet.public_key),
    ]);

    // Enrich token metadata from DexScreener (parallel)
    const enriched = await Promise.all(
      tokens.map(async (tok) => {
        const meta = await getTokenMeta(tok.mint);
        return { ...tok, ...meta };
      })
    );

    return new Response(
      JSON.stringify({ tokens: enriched, sol_balance: solBalance, synced_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("get-onchain-balances error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
