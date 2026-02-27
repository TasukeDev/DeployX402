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
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold">Free during Open Beta</h2>
          <p className="text-muted-foreground mt-4">
            All features are completely free while we're in open beta.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto rounded-2xl border border-border bg-card p-8 glow-soft"
        >
          <div className="mb-1">
            <span className="text-xs uppercase tracking-widest text-primary font-medium">Open Beta</span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">Free for Everyone</h3>
          <p className="text-sm text-muted-foreground mb-6">Full access to all features, no limits</p>

          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-5xl font-bold text-foreground">$0</span>
            <span className="text-muted-foreground text-sm">forever during beta</span>
          </div>

          <ul className="space-y-3 mb-8">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm text-secondary-foreground">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                {perk}
              </li>
            ))}
          </ul>

          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
            Get Started Free
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Premium plans (Pro & Enterprise) will be available after full launch.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
