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
    <footer className="py-24 border-t border-border/40 relative overflow-hidden">
      <div className="absolute inset-0 orb-cyan opacity-20" />
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <img src="/logo.png" alt="Logo" className="h-12 w-12 rounded-2xl mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Ready to let AI
            <br />
            <span className="text-gradient-hero">trade for you?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Connect your wallet, fund an agent, and start trading memecoins on autopilot.
          </p>
          <Button size="lg" onClick={handleCTA} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 font-semibold">
            {connected ? "Go to Dashboard" : "Connect Wallet"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        <div className="mt-16 pt-8 border-t border-border/30 text-xs text-muted-foreground">
          © 2026 SolAgent. All rights reserved. Trading involves risk.
        </div>
      </div>
    </footer>
  );
};

export default FooterCTA;
