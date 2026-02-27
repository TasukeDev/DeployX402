import { motion } from "framer-motion";
import {
  Cpu, Globe, Code, Monitor, Database, Calendar,
  Mail, FolderOpen, Activity
} from "lucide-react";

const features = [
  { icon: Cpu, title: "Full Runtime", description: "Function calling, tool execution, risk modes, and multi-turn conversations in the browser.", tags: ["Function Calling", "Risk Modes"] },
  { icon: Globe, title: "Any AI Provider", description: "OpenAI, Anthropic, Google, Mistral, DeepSeek, or bring your own API key." },
  { icon: Code, title: "Code Execution", description: "Sandboxed shell execution for running code, scripts, and commands with output capture." },
  { icon: Monitor, title: "Browser Control", description: "Fetch pages, extract content, take screenshots, and generate PDFs from any webpage." },
  { icon: Database, title: "Persistent Memory", description: "Key-value memory store per agent. Save and recall context across conversations." },
  { icon: Globe, title: "23+ Channels", description: "Deploy to Telegram, WhatsApp, Discord, Slack, Signal, Teams, Matrix, and more." },
  { icon: Calendar, title: "Scheduled Tasks", description: "Cron-based scheduling with retry backoff and run logs for automation." },
  { icon: Mail, title: "Email Integration", description: "Transactional emails with full HTML support and templates." },
  { icon: FolderOpen, title: "File Operations", description: "Create, edit, and patch files in agent workspace with multi-file support.", tags: ["write_file", "apply_patch"] },
  { icon: Activity, title: "Real-Time Logs", description: "Live WebSocket streaming, per-agent analytics, and usage dashboards." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] orb-cyan opacity-30 rounded-full" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3 font-medium">Platform Capabilities</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Everything you need.
            <br />
            <span className="text-muted-foreground">Nothing you don't.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              className={`group rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 hover:border-primary/25 transition-all duration-300 ${
                i < 2 ? "xl:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <f.icon className="h-5 w-5 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold mb-1.5 text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              {f.tags && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {f.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/5 text-primary/80 border border-primary/10">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
