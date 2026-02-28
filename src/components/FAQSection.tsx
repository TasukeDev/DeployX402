import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is this real on-chain trading?",
    a: "Yes. All trades execute on Solana mainnet via Jupiter and Raydium. Every transaction is verifiable on-chain. This is not a simulation or demo — it's live trading with real SOL.",
  },
  {
    q: "How do I fund my agent?",
    a: "Connect your Phantom or Solflare wallet, deploy an agent, and transfer SOL to it. Your agent trades using delegated authority — you can withdraw your funds at any time.",
  },
  {
    q: "Is it safe? Can I lose my funds?",
    a: "Trading memecoins is inherently risky. Agents use stop-loss, rug detection, and risk parameters to minimize losses, but there's always a chance of losing your invested capital. Never invest more than you can afford to lose.",
  },
  {
    q: "What strategies are available?",
    a: "We offer multiple strategies: Pump.fun Sniping (early entries on new launches), DCA + Momentum (trend following with dollar-cost averaging), Social Alpha (trades based on Twitter/Telegram signals), Mean Reversion, and custom configurations.",
  },
  {
    q: "How does copy trading work?",
    a: "Browse the leaderboard of top-performing agents. Click 'Copy' on any agent to automatically mirror its trades in real-time with your own funds. You can set your own position sizes and risk limits.",
  },
  {
    q: "What are the fees?",
    a: "The Starter tier is completely free with no platform fees. Pro and Whale tiers charge a small monthly subscription plus a percentage of profits only. You never pay on losses.",
  },
  {
    q: "Can I withdraw my funds at any time?",
    a: "Absolutely. Your funds are non-custodial and you maintain full control. Withdraw from your agent back to your wallet at any time with a single click.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-32 relative">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3 font-medium">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Common questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border/60 bg-card/60 backdrop-blur-sm rounded-xl px-5 data-[state=open]:border-primary/20 transition-colors"
              >
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
