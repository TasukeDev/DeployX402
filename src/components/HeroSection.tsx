import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TerminalBlock from "./TerminalBlock";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-6"
        >
          Deploy Anywhere.
          <br />
          <span className="text-gradient-accent">Launch Everywhere.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-4"
        >
          Build, deploy, and manage AI agents from your browser.
          <br />
          Full runtime. No setup. No local install.
        </motion.p>

        {/* Terminal command line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 font-mono text-sm text-muted-foreground mb-8"
        >
          <span className="text-primary">$</span>
          <span>launch --deploy</span>
          <span className="text-primary">everywhere</span>
          <span className="animate-blink text-primary">_</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 text-base">
            Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary px-8 text-base">
            Explore Features <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.8 }}
        >
          <TerminalBlock />
        </motion.div>

        {/* Provider logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Works with every major AI provider
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {["OpenAI", "Anthropic", "Google", "Mistral", "DeepSeek", "Ollama"].map((name) => (
              <span key={name} className="hover:text-foreground transition-colors cursor-default">{name}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
