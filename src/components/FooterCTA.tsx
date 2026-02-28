import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletContext";
import { useNavigate } from "react-router-dom";

const FooterCTA = () => {
  const { connect, connected } = useWallet();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (connected) {
      navigate("/dashboard");
    } else {
      connect();
    }
  };

  return (
    <footer className="py-24 relative overflow-hidden">
      <div className="divider-fade mb-24" />
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-5">
            Start Trading Today
          </h2>
          <p className="text-muted-foreground mb-10 max-w-md mx-auto text-sm">
            Connect your wallet, fund an agent, and put your portfolio on autopilot.
          </p>
          <Button size="lg" onClick={handleCTA} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 h-12 font-semibold text-sm">
            {connected ? "Go to Dashboard" : "Connect Wallet"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        <div className="mt-20 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SolAgent" className="h-5 w-5 rounded" />
            <span>SolAgent</span>
          </div>
          <p>© 2026 SolAgent. All rights reserved. Trading involves risk.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterCTA;
