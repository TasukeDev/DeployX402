import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, Book, Rocket, Code2, Terminal, Webhook,
  Braces, Shield, Layers, Cpu, ChevronRight, Copy, Check, Globe, Key
} from "lucide-react";
import { Button } from "@/components/ui/button";

type DocSection = {
  id: string;
  icon: typeof Book;
  title: string;
  content: DocContent[];
};

type DocContent = {
  type: "text" | "code" | "heading" | "list";
  lang?: string;
  value: string;
  items?: string[];
};

const sections: DocSection[] = [
  {
    id: "getting-started",
    icon: Rocket,
    title: "Getting Started",
    content: [
      { type: "text", value: "Get up and running with LaunchPad in under 5 minutes. Create your first AI agent, configure channels, and deploy — all from a single API call or the dashboard." },
      { type: "heading", value: "Install the SDK" },
      { type: "code", lang: "bash", value: "npm install @launchpad/sdk\n# or\npip install launchpad-sdk" },
      { type: "heading", value: "Initialize the Client" },
      { type: "code", lang: "typescript", value: 'import { LaunchPad } from "@launchpad/sdk";\n\nconst lp = new LaunchPad({\n  apiKey: process.env.LAUNCHPAD_API_KEY,\n});' },
      { type: "heading", value: "Create Your First Agent" },
      { type: "code", lang: "typescript", value: 'const agent = await lp.agents.create({\n  name: "my-first-agent",\n  model: "gpt-4o",\n  system_prompt: "You are a helpful assistant.",\n  channels: ["webchat"],\n});\n\nconsole.log("Live at:", agent.url);' },
    ],
  },
  {
    id: "authentication",
    icon: Key,
    title: "Authentication",
    content: [
      { type: "text", value: "All API requests require a valid API key passed via the Authorization header. Keys are scoped to your workspace and can be rotated at any time." },
      { type: "heading", value: "API Key Format" },
      { type: "code", lang: "bash", value: 'Authorization: Bearer lp_sk_live_...' },
      { type: "heading", value: "Key Types" },
      { type: "list", value: "", items: [
        "lp_sk_live_* — Production keys with full access",
        "lp_sk_test_* — Sandbox keys for development",
        "lp_pk_* — Publishable keys for client-side usage",
      ]},
      { type: "heading", value: "Rate Limits" },
      { type: "text", value: "Free tier: 100 req/min. Pro: 1,000 req/min. Enterprise: custom. Rate limit headers are included in every response." },
    ],
  },
  {
    id: "agents-api",
    icon: Cpu,
    title: "Agents API",
    content: [
      { type: "text", value: "The Agents API is the core of LaunchPad. Create, configure, and manage AI agents programmatically." },
      { type: "heading", value: "Create Agent" },
      { type: "code", lang: "bash", value: 'POST /v1/agents\n\n{\n  "name": "support-bot",\n  "model": "gpt-4o",\n  "system_prompt": "You help users with billing.",\n  "channels": ["telegram", "discord"],\n  "tools": ["search", "memory", "email"],\n  "risk_mode": "safe"\n}' },
      { type: "heading", value: "List Agents" },
      { type: "code", lang: "bash", value: "GET /v1/agents?status=active&limit=20" },
      { type: "heading", value: "Update Agent" },
      { type: "code", lang: "bash", value: 'PATCH /v1/agents/:id\n\n{\n  "model": "claude-3.5-sonnet",\n  "tools": ["search", "memory", "browser"]\n}' },
      { type: "heading", value: "Delete Agent" },
      { type: "code", lang: "bash", value: "DELETE /v1/agents/:id" },
    ],
  },
  {
    id: "channels",
    icon: Globe,
    title: "Channels",
    content: [
      { type: "text", value: "Connect your agent to 23+ messaging platforms. Each channel requires minimal configuration — usually just a bot token or webhook URL." },
      { type: "heading", value: "Supported Channels" },
      { type: "list", value: "", items: [
        "Telegram — Bot API token",
        "Discord — Bot token + guild ID",
        "WhatsApp — Business API credentials",
        "Slack — App manifest + OAuth",
        "Signal, Matrix, Teams, IRC, LINE, Google Chat",
        "WebChat — Embeddable widget, zero config",
      ]},
      { type: "heading", value: "Connect a Channel" },
      { type: "code", lang: "typescript", value: 'await lp.channels.connect(agent.id, {\n  type: "telegram",\n  config: {\n    bot_token: process.env.TELEGRAM_BOT_TOKEN,\n  },\n});' },
    ],
  },
  {
    id: "tools",
    icon: Braces,
    title: "Tools & Functions",
    content: [
      { type: "text", value: "Tools give your agent superpowers. Built-in tools handle common tasks; custom tools let you connect any API." },
      { type: "heading", value: "Built-in Tools" },
      { type: "list", value: "", items: [
        "search — Web search via multiple providers",
        "browser — Fetch pages, extract content, screenshots",
        "memory — Persistent key-value store per agent",
        "email — Send transactional emails with templates",
        "code_exec — Sandboxed shell execution",
        "file_ops — Read, write, patch files in workspace",
      ]},
      { type: "heading", value: "Custom Tools" },
      { type: "code", lang: "typescript", value: 'await lp.tools.register(agent.id, {\n  name: "get_weather",\n  description: "Get current weather for a city",\n  parameters: {\n    type: "object",\n    properties: {\n      city: { type: "string" },\n    },\n  },\n  handler: "https://api.example.com/weather",\n});' },
    ],
  },
  {
    id: "webhooks",
    icon: Webhook,
    title: "Webhooks",
    content: [
      { type: "text", value: "Receive real-time notifications for events in your agents. Webhooks are signed with HMAC-SHA256 for security." },
      { type: "heading", value: "Available Events" },
      { type: "list", value: "", items: [
        "agent.message — New message sent or received",
        "agent.error — Runtime error in agent",
        "agent.status — Agent status change (active, paused, etc.)",
        "agent.deploy — Deployment completed",
        "channel.connected — Channel successfully linked",
      ]},
      { type: "heading", value: "Register a Webhook" },
      { type: "code", lang: "typescript", value: 'await lp.webhooks.create({\n  url: "https://your-app.com/webhooks/launchpad",\n  events: ["agent.message", "agent.error"],\n  secret: "whsec_...",\n});' },
    ],
  },
  {
    id: "cli",
    icon: Terminal,
    title: "CLI Reference",
    content: [
      { type: "text", value: "The LaunchPad CLI lets you manage everything from your terminal. Install globally and authenticate once." },
      { type: "heading", value: "Installation" },
      { type: "code", lang: "bash", value: "npm install -g @launchpad/cli\nlaunchpad auth login" },
      { type: "heading", value: "Common Commands" },
      { type: "code", lang: "bash", value: '# Create a new agent\nlaunchpad agent create --name "my-bot" --model gpt-4o\n\n# Deploy to channels\nlaunchpad deploy --agent my-bot --channels telegram,discord\n\n# View live logs\nlaunchpad logs --agent my-bot --follow\n\n# List all agents\nlaunchpad agent list\n\n# Check agent status\nlaunchpad agent status my-bot' },
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Security",
    content: [
      { type: "text", value: "Security is built into every layer of LaunchPad. Your data and API keys are protected with industry-standard practices." },
      { type: "heading", value: "Key Principles" },
      { type: "list", value: "", items: [
        "AES-256 encryption at rest for all secrets and API keys",
        "TLS 1.3 for all data in transit",
        "SOC 2 Type II compliant infrastructure",
        "RBAC with workspace-level permissions",
        "Audit logs for all API key and agent operations",
        "Risk modes (safe, moderate, dangerous) for agent actions",
      ]},
      { type: "heading", value: "Risk Modes" },
      { type: "text", value: "Control what your agent can do. 'Safe' blocks destructive operations. 'Moderate' requires confirmation. 'Dangerous' allows all tool calls — use only in trusted environments." },
    ],
  },
];

const Docs = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.content.some(
          (c) =>
            c.value.toLowerCase().includes(q) ||
            c.items?.some((item) => item.toLowerCase().includes(q))
        )
    );
  }, [searchQuery]);

  const currentSection = sections.find((s) => s.id === activeSection) || sections[0];

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlock(id);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/50 bg-background/80 backdrop-blur-2xl flex items-center px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
        <div className="flex items-center gap-2 ml-4">
          <img src="/logo.png" alt="LaunchPad" className="h-6 w-6 rounded" />
          <span className="font-semibold text-sm tracking-tight">LaunchPad Docs</span>
        </div>
        <div className="ml-auto relative max-w-xs w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-3 text-xs rounded-lg border border-border/60 bg-card/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 fixed top-14 bottom-0 left-0 border-r border-border/40 bg-background/60 backdrop-blur-xl overflow-y-auto">
          <div className="p-4 space-y-0.5">
            {filteredSections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  activeSection === s.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                }`}
              >
                <s.icon className="h-3.5 w-3.5 shrink-0" />
                {s.title}
              </button>
            ))}
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl overflow-x-auto">
          <div className="flex gap-1 p-2 px-4">
            {filteredSections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs transition-all ${
                  activeSection === s.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-64 min-h-screen">
          <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 mt-10 md:mt-0">
            <motion.div
              key={currentSection.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <currentSection.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">{currentSection.title}</h1>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {currentSection.content.map((block, i) => {
                  if (block.type === "text") {
                    return (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {block.value}
                      </p>
                    );
                  }
                  if (block.type === "heading") {
                    return (
                      <h2 key={i} className="text-base font-bold text-foreground pt-4 flex items-center gap-2">
                        <ChevronRight className="h-3.5 w-3.5 text-primary" />
                        {block.value}
                      </h2>
                    );
                  }
                  if (block.type === "list") {
                    return (
                      <ul key={i} className="space-y-2 pl-4">
                        {block.items?.map((item, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1.5 shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  if (block.type === "code") {
                    const blockId = `${currentSection.id}-${i}`;
                    return (
                      <div key={i} className="terminal-window rounded-xl overflow-hidden border-gradient group relative">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
                              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono ml-1">{block.lang}</span>
                          </div>
                          <button
                            onClick={() => copyCode(block.value, blockId)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                          >
                            {copiedBlock === blockId ? (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <pre className="p-4 text-[12px] leading-relaxed font-mono text-terminal-value overflow-x-auto">
                          <code>{block.value}</code>
                        </pre>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Next section nav */}
              {(() => {
                const idx = sections.findIndex((s) => s.id === currentSection.id);
                const next = sections[idx + 1];
                if (!next) return null;
                return (
                  <div className="mt-16 pt-8 border-t border-border/40">
                    <button
                      onClick={() => setActiveSection(next.id)}
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                    >
                      <span>Next: {next.title}</span>
                      <ArrowLeft className="h-3.5 w-3.5 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Docs;
