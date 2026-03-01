
-- Fix overly permissive positions policy - restrict INSERT/UPDATE/DELETE to service role only
-- by removing the ALL policy and replacing with proper scoped policies

DROP POLICY IF EXISTS "Service role full access to positions" ON public.agent_positions;

-- Edge functions use service role key so they bypass RLS entirely
-- We only need a user-facing SELECT policy (already exists)
-- INSERT/UPDATE/DELETE are done exclusively from edge functions with service role key (bypasses RLS)
