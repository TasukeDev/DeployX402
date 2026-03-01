
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS take_profit_pct numeric NOT NULL DEFAULT 0.05,
  ADD COLUMN IF NOT EXISTS stop_loss_pct numeric NOT NULL DEFAULT 0.03;
