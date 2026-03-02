import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function validateApiKey(apiKey: string): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const hash = await hashKey(apiKey);
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, is_active")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .single();

  if (error || !data) return false;

  // Update last_used_at and request_count
  await supabase
    .from("api_keys")
    .update({
      last_used_at: new Date().toISOString(),
      request_count: supabase.rpc ? undefined : undefined, // use raw update
    })
    .eq("id", data.id);

  // Increment request_count separately
  await supabase.rpc("increment_api_key_count", { key_id: data.id }).catch(() => {
    // If RPC doesn't exist, just update last_used_at
  });

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate via x-api-key header
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing x-api-key header", docs: "https://launchpad-agent-flow.lovable.app/api-docs" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const valid = await validateApiKey(apiKey);
  if (!valid) {
    return new Response(
      JSON.stringify({ error: "Invalid or inactive API key" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/public-api/, "");

  try {
    // GET /leaderboard
    if (path === "/leaderboard" || path === "/leaderboard/") {
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const { data: agents } = await supabase
        .from("agents")
        .select("id, name, category, model, created_at")
        .eq("is_public", true);

      if (!agents || agents.length === 0) {
        return new Response(JSON.stringify({ data: [], total: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const agentIds = agents.map((a) => a.id);
      const { data: snapshots } = await supabase
        .from("pnl_snapshots")
        .select("agent_id, pnl_sol, win_rate, total_trades, snapshot_at")
        .in("agent_id", agentIds)
        .order("snapshot_at", { ascending: false });

      // Get latest snapshot per agent
      const latestByAgent: Record<string, typeof snapshots[0]> = {};
      for (const snap of snapshots || []) {
        if (!latestByAgent[snap.agent_id]) {
          latestByAgent[snap.agent_id] = snap;
        }
      }

      const leaderboard = agents
        .map((agent) => ({
          id: agent.id,
          name: agent.name,
          category: agent.category,
          pnl_sol: latestByAgent[agent.id]?.pnl_sol ?? 0,
          win_rate: latestByAgent[agent.id]?.win_rate ?? 0,
          total_trades: latestByAgent[agent.id]?.total_trades ?? 0,
          last_active: latestByAgent[agent.id]?.snapshot_at ?? null,
        }))
        .sort((a, b) => b.pnl_sol - a.pnl_sol)
        .slice(0, limit);

      return new Response(JSON.stringify({ data: leaderboard, total: leaderboard.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /agents/:id/stats
    const statsMatch = path.match(/^\/agents\/([^/]+)\/stats$/);
    if (statsMatch) {
      const agentId = statsMatch[1];
      const { data: agent } = await supabase
        .from("agents")
        .select("id, name, category, status, is_public, created_at")
        .eq("id", agentId)
        .eq("is_public", true)
        .single();

      if (!agent) {
        return new Response(JSON.stringify({ error: "Agent not found or not public" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: snapshots } = await supabase
        .from("pnl_snapshots")
        .select("pnl_sol, win_rate, total_trades, snapshot_at")
        .eq("agent_id", agentId)
        .order("snapshot_at", { ascending: false })
        .limit(1);

      const latest = snapshots?.[0];

      return new Response(
        JSON.stringify({
          data: {
            id: agent.id,
            name: agent.name,
            category: agent.category,
            status: agent.status,
            pnl_sol: latest?.pnl_sol ?? 0,
            win_rate: latest?.win_rate ?? 0,
            total_trades: latest?.total_trades ?? 0,
            last_active: latest?.snapshot_at ?? null,
            created_at: agent.created_at,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /agents/:id/trades
    const tradesMatch = path.match(/^\/agents\/([^/]+)\/trades$/);
    if (tradesMatch) {
      const agentId = tradesMatch[1];
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
      const action = url.searchParams.get("action"); // buy | sell

      // Check agent is public
      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("id", agentId)
        .eq("is_public", true)
        .single();

      if (!agent) {
        return new Response(JSON.stringify({ error: "Agent not found or not public" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let query = supabase
        .from("trade_history")
        .select("id, action, token_symbol, token_address, amount_sol, price, token_amount, pnl_sol, signal, tx_signature, created_at")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (action === "buy" || action === "sell") {
        query = query.eq("action", action);
      }

      const { data: trades } = await query;

      return new Response(JSON.stringify({ data: trades || [], total: trades?.length ?? 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /agents/:id/positions
    const positionsMatch = path.match(/^\/agents\/([^/]+)\/positions$/);
    if (positionsMatch) {
      const agentId = positionsMatch[1];
      const status = url.searchParams.get("status") || "open";

      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("id", agentId)
        .eq("is_public", true)
        .single();

      if (!agent) {
        return new Response(JSON.stringify({ error: "Agent not found or not public" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let query = supabase
        .from("agent_positions")
        .select("id, token_symbol, token_address, status, entry_amount_sol, entry_price, exit_price, token_amount, pnl_sol, buy_tx_signature, created_at, closed_at")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data: positions } = await query;

      return new Response(JSON.stringify({ data: positions || [], total: positions?.length ?? 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 404
    return new Response(
      JSON.stringify({
        error: "Endpoint not found",
        available_endpoints: [
          "GET /leaderboard",
          "GET /agents/:id/stats",
          "GET /agents/:id/trades",
          "GET /agents/:id/positions",
        ],
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("public-api error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
