import { motion } from "framer-motion";
import {
  Cpu, Globe, Code, Monitor, Database, Calendar,
  Mail, FolderOpen, Activity, Shield
} from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Full Runtime",
    description: "Complete agent runtime in the browser. Function calling, tool execution, risk modes, and multi-turn conversations.",
    tags: ["Function Calling", "Risk Modes", "Multi-turn"],
  },
  {
    icon: Globe,
    title: "Any AI Provider",
    description: "Use OpenAI, Anthropic, Google, Mistral, DeepSeek, or bring your own API key.",
  },
  {
    icon: Code,
    title: "Code Execution",
    description: "Sandboxed shell execution for running code, scripts, and commands with full output capture.",
  },
  {
    icon: Monitor,
    title: "Browser Control",
    description: "Fetch pages, extract content, take screenshots, and generate PDFs from any webpage.",
  },
  {
    icon: Database,
    title: "Persistent Memory",
    description: "Key-value memory store per agent. Save and recall context across conversations.",
  },
  {
    icon: Globe,
    title: "23+ Channels",
    description: "Deploy to Telegram, WhatsApp, Discord, Slack, Signal, Teams, Matrix, IRC, and more.",
  },
  {
    icon: Calendar,
    title: "Scheduled Tasks",
    description: "Cron-based scheduling with retry backoff and run logs. Automate recurring tasks.",
  },
  {
    icon: Mail,
    title: "Email Integration",
    description: "Send transactional and notification emails with full HTML support and templates.",
  },
  {
    icon: FolderOpen,
    title: "File Operations",
    description: "Create, edit, and patch files in agent workspace. Apply multi-file patches and manage storage.",
    tags: ["write_file", "read_file", "apply_patch"],
  },
  {
    icon: Activity,
    title: "Real-Time Logs",
    description: "Live WebSocket log streaming, per-agent analytics, and usage dashboards.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Platform Capabilities</p>
          <h2 className="text-4xl md:text-5xl font-bold">
            Everything you need.
            <br />
            <span className="text-muted-foreground">Nothing you don't.</span>
          </h2>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:glow-soft transition-all duration-300"
            >
              <f.icon className="h-5 w-5 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              {f.tags && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {f.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-mono px-2 py-1 rounded bg-secondary text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
