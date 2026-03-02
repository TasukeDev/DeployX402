import { useMemo } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, TrendingDown, BarChart3, Activity, Award, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from "recharts";

interface Trade {
  id: string;
  token_symbol: string;
  action: string;
  amount_sol: number;
  pnl_sol: number;
  created_at: string;
}

interface PnlSnapshot {
  pnl_sol: number;
  snapshot_at: string;
}

interface RiskAnalyticsProps {
  trades: Trade[];
  snapshots: PnlSnapshot[];
}

const StatCard = ({
  icon: Icon, label, value, sub, color = "text-foreground", bg = "bg-secondary", warning = false,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  color?: string; bg?: string; warning?: boolean;
}) => (
  <div className={`rounded-xl border ${warning ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"} p-4`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${bg} ${warning ? "border-destructive/20" : "border-border"}`}>
        <Icon className={`h-3.5 w-3.5 ${warning ? "text-destructive" : color}`} />
      </div>
    </div>
    <p className={`text-xl font-mono font-bold ${warning ? "text-destructive" : color}`}>{value}</p>
    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{label}</p>
    {sub && <p className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">{sub}</p>}
  </div>
);

export const RiskAnalytics = ({ trades, snapshots }: RiskAnalyticsProps) => {
  const metrics = useMemo(() => {
    const sells = trades.filter((t) => t.action === "sell" && t.pnl_sol != null);
    if (sells.length === 0) return null;

    const returns = sells.map((t) => t.pnl_sol);
    const wins = returns.filter((r) => r > 0);
    const losses = returns.filter((r) => r < 0);

    // Win Rate
    const winRate = (wins.length / returns.length) * 100;

    // Average Win / Loss
    const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;

    // Profit Factor
    const totalWins = wins.reduce((a, b) => a + b, 0);
    const totalLosses = Math.abs(losses.reduce((a, b) => a + b, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    // Sharpe Ratio (simplified daily)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpe = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0;

    // Max Drawdown from snapshots
    let maxDrawdown = 0;
    let peak = -Infinity;
    for (const s of snapshots) {
      if (s.pnl_sol > peak) peak = s.pnl_sol;
      const dd = peak - s.pnl_sol;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Win streak / Loss streak
    let currentWinStreak = 0, maxWinStreak = 0;
    let currentLossStreak = 0, maxLossStreak = 0;
    for (const r of returns) {
      if (r > 0) {
        currentWinStreak++;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        currentLossStreak = 0;
      } else {
        currentLossStreak++;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        currentWinStreak = 0;
      }
    }

    // Volatility (std dev of returns as % of mean)
    const volatility = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : stdDev * 100;

    // Calmar Ratio
    const totalPnl = returns.reduce((a, b) => a + b, 0);
    const calmar = maxDrawdown > 0 ? totalPnl / maxDrawdown : 0;

    // Expectancy
    const expectancy = winRate / 100 * avgWin - (1 - winRate / 100) * avgLoss;

    return {
      winRate, avgWin, avgLoss, profitFactor, sharpe, maxDrawdown,
      maxWinStreak, maxLossStreak, volatility, calmar, expectancy,
      totalTrades: returns.length,
    };
  }, [trades, snapshots]);

  // Equity curve data
  const equityCurve = useMemo(() => {
    return snapshots.map((s, i) => ({
      i,
      pnl: s.pnl_sol,
      date: new Date(s.snapshot_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
    }));
  }, [snapshots]);

  if (!metrics) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border"
      >
        <BarChart3 className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm font-mono text-muted-foreground">No closed trades yet</p>
        <p className="text-[11px] font-mono text-muted-foreground mt-1">Risk metrics will appear after the agent executes trades.</p>
      </motion.div>
    );
  }

  const riskLevel = metrics.maxDrawdown > 0.5 || metrics.sharpe < 0 ? "High Risk" : metrics.sharpe > 1.5 ? "Low Risk" : "Medium Risk";
  const riskColor = riskLevel === "High Risk" ? "text-destructive" : riskLevel === "Low Risk" ? "text-primary" : "text-amber-400";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Risk Banner */}
      <div className={`rounded-xl border p-3 flex items-center gap-3 ${
        riskLevel === "High Risk" ? "border-destructive/30 bg-destructive/5" :
        riskLevel === "Low Risk" ? "border-primary/30 bg-primary/5" :
        "border-amber-400/30 bg-amber-400/5"
      }`}>
        <ShieldAlert className={`h-4 w-4 shrink-0 ${riskColor}`} />
        <div>
          <p className={`text-xs font-mono font-medium ${riskColor}`}>{riskLevel} Profile</p>
          <p className="text-[10px] font-mono text-muted-foreground">
            Sharpe {metrics.sharpe.toFixed(2)} · Max Drawdown {metrics.maxDrawdown.toFixed(4)} SOL · {metrics.totalTrades} trades analyzed
          </p>
        </div>
      </div>

      {/* Equity Curve */}
      {equityCurve.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Equity Curve</span>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 10, fontFamily: "JetBrains Mono" }}
                formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(4)} SOL`]}
              />
              <Area type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" fill="url(#riskGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon={Award} label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`}
          sub={`${Math.round(metrics.winRate / 100 * metrics.totalTrades)}W / ${metrics.totalTrades - Math.round(metrics.winRate / 100 * metrics.totalTrades)}L`}
          color={metrics.winRate > 50 ? "text-primary" : "text-destructive"} />

        <StatCard icon={BarChart3} label="Sharpe Ratio" value={metrics.sharpe.toFixed(2)}
          sub="annualized"
          color={metrics.sharpe > 1 ? "text-primary" : metrics.sharpe > 0 ? "text-amber-400" : "text-destructive"}
          warning={metrics.sharpe < 0} />

        <StatCard icon={TrendingDown} label="Max Drawdown" value={`${metrics.maxDrawdown.toFixed(4)} SOL`}
          sub="peak-to-trough" warning={metrics.maxDrawdown > 0.3} color="text-foreground" />

        <StatCard icon={Activity} label="Profit Factor" value={
          metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)
        } sub="wins / losses" color={metrics.profitFactor > 1.5 ? "text-primary" : metrics.profitFactor > 1 ? "text-amber-400" : "text-destructive"}
          warning={metrics.profitFactor < 1} />

        <StatCard icon={TrendingDown} label="Volatility" value={`${metrics.volatility.toFixed(0)}%`}
          sub="return std dev"
          warning={metrics.volatility > 200} />

        <StatCard icon={Award} label="Expectancy" value={`${metrics.expectancy >= 0 ? "+" : ""}${metrics.expectancy.toFixed(4)} SOL`}
          sub="per trade"
          color={metrics.expectancy >= 0 ? "text-primary" : "text-destructive"}
          warning={metrics.expectancy < 0} />
      </div>

      {/* Streaks & Averages */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Streak Analysis</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Max Win Streak</p>
            <p className="text-lg font-mono font-bold text-primary">{metrics.maxWinStreak}</p>
            <p className="text-[10px] font-mono text-muted-foreground">consecutive wins</p>
          </div>
          <div>
            <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Max Loss Streak</p>
            <p className="text-lg font-mono font-bold text-destructive">{metrics.maxLossStreak}</p>
            <p className="text-[10px] font-mono text-muted-foreground">consecutive losses</p>
          </div>
          <div>
            <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Avg Win</p>
            <p className="text-lg font-mono font-bold text-primary">+{metrics.avgWin.toFixed(4)}</p>
            <p className="text-[10px] font-mono text-muted-foreground">SOL per win</p>
          </div>
          <div>
            <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Avg Loss</p>
            <p className="text-lg font-mono font-bold text-destructive">-{metrics.avgLoss.toFixed(4)}</p>
            <p className="text-[10px] font-mono text-muted-foreground">SOL per loss</p>
          </div>
        </div>
      </div>

      {/* Calmar Ratio */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">Calmar Ratio</p>
          <p className={`text-2xl font-mono font-bold ${metrics.calmar > 1 ? "text-primary" : metrics.calmar > 0 ? "text-amber-400" : "text-destructive"}`}>
            {metrics.calmar.toFixed(2)}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Total PnL / Max Drawdown</p>
        </div>
        <AlertTriangle className={`h-8 w-8 ${metrics.calmar < 0 ? "text-destructive/40" : "text-primary/20"}`} />
      </div>
    </motion.div>
  );
};
