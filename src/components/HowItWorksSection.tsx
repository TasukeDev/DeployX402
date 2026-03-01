import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Create Agent",
    body: "Name your agent, pick a strategy (Scalper, Swing, DCA, Sniper, or Custom), and configure take-profit / stop-loss thresholds.",
    tag: "CONFIG",
  },
  {
    n: "02",
    title: "Fund Wallet",
    body: "Each agent gets a unique non-custodial Solana wallet. Deposit SOL to activate live trading — withdraw anytime.",
    tag: "ONCHAIN",
  },
  {
    n: "03",
    title: "Analyze Markets",
    body: "Agents stream DexScreener and PumpFun feeds in real-time, scoring tokens by momentum, volume delta, and liquidity depth.",
    tag: "AI",
  },
  {
    n: "04",
    title: "Execute Trades",
    body: "Qualifying signals trigger Jupiter V6 swaps — best-route, low-slippage execution directly from the agent wallet.",
    tag: "EXECUTE",
  },
  {
    n: "05",
    title: "Track On-Chain",
    body: "Every buy, sell, and PnL snapshot is written to the ledger. Inspect the full audit trail on-chain at any time.",
    tag: "VERIFY",
  },
];

const TAG_COLORS: Record<string, string> = {
  CONFIG: "text-primary/70 bg-primary/10 border-primary/20",
  ONCHAIN: "text-success/80 bg-success/10 border-success/20",
  AI: "text-accent/80 bg-accent/10 border-accent/20",
  EXECUTE: "text-primary/70 bg-primary/10 border-primary/20",
  VERIFY: "text-success/80 bg-success/10 border-success/20",
};

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header row */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 lg:gap-20 items-start mb-14">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden lg:flex flex-col gap-2 pt-1"
          >
            <div className="h-px w-8 bg-primary/50" />
            <span className="text-[10px] font-mono text-primary uppercase tracking-[0.25em]">02 / Process</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
          >
            How it <span className="text-gradient-hero">works</span>
          </motion.h2>
        </div>

        {/* Steps as a numbered table */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 lg:gap-20">
          <div className="hidden lg:block" />
          <div className="space-y-0 border border-border rounded-sm overflow-hidden divide-y divide-border">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-5 px-5 py-4 hover:bg-secondary/40 transition-colors group"
              >
                {/* Step number */}
                <span className="text-[11px] font-mono text-muted-foreground/50 w-6 shrink-0 pt-0.5">{step.n}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-mono font-semibold text-foreground">{step.title}</p>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border ${TAG_COLORS[step.tag]}`}>
                      {step.tag}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
                </div>

                {/* Arrow indicator */}
                <span className="text-muted-foreground/20 group-hover:text-primary/40 transition-colors font-mono text-xs pt-0.5">→</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
