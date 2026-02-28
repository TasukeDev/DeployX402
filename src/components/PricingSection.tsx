import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletContext";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    sub: "0% platform fee",
    badge: "Popular",
    features: [
      "1 active agent",
      "Basic strategies (DCA, Momentum)",
      "Real-time PnL tracking",
      "Community support",
      "Up to 0.5 SOL per agent",
    ],
  },
  {
    name: "Pro",
    price: "0.1 SOL",
    sub: "/ month • 1% profit share",
    badge: null,
    features: [
      "5 active agents",
      "Advanced strategies (Sniper, Social Alpha)",
      "Copy trading access",
      "Priority execution via Jito",
      "Up to 10 SOL per agent",
      "Telegram alerts",
    ],
  },
  {
    name: "Whale",
    price: "0.5 SOL",
    sub: "/ month • 0.5% profit share",
    badge: null,
    features: [
      "Unlimited agents",
      "All strategies + custom config",
      "Priority support",
      "API access for custom bots",
      "No position limits",
      "Advanced analytics",
      "Early access to new features",
    ],
  },
];

const PricingSection = () => {
  const { connect } = useWallet();

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
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Simple, transparent pricing</h2>
          <p className="text-muted-foreground mt-4">Start free. Scale as you grow.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border bg-card/80 backdrop-blur-sm p-6 ${
                i === 0 ? "border-primary/30 border-gradient" : "border-border/60"
              }`}
            >
              {tier.badge && (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-widest text-primary font-semibold mb-4">
                  {tier.badge}
                </div>
              )}
              <h3 className="text-lg font-bold text-foreground mb-1">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-foreground">{tier.price}</span>
                {tier.sub && <span className="text-xs text-muted-foreground">{tier.sub}</span>}
              </div>

              <ul className="space-y-2.5 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-secondary-foreground">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={connect}
                className={`w-full font-semibold ${
                  i === 0
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
