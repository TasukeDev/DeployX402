import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";

const FooterCTA = () => {
  const { login } = useAuth();
  return (
    <footer className="py-24 border-t border-border/40 relative overflow-hidden">
      <div className="absolute inset-0 orb-cyan opacity-20" />
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Ready to launch your
            <br />
            <span className="text-gradient-hero">first agent?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Build, deploy, and manage agents from your browser. No infrastructure needed.
          </p>
          <Button size="lg" onClick={login} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 font-semibold">
            Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        <div className="mt-16 pt-8 border-t border-border/30 text-xs text-muted-foreground">
          © 2026 LaunchPad. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default FooterCTA;
