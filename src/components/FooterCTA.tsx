import { motion } from "framer-motion";
import { Twitter } from "lucide-react";

const FooterCTA = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden"
    >
      {/* Top divider */}
      <div className="divider-fade" />

      {/* Large background text */}
      <div className="relative py-20 px-6">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[18vw] font-mono font-bold text-foreground/[0.025] leading-none tracking-tighter whitespace-nowrap">
            DEPLOYX402
          </span>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col sm:flex-row items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono text-base">◆</span>
              <span className="text-lg font-mono font-bold text-foreground tracking-tight">DeployX402</span>
            </div>
            <p className="text-xs font-mono text-muted-foreground max-w-xs">
              Autonomous AI trading agents on Solana.<br />Completely free.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <a
              href="https://x.com/DeployX402"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="h-3 w-3" />
              @DeployX402
            </a>
            <p className="text-[10px] font-mono text-muted-foreground/60">
              © 2026 DeployX402. Trading involves risk.
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default FooterCTA;
