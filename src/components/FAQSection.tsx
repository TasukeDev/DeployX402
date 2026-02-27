import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is LaunchPad?",
    a: "LaunchPad is a browser-based IDE for building, deploying, and managing AI agents. It provides a full runtime environment with no local setup required — just open your browser and start building.",
  },
  {
    q: "Which AI providers are supported?",
    a: "We support all major providers including OpenAI, Anthropic, Google, Mistral, DeepSeek, OpenRouter, and Ollama. You can also bring your own API key (BYOK) for any compatible provider.",
  },
  {
    q: "How many channels can I deploy to?",
    a: "You can deploy to 23+ channels including Telegram, WhatsApp, Discord, Slack, Signal, Teams, Matrix, IRC, LINE, Google Chat, Email, WebChat, and more. One agent config works across all platforms.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All API keys and credentials are encrypted at rest using AES-256 encryption. We follow industry best practices for security and never store your data longer than necessary.",
  },
  {
    q: "What tools are available for agents?",
    a: "Agents have access to 13+ built-in tools: search, browser control, email, persistent memory, file operations, code execution, scheduled tasks, and more. All tools work with function calling and risk modes.",
  },
  {
    q: "Is LaunchPad really free?",
    a: "Yes! During the open beta, all features are completely free with no limits — unlimited requests, agents, channels, and tools. Premium plans (Pro & Enterprise) will be introduced after full launch.",
  },
  {
    q: "Can I use LaunchPad for production workloads?",
    a: "Absolutely. LaunchPad runs on a production-grade runtime with full tool support, risk modes, retry backoff, and real-time monitoring. It's built for serious agent deployments.",
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
