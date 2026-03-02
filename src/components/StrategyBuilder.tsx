import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings2, Save, RotateCcw, CheckCircle2, Info, Loader2, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StrategyConfig {
  minMarketCapUsd: number;
  maxMarketCapUsd: number;
  minVolume24h: number;
  minLiquidityUsd: number;
  maxPairAgeHours: number;
  minPriceChange1h: number;
  maxPriceChange1h: number;
  minBuySellRatio: number;
  tradeAmountSol: number;
  maxOpenPositions: number;
  entryStrategy: "momentum" | "dip" | "breakout";
  exitStrategy: "tp_sl" | "trailing" | "time_based";
  trailingStopPct: number;
  maxHoldMinutes: number;
}

const DEFAULTS: StrategyConfig = {
  minMarketCapUsd: 10000,
  maxMarketCapUsd: 10000000,
  minVolume24h: 50000,
  minLiquidityUsd: 20000,
  maxPairAgeHours: 72,
  minPriceChange1h: 2,
  maxPriceChange1h: 100,
  minBuySellRatio: 1.2,
  tradeAmountSol: 0.01,
  maxOpenPositions: 3,
  entryStrategy: "momentum",
  exitStrategy: "tp_sl",
  trailingStopPct: 5,
  maxHoldMinutes: 60,
};

const ENTRY_STRATEGIES = [
  { key: "momentum", label: "Momentum", desc: "Buy tokens with strong upward price action" },
  { key: "dip", label: "Dip Buy", desc: "Buy tokens that dipped but show recovery signs" },
  { key: "breakout", label: "Breakout", desc: "Buy tokens breaking new highs with volume" },
] as const;

const EXIT_STRATEGIES = [
  { key: "tp_sl", label: "TP / SL", desc: "Fixed take-profit and stop-loss percentages" },
  { key: "trailing", label: "Trailing Stop", desc: "Dynamic stop that follows the price up" },
  { key: "time_based", label: "Time-Based", desc: "Exit after a maximum hold duration" },
] as const;

interface StrategyBuilderProps {
  agentId: string;
  takeProfitPct: number;
  stopLossPct: number;
  onSave?: (config: StrategyConfig) => void;
}

const SliderRow = ({
  label, value, min, max, step, format, onChange, info,
}: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void; info?: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
        {info && (
          <span title={info}>
            <Info className="h-2.5 w-2.5 text-muted-foreground/50" />
          </span>
        )}
      </div>
      <span className="text-[11px] font-mono font-medium text-foreground">{format(value)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-secondary"
    />
    <div className="flex justify-between text-[8px] font-mono text-muted-foreground/50">
      <span>{format(min)}</span>
      <span>{format(max)}</span>
    </div>
  </div>
);

export const StrategyBuilder = ({ agentId, takeProfitPct, stopLossPct, onSave }: StrategyBuilderProps) => {
  const [config, setConfig] = useState<StrategyConfig>({
    ...DEFAULTS,
    trailingStopPct: stopLossPct * 100,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasExisting, setHasExisting] = useState(false);

  // Load existing config from DB
  useEffect(() => {
    if (!agentId) return;
    supabase
      .from("agent_strategy_configs" as any)
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle()
      .then(({ data: rawData }) => {
        const data = rawData as any;
        if (data) {
          setHasExisting(true);
          setConfig({
            minMarketCapUsd: data.min_market_cap_usd,
            maxMarketCapUsd: data.max_market_cap_usd,
            minVolume24h: data.min_volume_24h,
            minLiquidityUsd: data.min_liquidity_usd,
            maxPairAgeHours: data.max_pair_age_hours,
            minPriceChange1h: data.min_price_change_1h,
            maxPriceChange1h: data.max_price_change_1h,
            minBuySellRatio: data.min_buy_sell_ratio,
            tradeAmountSol: data.trade_amount_sol,
            maxOpenPositions: data.max_open_positions,
            entryStrategy: data.entry_strategy as StrategyConfig["entryStrategy"],
            exitStrategy: data.exit_strategy as StrategyConfig["exitStrategy"],
            trailingStopPct: data.trailing_stop_pct,
            maxHoldMinutes: data.max_hold_minutes,
          });
        }
        setLoading(false);
      });
  }, [agentId]);

  const set = <K extends keyof StrategyConfig>(key: K, value: StrategyConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const row = {
      agent_id: agentId,
      entry_strategy: config.entryStrategy,
      exit_strategy: config.exitStrategy,
      trailing_stop_pct: config.trailingStopPct,
      max_hold_minutes: config.maxHoldMinutes,
      min_market_cap_usd: config.minMarketCapUsd,
      max_market_cap_usd: config.maxMarketCapUsd,
      min_volume_24h: config.minVolume24h,
      min_liquidity_usd: config.minLiquidityUsd,
      max_pair_age_hours: config.maxPairAgeHours,
      min_price_change_1h: config.minPriceChange1h,
      max_price_change_1h: config.maxPriceChange1h,
      min_buy_sell_ratio: config.minBuySellRatio,
      trade_amount_sol: config.tradeAmountSol,
      max_open_positions: config.maxOpenPositions,
    };

    const { error } = hasExisting
      ? await supabase.from("agent_strategy_configs" as any).update(row).eq("agent_id", agentId)
      : await supabase.from("agent_strategy_configs" as any).insert({ ...row, user_id: (await supabase.auth.getUser()).data.user?.id });

    if (!error) {
      setHasExisting(true);
      setSaved(true);
      onSave?.(config);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const handleReset = () => {
    setConfig({ ...DEFAULTS, trailingStopPct: stopLossPct * 100 });
    setSaved(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Strategy Builder</span>
          {!loading && (
            <span className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border ${
              hasExisting
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-secondary border-border text-muted-foreground"
            }`}>
              <Database className="h-2.5 w-2.5" />
              {hasExisting ? "Saved to DB" : "Not saved"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-2.5 w-2.5" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono transition-colors disabled:opacity-60 ${
              saved
                ? "bg-primary/10 border border-primary/20 text-primary"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {saving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : saved ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Save className="h-2.5 w-2.5" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Config"}
          </button>
        </div>
      </div>

      {/* Entry Strategy */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Entry Strategy</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ENTRY_STRATEGIES.map((s) => (
            <button
              key={s.key}
              onClick={() => set("entryStrategy", s.key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.entryStrategy === s.key
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-secondary/30 hover:border-border/80"
              }`}
            >
              <p className={`text-[11px] font-mono font-semibold ${config.entryStrategy === s.key ? "text-primary" : "text-foreground"}`}>{s.label}</p>
              <p className="text-[9px] font-mono text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Exit Strategy */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Exit Strategy</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {EXIT_STRATEGIES.map((s) => (
            <button
              key={s.key}
              onClick={() => set("exitStrategy", s.key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.exitStrategy === s.key
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-secondary/30 hover:border-border/80"
              }`}
            >
              <p className={`text-[11px] font-mono font-semibold ${config.exitStrategy === s.key ? "text-primary" : "text-foreground"}`}>{s.label}</p>
              <p className="text-[9px] font-mono text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
            </button>
          ))}
        </div>

        {config.exitStrategy === "trailing" && (
          <div className="pt-2">
            <SliderRow
              label="Trailing Stop %"
              value={config.trailingStopPct}
              min={1} max={20} step={0.5}
              format={(v) => `${v}%`}
              onChange={(v) => set("trailingStopPct", v)}
              info="Stop loss that follows the price up"
            />
          </div>
        )}
        {config.exitStrategy === "time_based" && (
          <div className="pt-2">
            <SliderRow
              label="Max Hold Duration"
              value={config.maxHoldMinutes}
              min={5} max={240} step={5}
              format={(v) => v >= 60 ? `${(v / 60).toFixed(1)}h` : `${v}m`}
              onChange={(v) => set("maxHoldMinutes", v)}
              info="Force exit after this many minutes"
            />
          </div>
        )}
      </div>

      {/* Token Filters */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Token Filters</p>

        <SliderRow
          label="Min Market Cap"
          value={config.minMarketCapUsd}
          min={1000} max={1000000} step={1000}
          format={(v) => `$${(v / 1000).toFixed(0)}K`}
          onChange={(v) => set("minMarketCapUsd", v)}
          info="Minimum market cap in USD"
        />

        <SliderRow
          label="Max Market Cap"
          value={config.maxMarketCapUsd}
          min={100000} max={50000000} step={100000}
          format={(v) => `$${(v / 1000000).toFixed(1)}M`}
          onChange={(v) => set("maxMarketCapUsd", v)}
          info="Avoid large-cap tokens with less upside"
        />

        <SliderRow
          label="Min 24h Volume"
          value={config.minVolume24h}
          min={5000} max={500000} step={5000}
          format={(v) => `$${(v / 1000).toFixed(0)}K`}
          onChange={(v) => set("minVolume24h", v)}
          info="Ensures enough trading activity"
        />

        <SliderRow
          label="Min Liquidity"
          value={config.minLiquidityUsd}
          min={5000} max={200000} step={5000}
          format={(v) => `$${(v / 1000).toFixed(0)}K`}
          onChange={(v) => set("minLiquidityUsd", v)}
          info="Pool size needed for safe entry/exit"
        />

        <SliderRow
          label="Max Pair Age"
          value={config.maxPairAgeHours}
          min={1} max={168} step={1}
          format={(v) => `${v}h`}
          onChange={(v) => set("maxPairAgeHours", v)}
          info="Only trade new pairs up to N hours old"
        />

        <SliderRow
          label="Min 1h Price Change"
          value={config.minPriceChange1h}
          min={0} max={50} step={0.5}
          format={(v) => `+${v}%`}
          onChange={(v) => set("minPriceChange1h", v)}
          info="Minimum upward momentum required"
        />

        <SliderRow
          label="Min Buy/Sell Ratio"
          value={config.minBuySellRatio}
          min={1} max={3} step={0.1}
          format={(v) => `${v.toFixed(1)}x`}
          onChange={(v) => set("minBuySellRatio", v)}
          info="More buys than sells ratio required"
        />
      </div>

      {/* Position Sizing */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Position Sizing</p>

        <SliderRow
          label="Trade Amount per Entry"
          value={config.tradeAmountSol}
          min={0.001} max={0.5} step={0.001}
          format={(v) => `${v.toFixed(3)} SOL`}
          onChange={(v) => set("tradeAmountSol", v)}
          info="How much SOL to spend per trade"
        />

        <SliderRow
          label="Max Open Positions"
          value={config.maxOpenPositions}
          min={1} max={10} step={1}
          format={(v) => `${v}`}
          onChange={(v) => set("maxOpenPositions", v)}
          info="Limit concurrent open trades"
        />
      </div>

      {/* Config Summary */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-[10px] font-mono text-primary uppercase tracking-wider mb-2">Config Summary</p>
        <div className="font-mono text-[10px] text-muted-foreground space-y-0.5 leading-relaxed">
          <p><span className="text-foreground">entry:</span> {config.entryStrategy} | <span className="text-foreground">exit:</span> {config.exitStrategy}</p>
          <p><span className="text-foreground">mcap:</span> ${(config.minMarketCapUsd / 1000).toFixed(0)}K–${(config.maxMarketCapUsd / 1000000).toFixed(1)}M | <span className="text-foreground">vol:</span> ${(config.minVolume24h / 1000).toFixed(0)}K+</p>
          <p><span className="text-foreground">liq:</span> ${(config.minLiquidityUsd / 1000).toFixed(0)}K+ | <span className="text-foreground">age:</span> {'<'}{config.maxPairAgeHours}h | <span className="text-foreground">ratio:</span> {config.minBuySellRatio.toFixed(1)}x</p>
          <p><span className="text-foreground">size:</span> {config.tradeAmountSol} SOL | <span className="text-foreground">max_pos:</span> {config.maxOpenPositions}</p>
          {config.exitStrategy === "trailing" && <p><span className="text-foreground">trailing_stop:</span> {config.trailingStopPct}%</p>}
          {config.exitStrategy === "time_based" && <p><span className="text-foreground">max_hold:</span> {config.maxHoldMinutes}m</p>}
        </div>
      </div>
    </motion.div>
  );
};
