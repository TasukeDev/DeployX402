import { motion } from "framer-motion";
import { Twitter } from "lucide-react";

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
          <span className="text-sm font-mono font-medium text-foreground">DeployX402</span>
        </motion.div>

        <div className="flex items-center gap-4">
          <a
            href="https://x.com/DeployX402"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <Twitter className="h-3 w-3" />
            @DeployX402
          </a>
          <p className="text-[11px] font-mono text-muted-foreground">
            © 2026 DeployX402. Trading involves risk.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default FooterCTA;
