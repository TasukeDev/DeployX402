import { motion } from "framer-motion";
import { Shield, Zap, Key } from "lucide-react";

const channels = [
  "Telegram", "WhatsApp", "Discord", "Slack", "Signal",
  "Google Chat", "Matrix", "Teams", "IRC", "Email", "LINE", "WebChat",
];

const IntegrationsSection = () => {
  return (
    <section id="integrations" className="py-32 relative overflow-hidden">
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] orb-purple animate-float-slow rounded-full" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3 font-medium">Integrations</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Deploy everywhere
            <br />
            <span className="text-gradient-hero">your users are.</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md mx-auto">
            One agent. Every platform. Connect once and reach users wherever they communicate.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto mb-4"
        >
          {channels.map((ch, i) => (
            <motion.div
              key={ch}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="px-5 py-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-default"
            >
              {ch}
            </motion.div>
          ))}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mb-20">
          + Mattermost, Nostr, iMessage, and more
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { icon: Shield, title: "AES-256 Encrypted", desc: "API keys encrypted at rest with military-grade encryption." },
            { icon: Zap, title: "Production-Grade", desc: "Real agent runtime with full tool support and risk modes." },
            { icon: Key, title: "BYOK Everywhere", desc: "Bring keys from OpenAI, Anthropic, Google, and 10+ providers." },
          ].map((b) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/15 mb-3">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-sm mb-1">{b.title}</h3>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
