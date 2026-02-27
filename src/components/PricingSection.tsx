import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const perks = [
  "Unlimited requests",
  "Unlimited agents",
  "Unlimited channels",
  "All 13+ tools included",
  "API access",
  "BYOK support for all providers",
  "All channel integrations",
  "Community support",
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3 font-medium">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Free during Open Beta</h2>
          <p className="text-muted-foreground mt-4">All features, completely free.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-8 border-gradient"
        >
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-widest text-primary font-semibold mb-4">
            Open Beta
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1">Free for Everyone</h3>
          <p className="text-sm text-muted-foreground mb-6">Full access, no limits</p>

          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-5xl font-extrabold text-foreground">$0</span>
            <span className="text-muted-foreground text-sm">forever during beta</span>
          </div>

          <ul className="space-y-3 mb-8">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm text-secondary-foreground">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                {perk}
              </li>
            ))}
          </ul>

          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold">
            Get Started Free
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Premium plans available after full launch. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
