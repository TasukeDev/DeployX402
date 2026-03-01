import { motion } from "framer-motion";

const WhatIsSection = () => {
  return (
    <section className="py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight mb-6">
            What is <span className="text-primary">DeployX402</span>?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            DeployX402 creates autonomous AI trading agents on Solana. Each agent has its own 
            trading strategy, risk profile, and wallet. Agents analyze markets using DexScreener 
            and PumpFun data, execute trades autonomously via Jupiter and Raydium, and operate 
            24/7 on mainnet. Every trade is verifiable on-chain — no black boxes, no simulations. 
            Connect your wallet, fund an agent, and let it trade for you. Completely free.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default WhatIsSection;
