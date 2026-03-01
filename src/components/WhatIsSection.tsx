import { motion } from "framer-motion";

const BULLETS = [
  "Agents analyze markets using DexScreener and PumpFun data",
  "Execute trades autonomously via Jupiter and Raydium",
  "Operate 24/7 on mainnet — no black boxes, no simulations",
  "Every trade is verifiable on-chain",
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

const WhatIsSection = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Side accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-16 lg:gap-24 items-start">
        {/* Left: rotated label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="hidden lg:flex flex-col items-center gap-3 pt-2"
        >
          <div className="h-8 w-px bg-primary/30" />
          <span
            className="text-[9px] font-mono uppercase tracking-[0.4em] text-muted-foreground"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            01 · About
          </span>
        </motion.div>

        {/* Right: content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-10"
        >
          <motion.div variants={itemVariants}>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary mb-4">What is</p>
            <h2 className="text-3xl sm:text-5xl font-mono font-bold tracking-tighter text-foreground leading-[1.1]">
              Deploy<span className="text-primary">X402</span>
            </h2>
          </motion.div>

          <motion.p variants={itemVariants} className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
            DeployX402 creates autonomous AI trading agents on Solana. Each agent has its own 
            trading strategy, risk profile, and wallet. Connect your wallet, fund an agent, and let it trade for you. Completely free.
          </motion.p>

          {/* Bullet list with accent markers */}
          <ul className="space-y-4">
            {BULLETS.map((b, i) => (
              <motion.li
                key={i}
                variants={itemVariants}
                className="flex items-start gap-3"
              >
                <span className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm text-foreground/70 font-mono leading-relaxed">{b}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};

export default WhatIsSection;
