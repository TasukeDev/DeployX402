import { motion } from "framer-motion";

const FooterCTA = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-16 px-6"
    >
      <div className="divider-fade mb-16" />
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 cursor-default"
        >
          <span className="text-primary font-mono text-xs">◆</span>
          <span className="text-sm font-mono font-medium text-foreground">solagent</span>
        </motion.div>
        <p className="text-[11px] font-mono text-muted-foreground">
          © 2026 SolAgent. Autonomous trading on Solana. Trading involves risk.
        </p>
      </div>
    </motion.footer>
  );
};

export default FooterCTA;
