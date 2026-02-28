import { motion } from "framer-motion";
import { Terminal, Webhook, Code2, Braces, Layers, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const devTools = [
  { icon: Braces, title: "REST API", desc: "Full CRUD API for agents, messages, analytics, and deployments." },
  { icon: Terminal, title: "CLI Tool", desc: "Create, deploy, and manage agents from your terminal." },
  { icon: Webhook, title: "Webhooks", desc: "Real-time event hooks for messages, errors, and status changes." },
  { icon: Code2, title: "SDKs", desc: "Official libraries for Python, TypeScript, Go, and Rust." },
];

const codeExamples = [
  {
    lang: "cURL",
    code: `curl -X POST https://api.launchpad.dev/v1/agents \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "support-bot",
    "model": "gpt-4o",
    "channels": ["telegram", "discord"],
    "tools": ["search", "memory"]
  }'`,
  },
  {
    lang: "Python",
    code: `from launchpad import Client

lp = Client(api_key="lp_sk_...")

agent = lp.agents.create(
    name="support-bot",
    model="gpt-4o",
    channels=["telegram", "discord"],
    tools=["search", "memory"],
)

print(f"Agent live → {agent.url}")`,
  },
  {
    lang: "TypeScript",
    code: `import { LaunchPad } from "@launchpad/sdk";

const lp = new LaunchPad({ apiKey: "lp_sk_..." });

const agent = await lp.agents.create({
  name: "support-bot",
  model: "gpt-4o",
  channels: ["telegram", "discord"],
  tools: ["search", "memory"],
});

console.log("Agent live →", agent.url);`,
  },
];

const DeveloperSection = () => {
  const navigate = useNavigate();

  return (
    <section id="developers" className="py-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[700px] h-[700px] orb-purple opacity-20 rounded-full" />
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3 font-medium">Developer Experience</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Built for developers.
            <br />
            <span className="text-muted-foreground">Ship with confidence.</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-sm">
            REST API, CLI, webhooks, and SDKs in every major language. Deploy agents with a single command.
          </p>
        </motion.div>

        {/* Dev tools grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
          {devTools.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 hover:border-primary/25 transition-all group"
            >
              <t.icon className="h-5 w-5 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold text-foreground mb-1">{t.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Architecture diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 md:p-12 overflow-hidden">
            <h3 className="text-center text-xs uppercase tracking-[0.2em] text-primary mb-8 font-medium">Architecture</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 font-mono text-xs">
              <ArchBlock label="Your App" sub="REST / SDK" accent />
              <ArrowFlow />
              <ArchBlock label="LaunchPad API" sub="Auth · Rate Limit · Route" />
              <ArrowFlow />
              <ArchBlock label="Agent Runtime" sub="Tools · Memory · LLM" />
              <ArrowFlow />
              <div className="flex flex-col gap-2">
                <ArchBlock label="Channels" sub="Telegram · Discord · …" small />
                <ArchBlock label="Webhooks" sub="Events · Callbacks" small />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Code examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-center text-xs uppercase tracking-[0.2em] text-primary mb-6 font-medium">Quick Start</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {codeExamples.map((ex) => (
              <div key={ex.lang} className="terminal-window rounded-xl overflow-hidden glow-card border-gradient">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
                    <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono ml-2">{ex.lang}</span>
                </div>
                <pre className="p-4 text-[11px] leading-relaxed font-mono text-terminal-value overflow-x-auto">
                  <code>{ex.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Docs CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            variant="outline"
            onClick={() => navigate("/docs")}
            className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
          >
            Read the Docs <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

const ArchBlock = ({ label, sub, accent, small }: { label: string; sub: string; accent?: boolean; small?: boolean }) => (
  <div className={`rounded-lg border px-4 py-3 text-center transition-all ${
    accent
      ? "border-primary/40 bg-primary/5 text-primary"
      : "border-border/60 bg-card/80 text-foreground"
  } ${small ? "px-3 py-2" : ""}`}>
    <div className={`font-semibold ${small ? "text-[10px]" : "text-xs"}`}>{label}</div>
    <div className={`text-muted-foreground mt-0.5 ${small ? "text-[9px]" : "text-[10px]"}`}>{sub}</div>
  </div>
);

const ArrowFlow = () => (
  <div className="text-primary/40 hidden md:block">
    <svg width="24" height="12" viewBox="0 0 24 12">
      <path d="M0 6h20M16 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  </div>
);

export default DeveloperSection;
