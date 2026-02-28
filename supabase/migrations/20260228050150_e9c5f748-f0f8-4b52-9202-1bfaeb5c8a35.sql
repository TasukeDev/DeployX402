
-- Add is_public flag to agents
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Create trade_history table
CREATE TABLE public.trade_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  token_symbol text NOT NULL,
  token_address text,
  action text NOT NULL, -- 'buy' or 'sell'
  amount_sol numeric NOT NULL DEFAULT 0,
  token_amount numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  pnl_sol numeric DEFAULT 0,
  signal text, -- e.g. 'momentum', 'social alpha', 'snipe'
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_history ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD their trade history
CREATE POLICY "Users can view their trade history" ON public.trade_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert trade history" ON public.trade_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public can view trades for public agents
CREATE POLICY "Public can view trades of public agents" ON public.trade_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.agents WHERE agents.id = trade_history.agent_id AND agents.is_public = true)
  );

-- Create pnl_snapshots for time-series charts
CREATE TABLE public.pnl_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pnl_sol numeric NOT NULL DEFAULT 0,
  total_trades integer NOT NULL DEFAULT 0,
  win_rate numeric DEFAULT 0,
  snapshot_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pnl_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their pnl snapshots" ON public.pnl_snapshots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert pnl snapshots" ON public.pnl_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view pnl of public agents" ON public.pnl_snapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.agents WHERE agents.id = pnl_snapshots.agent_id AND agents.is_public = true)
  );

-- Allow anyone to browse public agents
CREATE POLICY "Anyone can view public agents" ON public.agents
  FOR SELECT USING (is_public = true);

-- Enable realtime for trade_history (for live feed)
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_history;
