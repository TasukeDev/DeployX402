import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletContext";

const features = [
  "Unlimited active agents",
  "All strategies including Sniping",
  "Copy trading access",
  "Priority execution via Jito",
  "No position limits",
  "Real-time PnL tracking",
  "Telegram alerts",
  "API access",
];

const PricingSection = () => {
  const { connect } = useWallet();

  return (
    <section id="pricing" className="py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70 mb-4 font-medium">Pricing</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
            Completely Free
          </h2>
          <p className="text-muted-foreground mt-4 text-sm max-w-md mx-auto">
            No subscriptions. No profit sharing. No hidden fees. We believe everyone should have access to AI-powered trading.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto rounded-2xl border border-primary/20 bg-card p-10 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-widest text-primary font-semibold mb-6">
            <Sparkles className="h-3 w-3" />
            Forever Free
          </div>

          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-6xl stat-number text-foreground">$0</span>
          </div>
          <p className="text-sm text-muted-foreground mb-8">No credit card required</p>

          <ul className="space-y-3 mb-10 text-left max-w-xs mx-auto">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-secondary-foreground">
                <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            onClick={connect}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold text-sm h-11"
          >
            Start Trading Now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
