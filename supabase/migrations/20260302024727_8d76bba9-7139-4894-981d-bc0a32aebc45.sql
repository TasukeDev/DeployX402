-- Create agent strategy configs table
CREATE TABLE public.agent_strategy_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Entry/exit strategy
  entry_strategy TEXT NOT NULL DEFAULT 'momentum',
  exit_strategy TEXT NOT NULL DEFAULT 'tp_sl',
  trailing_stop_pct NUMERIC NOT NULL DEFAULT 5,
  max_hold_minutes INTEGER NOT NULL DEFAULT 60,
  -- Token filters
  min_market_cap_usd NUMERIC NOT NULL DEFAULT 10000,
  max_market_cap_usd NUMERIC NOT NULL DEFAULT 10000000,
  min_volume_24h NUMERIC NOT NULL DEFAULT 50000,
  min_liquidity_usd NUMERIC NOT NULL DEFAULT 20000,
  max_pair_age_hours INTEGER NOT NULL DEFAULT 72,
  min_price_change_1h NUMERIC NOT NULL DEFAULT 2,
  max_price_change_1h NUMERIC NOT NULL DEFAULT 100,
  min_buy_sell_ratio NUMERIC NOT NULL DEFAULT 1.2,
  -- Position sizing
  trade_amount_sol NUMERIC NOT NULL DEFAULT 0.01,
  max_open_positions INTEGER NOT NULL DEFAULT 3
);

ALTER TABLE public.agent_strategy_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their strategy configs"
  ON public.agent_strategy_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their strategy configs"
  ON public.agent_strategy_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their strategy configs"
  ON public.agent_strategy_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their strategy configs"
  ON public.agent_strategy_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_agent_strategy_configs_updated_at
  BEFORE UPDATE ON public.agent_strategy_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
