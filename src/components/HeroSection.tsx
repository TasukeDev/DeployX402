import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import TerminalBlock from "./TerminalBlock";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/hooks/use-toast";

const HeroSection = () => {
  const { login, authenticated } = useAuth();
  const { toast } = useToast();

  const handleCTA = () => {
    if (authenticated) {
      toast({ title: "You're already signed in!", description: "You're all set to start building." });
    } else {
      login();
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
      <div className="absolute top-20 -left-40 w-[500px] h-[500px] orb-cyan animate-float rounded-full" />
      <div className="absolute bottom-20 -right-40 w-[600px] h-[600px] orb-purple animate-float-slow rounded-full" />
      <div className="absolute inset-0 noise-overlay" />

      <div className="relative z-10 container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-medium mb-8"
            >
              <Sparkles className="h-3 w-3" />
              Now in Open Beta — Free for everyone
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
            >
              Deploy Anywhere.
              <br />
              <span className="text-gradient-hero">Launch Everywhere.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-4"
            >
              A browser-based IDE for AI agents. Full runtime, no setup, no local install. Build once, deploy to 23+ channels.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="font-mono text-sm text-muted-foreground mb-8 flex items-center gap-2 justify-center lg:justify-start"
            >
              <span className="text-primary">$</span>
              <span>launch deploy --everywhere</span>
              <span className="animate-blink text-primary">▋</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <Button size="lg" onClick={handleCTA} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 font-semibold">
                Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-border hover:bg-secondary px-8" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Features
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-12"
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Works with every major provider</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground justify-center lg:justify-start">
                {["OpenAI", "Anthropic", "Google", "Mistral", "DeepSeek", "Ollama"].map((n) => (
                  <span key={n} className="hover:text-foreground transition-colors">{n}</span>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full"
          >
            <TerminalBlock />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
