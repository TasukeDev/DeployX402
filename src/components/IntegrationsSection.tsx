import { motion } from "framer-motion";
import { Shield, Zap, Key } from "lucide-react";

const channels = [
  "Telegram", "WhatsApp", "Discord", "Slack", "Signal",
  "Google Chat", "Matrix", "Teams", "IRC", "Email", "LINE", "WebChat",
];

const IntegrationsSection = () => {
  return (
    <section id="integrations" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Integrations</p>
          <h2 className="text-4xl md:text-5xl font-bold">
            Deploy everywhere
            <br />
            <span className="text-muted-foreground">your users are.</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md mx-auto">
            One agent. Every platform. Connect once and reach users wherever they communicate.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-6"
        >
          {channels.map((ch) => (
            <div
              key={ch}
              className="px-5 py-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:border-primary/40 hover:glow-soft transition-all duration-300 cursor-default"
            >
              {ch}
            </div>
          ))}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mb-20">
          + Mattermost, Nostr, iMessage, and more
        </p>

        {/* Trust badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Shield, title: "AES-256 Encrypted", desc: "API keys and credentials encrypted at rest with military-grade encryption." },
            { icon: Zap, title: "Production-Grade", desc: "Built on a real agent runtime with full tool support and risk modes." },
            { icon: Key, title: "BYOK Everywhere", desc: "Bring keys from OpenAI, Anthropic, Google, Mistral, and 10+ providers." },
          ].map((b) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <b.icon className="h-6 w-6 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
