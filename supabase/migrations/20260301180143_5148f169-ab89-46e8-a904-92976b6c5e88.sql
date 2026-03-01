
CREATE TABLE public.agent_wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL UNIQUE REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  public_key text NOT NULL,
  encrypted_private_key text NOT NULL,
  balance_sol numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallets"
  ON public.agent_wallets FOR SELECT
  USING (auth.uid() = user_id);
