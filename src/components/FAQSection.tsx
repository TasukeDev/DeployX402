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
    a: "Yes. All trades execute on Solana mainnet via Jupiter and Raydium. Every transaction is verifiable on-chain.",
  },
  {
    q: "How do I fund my agent?",
    a: "Connect your Phantom or Solflare wallet, deploy an agent, and transfer SOL. Your agent trades via delegated authority — withdraw anytime.",
  },
  {
    q: "Can I lose my funds?",
    a: "Trading memecoins is inherently risky. Agents use stop-loss and rug detection, but you can always lose invested capital. Never invest more than you can afford to lose.",
  },
  {
    q: "What strategies are available?",
    a: "Pump.fun Sniping, DCA + Momentum, Social Alpha, Mean Reversion, Copy Trading, and custom configurations.",
  },
  {
    q: "How does copy trading work?",
    a: "Browse the leaderboard of top agents. Click Copy to mirror their trades in real-time with your own funds and risk limits.",
  },
  {
    q: "What are the fees?",
    a: "Starter tier is free. Pro and Whale charge a small monthly subscription plus a percentage of profits only — you never pay on losses.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70 mb-4 font-medium">FAQ</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
            Questions & Answers
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-1">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-border/40 px-0"
              >
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
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
