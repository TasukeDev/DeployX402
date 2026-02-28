import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletContext";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    sub: "No platform fees",
    featured: false,
    features: [
      "1 active agent",
      "Basic strategies",
      "Real-time PnL tracking",
      "Up to 0.5 SOL per agent",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "0.1 SOL",
    sub: "per month · 1% profit share",
    featured: true,
    features: [
      "5 active agents",
      "Advanced strategies + Sniping",
      "Copy trading access",
      "Priority execution via Jito",
      "Up to 10 SOL per agent",
      "Telegram alerts",
    ],
  },
  {
    name: "Whale",
    price: "0.5 SOL",
    sub: "per month · 0.5% profit share",
    featured: false,
    features: [
      "Unlimited agents",
      "All strategies + custom config",
      "API access",
      "No position limits",
      "Priority support",
      "Advanced analytics",
      "Early access to new features",
    ],
  },
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
            Simple, Transparent
          </h2>
          <p className="text-muted-foreground mt-4 text-sm">Start free. Upgrade when you're ready.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden max-w-4xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`bg-card p-8 flex flex-col ${tier.featured ? 'bg-secondary/30' : ''}`}
            >
              {tier.featured && (
                <span className="inline-flex self-start items-center px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-widest text-primary font-semibold mb-4">
                  Popular
                </span>
              )}
              <h3 className="text-base font-bold text-foreground mb-1">{tier.name}</h3>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl stat-number text-foreground">{tier.price}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-6">{tier.sub}</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-secondary-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={connect}
                className={`w-full font-semibold text-xs h-10 ${
                  tier.featured
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
