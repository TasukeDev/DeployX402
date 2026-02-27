import { motion } from "framer-motion";
import { Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FooterCTA = () => {
  return (
    <footer className="py-24 border-t border-border">
      <div className="container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Rocket className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to launch your
            <br />
            <span className="text-gradient-accent">first agent?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Build, deploy, and manage your agents from the browser. No infrastructure needed.
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8">
            Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        <div className="mt-16 pt-8 border-t border-border text-xs text-muted-foreground">
          © 2026 LaunchPad. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default FooterCTA;
