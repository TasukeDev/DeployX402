
-- Add tx_signature to trade_history for on-chain verification links
ALTER TABLE public.trade_history ADD COLUMN IF NOT EXISTS tx_signature text;

-- Create agent_positions table to track open positions for TP/SL
CREATE TABLE IF NOT EXISTS public.agent_positions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  token_symbol text NOT NULL,
  token_address text NOT NULL,
  entry_price numeric NOT NULL DEFAULT 0,
  entry_amount_sol numeric NOT NULL DEFAULT 0,
  token_amount numeric NOT NULL DEFAULT 0,
  buy_tx_signature text,
  status text NOT NULL DEFAULT 'open', -- open | closed
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  exit_price numeric,
  pnl_sol numeric
);

ALTER TABLE public.agent_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to positions"
  ON public.agent_positions FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view their own positions"
  ON public.agent_positions FOR SELECT
  USING (auth.uid() = user_id);
