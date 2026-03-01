-- Enable realtime for trade_history and pnl_snapshots tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pnl_snapshots;