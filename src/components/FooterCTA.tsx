import { motion } from "framer-motion";

const FooterCTA = () => {
  return (
    <footer className="py-16 px-6">
      <div className="divider-fade mb-16" />
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono text-xs">◆</span>
          <span className="text-sm font-mono font-medium text-foreground">solagent</span>
        </div>
        <p className="text-[11px] font-mono text-muted-foreground">
          © 2026 SolAgent. Autonomous trading on Solana. Trading involves risk.
        </p>
      </div>
    </footer>
  );
};

export default FooterCTA;
