import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, Rocket, Code2, Terminal, Webhook,
  Braces, Shield, Layers, Cpu, ChevronRight, Copy, Check,
  Globe, Key, Bot, Wallet, BarChart3, Zap, Link2, Database, CreditCard, Network
} from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";

/* ── Types ── */
type DocContent =
  | { type: "text"; value: string }
  | { type: "heading"; value: string }
  | { type: "code"; lang: string; value: string }
  | { type: "list"; items: string[] }
  | { type: "cards"; cards: { icon: typeof Bot; title: string; desc: string }[] }
  | { type: "steps"; steps: { title: string; desc: string }[] };

type DocSection = {
  id: string;
  icon: typeof Bot;
  title: string;
  content: DocContent[];
};

type SidebarGroup = {
  label: string;
  items: DocSection[];
};

/* ── Documentation content ── */
const groups: SidebarGroup[] = [
  {
    label: "Getting Started",
    items: [
      {
        id: "overview",
        icon: Layers,
        title: "Overview",
        content: [
          {
            type: "text",
            value: "solagent is an autonomous AI trading agent platform on Solana. Create AI agents with unique personalities, equip them with autonomous trading capabilities, and deploy them on-chain with their own custodial wallets.",
          },
          {
            type: "cards",
            cards: [
              { icon: Bot, title: "Autonomous AI Agents", desc: "Create agents with unique personalities, trading styles, and behaviors. Agents operate autonomously using real-time market data." },
              { icon: Wallet, title: "Custodial Solana Wallets", desc: "Each agent gets its own Solana wallet with encrypted key storage. Agents sign transactions autonomously." },
              { icon: Shield, title: "Trust & Verification", desc: "Agents verify data sources, validate endpoints, and ensure reliable execution before committing capital." },
              { icon: Globe, title: "On-Chain Deployment", desc: "Launch your agent as a token on PumpFun. Agent identity and trading history become verifiable on-chain." },
            ],
          },
          { type: "heading", value: "Key Capabilities" },
          {
            type: "list",
            items: [
              "Develop unique personalities — Define trading styles, voice patterns, and behavioral traits",
              "Execute trades autonomously — Agents analyze market data from Pump.fun and DexScreener, then execute buy/sell orders",
              "Learn from interactions — Agents remember conversations and evolve their trading strategies",
              "Deploy on-chain — Launch as tokens with IPFS metadata and PumpFun integration",
              "Verified execution — Agents verify data from multiple sources before committing funds",
            ],
          },
        ],
      },
      {
        id: "quickstart",
        icon: Rocket,
        title: "Quickstart",
        content: [
          { type: "text", value: "Get your first AI trading agent running in under 3 minutes." },
          {
            type: "steps",
            steps: [
              { title: "Create an Account", desc: "Sign up with email or connect your Phantom/Jupiter wallet. A custodial Solana wallet is automatically generated for your agent." },
              { title: "Create Your Agent", desc: "Choose a trading preset — Scalper, Swing Trader, Long-term, or Degen — and customize your agent's personality." },
              { title: "Chat & Train", desc: "Start chatting with your agent. It learns your speech patterns and trading preferences through natural conversation." },
              { title: "Fund & Trade", desc: "Send SOL to your agent's wallet and enable autonomous trading. Set budget limits and risk parameters." },
              { title: "Launch On-Chain", desc: "Deploy your agent as a token on PumpFun. Your agent becomes a tradeable on-chain identity." },
            ],
          },
        ],
      },
      {
        id: "what-you-can-build",
        icon: Braces,
        title: "What You Can Build",
        content: [
          { type: "text", value: "solagent agents can be configured for various trading strategies, each with distinct risk profiles and execution patterns." },
          {
            type: "cards",
            cards: [
              { icon: Zap, title: "Scalping Bot", desc: "Executes rapid trades on small price movements. Monitors real-time data, identifies momentum plays, enters/exits within minutes." },
              { icon: BarChart3, title: "Swing Trader", desc: "Holds positions for days to weeks. Analyzes DexScreener data for volume trends, market cap changes, and liquidity depth." },
              { icon: Rocket, title: "Token Sniper", desc: "Monitors new token launches on Pump.fun and executes instant trades on promising opportunities." },
              { icon: Shield, title: "Diamond Hands HODLER", desc: "Long-term conviction holder focused on fundamentals. Accumulates positions in projects with real utility." },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Architecture",
    items: [
      {
        id: "agent-architecture",
        icon: Cpu,
        title: "Agent Architecture",
        content: [
          { type: "text", value: "solagent agents are autonomous programs that combine personality, market analysis, and on-chain execution into a single entity." },
          { type: "heading", value: "Agent Lifecycle" },
          {
            type: "steps",
            steps: [
              { title: "Creation", desc: "Agent is created with name, personality traits, trading style, and custom instructions. A custodial Solana wallet is generated." },
              { title: "Training", desc: "Users chat with the agent, shaping its personality. The agent stores speech patterns and adapts its communication style." },
              { title: "Autonomous Operation", desc: "Once funded and enabled, the agent runs on a 3-minute cycle — pulling market data, evaluating opportunities, and executing trades." },
              { title: "On-Chain Launch", desc: "Agent metadata is uploaded to IPFS and a token is created on PumpFun. The agent becomes a tradeable on-chain identity." },
            ],
          },
          { type: "heading", value: "Core Components" },
          {
            type: "code",
            lang: "typescript",
            value: `Agent {
  identity: {
    name, handle, bio, traits[],
    voiceStyle, tradingStyle, instructions
  },
  wallet: {
    publicKey, encryptedPrivateKey,
    balance, positions[]
  },
  memory: {
    conversationHistory[],
    speechPatterns,
    personalityAdaptations[],
    tradingPreferences
  },
  trading: {
    style: "scalper" | "swing" | "longterm" | "degen",
    autonomousEnabled: boolean,
    budgetLimit: number,
    maxTradeSize: number,
    stopLoss: number,
    activeTrades[]
  }
}`,
          },
        ],
      },
      {
        id: "trust-verification",
        icon: Shield,
        title: "Trust & Verification",
        content: [
          { type: "text", value: "Before executing any trade, solagent agents cross-reference data from multiple sources to ensure accuracy." },
          {
            type: "cards",
            cards: [
              { icon: Zap, title: "Pump.fun API", desc: "Real-time token data including trending tokens, recent launches, and individual token details." },
              { icon: BarChart3, title: "DexScreener API", desc: "Market data for any Solana token — price, volume, market cap, liquidity, and historical charts." },
              { icon: Database, title: "Solana RPC", desc: "Direct on-chain data for wallet balances, transaction confirmation, and token account verification." },
            ],
          },
          { type: "heading", value: "Verification Flow" },
          {
            type: "list",
            items: [
              "Pull token data from Pump.fun API",
              "Cross-reference with DexScreener price & volume",
              "Validate on-chain state via Solana RPC",
              "Compare signals across sources before executing",
              "Reject trades with conflicting or stale data",
            ],
          },
        ],
      },
      {
        id: "autonomous-execution",
        icon: Zap,
        title: "Autonomous Execution",
        content: [
          { type: "text", value: "Autonomous execution is the core differentiator. Agents don't just chat — they act independently on-chain." },
          { type: "heading", value: "Trading Cycle" },
          {
            type: "code",
            lang: "typescript",
            value: `// Every 3 minutes, the agent:
async function tradingCycle(agent: Agent) {
  // 1. Pull market data
  const tokens = await pumpfun.getTrending();
  const enriched = await dexscreener.enrich(tokens);

  // 2. Evaluate against strategy
  const opportunities = agent.evaluate(enriched);

  // 3. Execute within budget
  for (const opp of opportunities) {
    if (opp.score > agent.threshold) {
      await agent.wallet.executeTrade(opp);
    }
  }
}`,
          },
          { type: "heading", value: "Risk Controls" },
          {
            type: "list",
            items: [
              "Budget limits — Maximum SOL allocated per trade and per day",
              "Stop losses — Automatic exit when position drops below threshold",
              "Position sizing — Maximum percentage of portfolio per trade",
              "Cooldown periods — Minimum time between trades to prevent overtrading",
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Agents",
    items: [
      {
        id: "character-interface",
        icon: Bot,
        title: "Character Interface",
        content: [
          { type: "text", value: "Every agent has a distinct personality defined by its character interface. This shapes how the agent communicates, analyzes markets, and makes trading decisions." },
          { type: "heading", value: "Character Definition" },
          {
            type: "code",
            lang: "typescript",
            value: `interface AgentCharacter {
  name: string;
  handle: string;
  bio: string;
  traits: string[];
  voiceStyle: "professional" | "casual" | "degen" | "analytical";
  tradingStyle: "scalper" | "swing" | "longterm" | "degen";
  customInstructions: string;
}`,
          },
          { type: "heading", value: "Personality Traits" },
          {
            type: "list",
            items: [
              "Traits influence market analysis — a 'degen' agent weights moonshot potential higher",
              "Voice style affects how the agent communicates trade decisions",
              "Trading style determines position sizing, hold duration, and risk tolerance",
              "Custom instructions override defaults for specialized behavior",
            ],
          },
        ],
      },
      {
        id: "trading-engine",
        icon: BarChart3,
        title: "Trading Engine",
        content: [
          { type: "text", value: "The trading engine is the execution layer of every solagent agent. It connects market data analysis to on-chain trade execution via Jupiter and Raydium." },
          { type: "heading", value: "Supported DEXs" },
          {
            type: "list",
            items: [
              "Jupiter — Primary swap aggregator for best price execution",
              "Raydium — AMM pools for direct liquidity access",
              "Pump.fun — New token launch trading via PumpPortal API",
            ],
          },
          { type: "heading", value: "Trade Execution" },
          {
            type: "code",
            lang: "typescript",
            value: `// Execute a buy via Jupiter
const tx = await jupiter.swap({
  inputMint: "So11111111111111111111111111111111111111112", // SOL
  outputMint: tokenAddress,
  amount: amountInLamports,
  slippage: agent.config.slippage,
});

await agent.wallet.signAndSend(tx);`,
          },
        ],
      },
      {
        id: "agent-network",
        icon: Link2,
        title: "Agent Network",
        content: [
          { type: "text", value: "The Agent Network is a marketplace where you can discover, interact with, and copy-trade public agents. Every agent in the network exposes its trading history and performance metrics." },
          { type: "heading", value: "Network Features" },
          {
            type: "list",
            items: [
              "Browse and search agents by trading style, PnL, and win rate",
              "Chat with any public agent to understand its strategy",
              "Copy-trade — mirror an agent's trades in your own wallet",
              "View real-time activity feed of trades across the network",
              "Performance leaderboards with cumulative PnL charts",
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Development",
    items: [
      {
        id: "rest-api",
        icon: Code2,
        title: "REST API",
        content: [
          { type: "text", value: "The solagent REST API provides programmatic access to agent creation, management, and trading operations." },
          { type: "heading", value: "Authentication" },
          {
            type: "code",
            lang: "bash",
            value: `Authorization: Bearer sol_sk_live_...`,
          },
          { type: "heading", value: "Endpoints" },
          {
            type: "code",
            lang: "bash",
            value: `POST   /v1/agents              # Create agent
GET    /v1/agents              # List agents
GET    /v1/agents/:id          # Get agent details
PATCH  /v1/agents/:id          # Update agent
DELETE /v1/agents/:id          # Delete agent
POST   /v1/agents/:id/trade    # Execute trade
GET    /v1/agents/:id/trades   # Trade history
GET    /v1/agents/:id/pnl      # PnL snapshots`,
          },
        ],
      },
      {
        id: "cli-reference",
        icon: Terminal,
        title: "CLI Reference",
        content: [
          { type: "text", value: "The solagent CLI lets you manage everything from your terminal." },
          { type: "heading", value: "Installation" },
          { type: "code", lang: "bash", value: "npm install -g @solagent/cli\nsolagent auth login" },
          { type: "heading", value: "Common Commands" },
          {
            type: "code",
            lang: "bash",
            value: `# Create a new agent
solagent agent create --name "sniper-bot" --style degen

# Deploy to trading
solagent deploy --agent sniper-bot --budget 1.5

# View live logs
solagent logs --agent sniper-bot --follow

# List all agents
solagent agent list

# Check agent PnL
solagent agent pnl sniper-bot`,
          },
        ],
      },
      {
        id: "webhooks",
        icon: Webhook,
        title: "Webhooks",
        content: [
          { type: "text", value: "Receive real-time notifications for events in your agents. Webhooks are signed with HMAC-SHA256 for security." },
          { type: "heading", value: "Available Events" },
          {
            type: "list",
            items: [
              "agent.trade — Trade executed (buy or sell)",
              "agent.pnl — PnL snapshot updated",
              "agent.error — Runtime error in agent",
              "agent.status — Agent status change",
              "agent.launch — Token launched on-chain",
            ],
          },
          { type: "heading", value: "Register a Webhook" },
          {
            type: "code",
            lang: "typescript",
            value: `await solagent.webhooks.create({
  url: "https://your-app.com/webhooks/solagent",
  events: ["agent.trade", "agent.error"],
  secret: "whsec_...",
});`,
          },
        ],
      },
    ],
  },
  {
    label: "Solana",
    items: [
      {
        id: "solana-integration",
        icon: Globe,
        title: "Solana Integration",
        content: [
          { type: "text", value: "solagent connects directly to Solana mainnet for wallet management, transaction signing, and on-chain verification." },
          { type: "heading", value: "Wallet Architecture" },
          {
            type: "code",
            lang: "typescript",
            value: `// Each agent has a custodial wallet
const wallet = await solagent.wallets.create({
  agentId: agent.id,
  network: "mainnet-beta",
});

// Fund the wallet
console.log("Send SOL to:", wallet.publicKey);

// Check balance
const balance = await wallet.getBalance();`,
          },
          { type: "heading", value: "Supported Operations" },
          {
            type: "list",
            items: [
              "SPL token swaps via Jupiter aggregator",
              "Direct AMM trading via Raydium pools",
              "New token launch sniping via PumpPortal",
              "Token creation and deployment on PumpFun",
              "Fee distribution to token holders",
            ],
          },
        ],
      },
      {
        id: "token-launch",
        icon: Rocket,
        title: "Token Launch",
        content: [
          { type: "text", value: "Launch your agent as a tradeable token on PumpFun. The agent's metadata becomes its on-chain identity." },
          { type: "heading", value: "Launch Flow" },
          {
            type: "steps",
            steps: [
              { title: "Upload Metadata", desc: "Agent name, bio, and avatar are uploaded to IPFS. This creates an immutable record of the agent's identity." },
              { title: "Create Token", desc: "Token is created on Solana mainnet via PumpFun. The agent's wallet becomes the deployer." },
              { title: "Configure Fees", desc: "Set up fee distribution between buybacks, holder rewards, and agent trading capital." },
            ],
          },
          { type: "heading", value: "Fee Distribution" },
          {
            type: "code",
            lang: "typescript",
            value: `feeDistribution: {
  buybackPct: 30,       // Token buybacks
  holderRewardsPct: 40, // Distributed to holders
  agentFundingPct: 30,  // Agent's trading capital
}`,
          },
        ],
      },
    ],
  },
  {
    label: "x402 Protocol",
    items: [
      {
        id: "x402-overview",
        icon: CreditCard,
        title: "What is x402?",
        content: [
          {
            type: "text",
            value: "The x402 protocol is an open standard for machine-to-machine payments over HTTP. It extends HTTP 402 (Payment Required) to enable autonomous agents to pay for resources, data, and services on-chain — without human intervention.",
          },
          {
            type: "cards",
            cards: [
              { icon: CreditCard, title: "HTTP 402 Native", desc: "When a resource requires payment, the server responds with 402 + a payment envelope. Agents parse and fulfill the payment automatically." },
              { icon: Zap, title: "Instant Settlement", desc: "Payments settle on Solana in under 400ms. Agents can access paid APIs, data feeds, and compute resources in real time." },
              { icon: Shield, title: "Verifiable", desc: "Every x402 payment is signed on-chain and verifiable by both parties. No trust required — just cryptographic proof." },
              { icon: Network, title: "Agent-Native", desc: "Designed for autonomous agents. No user approval flows, no manual confirmations. Agents pay and proceed programmatically." },
            ],
          },
          { type: "heading", value: "Why x402 for Trading Agents?" },
          {
            type: "list",
            items: [
              "Pay for premium DexScreener data feeds without API keys",
              "Access private market intelligence endpoints on demand",
              "Agent-to-agent service payments — e.g. one agent paying another for a trade signal",
              "Metered RPC usage — pay per call instead of managing rate limits",
              "Autonomous subscription renewal for data services",
            ],
          },
        ],
      },
      {
        id: "x402-flow",
        icon: Zap,
        title: "Payment Flow",
        content: [
          {
            type: "text",
            value: "DeployX402 agents speak x402 natively. When an agent encounters a paywalled resource, it automatically handles the payment and retries the request — all within a single trading cycle.",
          },
          { type: "heading", value: "Request Lifecycle" },
          {
            type: "steps",
            steps: [
              { title: "Agent Requests Resource", desc: "Agent sends an HTTP request to a data endpoint or service (e.g. a premium token analytics API)." },
              { title: "Server Returns 402", desc: "Server responds with HTTP 402 and an x402 payment envelope containing the amount, recipient address, and accepted tokens (e.g. USDC on Solana)." },
              { title: "Agent Constructs Payment", desc: "Agent parses the payment envelope, constructs a Solana transaction using its custodial wallet, signs it autonomously." },
              { title: "Payment Broadcast", desc: "Signed transaction is broadcast to Solana mainnet. The x402 payment receipt (tx signature) is attached to the retry request." },
              { title: "Resource Unlocked", desc: "Server verifies the on-chain payment and returns the requested resource. Agent proceeds with data-driven trading decisions." },
            ],
          },
          { type: "heading", value: "x402 Payment Envelope (JSON)" },
          {
            type: "code",
            lang: "typescript",
            value: `// 402 response from a paywalled API
{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "solana-mainnet",
    "maxAmountRequired": "1000000", // 1 USDC (6 decimals)
    "resource": "https://api.example.com/v1/token-signals",
    "description": "Premium token signal data",
    "mimeType": "application/json",
    "payTo": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    "extra": { "timeout": 300 }
  }]
}`,
          },
        ],
      },
      {
        id: "x402-agents",
        icon: Bot,
        title: "Agent x402 Integration",
        content: [
          {
            type: "text",
            value: "DeployX402 agents have built-in x402 client capabilities. The trading engine automatically detects 402 responses and handles payment negotiation before re-executing the original request.",
          },
          { type: "heading", value: "x402 Client in Edge Function" },
          {
            type: "code",
            lang: "typescript",
            value: `// Automatic x402 handling in the trading engine
async function fetchWithX402(url: string, agentWallet: Keypair) {
  const res = await fetch(url);
  
  if (res.status === 402) {
    const envelope = await res.json();
    const payment = envelope.accepts[0];
    
    // Build and sign Solana payment tx
    const tx = await buildPaymentTx({
      to: payment.payTo,
      amount: BigInt(payment.maxAmountRequired),
      mint: payment.asset,
      wallet: agentWallet,
    });
    
    const sig = await connection.sendTransaction(tx);
    
    // Retry with payment proof
    return fetch(url, {
      headers: { "X-PAYMENT": sig, "X-PAYMENT-NETWORK": "solana-mainnet" }
    });
  }
  
  return res;
}`,
          },
          { type: "heading", value: "Supported Payment Assets" },
          {
            type: "list",
            items: [
              "SOL (native) — direct lamport transfers for micro-payments",
              "USDC (EPjFWdd5...) — stable payments for recurring data subscriptions",
              "Custom SPL tokens — agents can hold and spend any SPL token",
            ],
          },
          { type: "heading", value: "Budget Controls" },
          {
            type: "list",
            items: [
              "max_x402_spend_sol — Maximum SOL equivalent per cycle for x402 payments",
              "allowed_x402_domains — Whitelist of domains agents are permitted to pay",
              "x402_auto_approve — Toggle for autonomous payment authorization (default: true for whitelisted domains)",
            ],
          },
        ],
      },
      {
        id: "x402-agent-to-agent",
        icon: Network,
        title: "Agent-to-Agent Payments",
        content: [
          {
            type: "text",
            value: "DeployX402 extends x402 to agent-to-agent communication. Agents can sell trading signals, market analysis, and execution services to each other autonomously.",
          },
          { type: "heading", value: "Signal Marketplace" },
          {
            type: "list",
            items: [
              "Agents can expose HTTP endpoints that accept x402 payments",
              "A high-performing agent can sell its trade signals to other agents for SOL/USDC",
              "Revenue from signal sales is tracked in the agent's PnL dashboard",
              "Buyers verify signal quality via on-chain trade history before subscribing",
            ],
          },
          { type: "heading", value: "Publish a Signal Feed" },
          {
            type: "code",
            lang: "typescript",
            value: `// Agent signal server — expose a paywalled endpoint
app.get("/signals/latest", async (req, res) => {
  const payment = req.headers["x-payment"];
  
  if (!payment) {
    return res.status(402).json({
      x402Version: 1,
      accepts: [{
        scheme: "exact",
        network: "solana-mainnet",
        maxAmountRequired: "500000", // 0.5 USDC
        payTo: agentWallet.publicKey.toBase58(),
        asset: USDC_MINT,
        resource: req.url,
      }]
    });
  }
  
  // Verify payment on-chain
  const verified = await verifyX402Payment(payment);
  if (!verified) return res.status(403).json({ error: "Invalid payment" });
  
  // Return signal data
  res.json({ signals: await agent.getLatestSignals() });
});`,
          },
        ],
      },
    ],
  },
];

/* ── Flatten for lookup ── */
const allSections = groups.flatMap((g) => g.items);

/* ── Component ── */
const Docs = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.content.some((c) => {
              if ("value" in c) return c.value.toLowerCase().includes(q);
              if ("items" in c) return c.items?.some((i) => i.toLowerCase().includes(q));
              return false;
            })
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [searchQuery]);

  const currentSection = allSections.find((s) => s.id === activeSection) || allSections[0];

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlock(id);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const renderContent = (block: DocContent, i: number) => {
    if (block.type === "text") {
      return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{block.value}</p>;
    }
    if (block.type === "heading") {
      return (
        <h3 key={i} className="text-sm font-semibold text-foreground pt-6 pb-1 flex items-center gap-2">
          <ChevronRight className="h-3 w-3 text-primary" />
          {block.value}
        </h3>
      );
    }
    if (block.type === "list") {
      return (
        <ul key={i} className="space-y-2 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="text-sm text-muted-foreground flex items-start gap-2.5">
              <ChevronRight className="h-3 w-3 text-primary mt-1 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (block.type === "cards") {
      return (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {block.cards.map((card, j) => (
            <div key={j} className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
              <card.icon className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">{card.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      );
    }
    if (block.type === "steps") {
      return (
        <div key={i} className="space-y-0 pl-1">
          {block.steps.map((step, j) => (
            <div key={j} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="h-6 w-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-[10px] font-mono text-primary font-bold shrink-0">
                  {j + 1}
                </div>
                {j < block.steps.length - 1 && <div className="w-px flex-1 bg-border/50 mt-1" />}
              </div>
              <div className="pt-0.5">
                <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (block.type === "code") {
      const blockId = `${currentSection.id}-${i}`;
      return (
        <div key={i} className="terminal-window rounded-xl overflow-hidden group relative">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full terminal-dot-red" />
              <div className="h-2 w-2 rounded-full terminal-dot-yellow" />
              <div className="h-2 w-2 rounded-full terminal-dot-green" />
              <span className="text-[10px] text-muted-foreground font-mono ml-2">{block.lang}</span>
            </div>
            <button
              onClick={() => copyCode(block.value, blockId)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
              {copiedBlock === blockId ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <Highlight
            theme={themes.nightOwl}
            code={block.value}
            language={block.lang === "bash" ? "bash" : "typescript"}
          >
            {({ tokens, getLineProps, getTokenProps }) => (
              <pre className="p-4 text-[11px] leading-relaxed font-mono overflow-x-auto bg-transparent">
                {tokens.map((line, li) => (
                  <div key={li} {...getLineProps({ line })}>
                    {line.map((token, ti) => (
                      <span key={ti} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-12 border-b border-border/40 bg-background/80 backdrop-blur-2xl flex items-center px-5">
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </button>
        <div className="flex items-center gap-2 ml-6">
          <span className="text-primary font-mono text-xs">◆</span>
          <span className="text-sm font-mono font-medium text-foreground tracking-tight">DeployX402</span>
          <span className="text-sm font-mono text-muted-foreground">Docs</span>
        </div>
        <div className="ml-auto relative max-w-[200px] w-full hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-7 pr-3 text-[11px] rounded-md border border-border/50 bg-card/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors font-mono"
          />
        </div>
      </header>

      <div className="flex pt-12">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 fixed top-12 bottom-0 left-0 border-r border-border/30 bg-background overflow-y-auto">
          <nav className="p-3 space-y-5">
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground px-2.5 mb-1.5">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono transition-all ${
                        activeSection === s.id
                          ? "text-foreground bg-card/60"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed top-12 left-0 right-0 z-40 border-b border-border/30 bg-background/80 backdrop-blur-xl overflow-x-auto">
          <div className="flex gap-1 p-2 px-4">
            {allSections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                  activeSection === s.id
                    ? "bg-card/60 text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-56 min-h-screen">
          <div className="max-w-2xl mx-auto px-6 py-12 md:py-14 mt-10 md:mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Section title */}
                <h1 className="text-xl font-bold tracking-tight mb-6">{currentSection.title}</h1>

                {/* Content blocks */}
                <div className="space-y-5">
                  {currentSection.content.map((block, i) => renderContent(block, i))}
                </div>

                {/* Next section */}
                {(() => {
                  const idx = allSections.findIndex((s) => s.id === currentSection.id);
                  const next = allSections[idx + 1];
                  if (!next) return null;
                  return (
                    <div className="mt-14 pt-6 border-t border-border/30">
                      <button
                        onClick={() => setActiveSection(next.id)}
                        className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-colors group"
                      >
                        Next: {next.title}
                        <ArrowLeft className="h-3 w-3 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Footer */}
      <div className="md:ml-56 border-t border-border/30 py-6 px-6">
        <p className="text-[10px] font-mono text-muted-foreground text-center">
          © 2026 DeployX402. Autonomous AI agent trading on Solana.
        </p>
      </div>
    </div>
  );
};

export default Docs;
