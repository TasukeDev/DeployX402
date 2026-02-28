import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOKENS = [
  { symbol: "BONK", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { symbol: "WIF", address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
  { symbol: "POPCAT", address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr" },
  { symbol: "JUP", address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
  { symbol: "RENDER", address: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof" },
  { symbol: "MEW", address: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5" },
  { symbol: "MYRO", address: "HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4" },
  { symbol: "SLERF", address: "7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3" },
];

const SIGNALS = [
  "Volume spike detected",
  "Breakout pattern",
  "Social momentum rising",
  "Whale accumulation",
  "New liquidity pool",
  "Trend reversal signal",
  "RSI oversold bounce",
  "MACD crossover",
  null,
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all running agents
    const { data: runningAgents, error: agentsError } = await supabase
      .from("agents")
      .select("id, user_id, category")
      .eq("status", "running");

    if (agentsError) throw agentsError;
    if (!runningAgents || runningAgents.length === 0) {
      return new Response(JSON.stringify({ message: "No running agents", trades: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trades = [];

    for (const agent of runningAgents) {
      // ~60% chance each agent trades per cycle
      if (Math.random() > 0.6) continue;

      const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
      const action = Math.random() > 0.45 ? "buy" : "sell";
      const amountSol = parseFloat((Math.random() * 2 + 0.05).toFixed(4));
      const price = parseFloat((Math.random() * 0.01 + 0.0001).toFixed(6));
      const tokenAmount = parseFloat((amountSol / price).toFixed(2));
      const pnlSol = action === "buy" ? 0 : parseFloat(((Math.random() - 0.35) * amountSol).toFixed(4));
      const signal = SIGNALS[Math.floor(Math.random() * SIGNALS.length)];

      trades.push({
        agent_id: agent.id,
        user_id: agent.user_id,
        token_symbol: token.symbol,
        token_address: token.address,
        action,
        amount_sol: amountSol,
        token_amount: tokenAmount,
        price,
        pnl_sol: pnlSol,
        signal,
      });
    }

    if (trades.length > 0) {
      const { error: insertError } = await supabase.from("trade_history").insert(trades);
      if (insertError) throw insertError;

      // Update PnL snapshots per agent
      const agentPnls: Record<string, { userId: string; pnl: number; count: number; wins: number }> = {};
      for (const t of trades) {
        if (!agentPnls[t.agent_id]) agentPnls[t.agent_id] = { userId: t.user_id, pnl: 0, count: 0, wins: 0 };
        agentPnls[t.agent_id].pnl += t.pnl_sol;
        agentPnls[t.agent_id].count += 1;
        if (t.pnl_sol > 0) agentPnls[t.agent_id].wins += 1;
      }

      for (const [agentId, data] of Object.entries(agentPnls)) {
        // Get latest snapshot to accumulate
        const { data: latest } = await supabase
          .from("pnl_snapshots")
          .select("pnl_sol, total_trades, win_rate")
          .eq("agent_id", agentId)
          .order("snapshot_at", { ascending: false })
          .limit(1)
          .single();

        const prevPnl = latest?.pnl_sol || 0;
        const prevTrades = latest?.total_trades || 0;
        const prevWins = prevTrades > 0 && latest?.win_rate ? Math.round(prevTrades * (latest.win_rate / 100)) : 0;
        const newTotalTrades = prevTrades + data.count;
        const newTotalWins = prevWins + data.wins;

        await supabase.from("pnl_snapshots").insert({
          agent_id: agentId,
          user_id: data.userId,
          pnl_sol: parseFloat((prevPnl + data.pnl).toFixed(4)),
          total_trades: newTotalTrades,
          win_rate: newTotalTrades > 0 ? parseFloat(((newTotalWins / newTotalTrades) * 100).toFixed(1)) : 0,
        });
      }
    }

    return new Response(
      JSON.stringify({ message: "Simulation complete", trades: trades.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("simulate-trades error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
