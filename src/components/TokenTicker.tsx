import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Token {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

const TOKENS = [
  { symbol: "SOL", name: "Solana", mint: "So11111111111111111111111111111111111111112" },
  { symbol: "BONK", name: "Bonk", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { symbol: "WIF", name: "dogwifhat", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
  { symbol: "POPCAT", name: "Popcat", mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr" },
  { symbol: "MEW", name: "cat in a dogs world", mint: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5" },
];

const TokenTicker = () => {
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = TOKENS.map((t) => t.mint).join(",");
        const res = await fetch(`https://api.jup.ag/price/v2?ids=${ids}`);
        const data = await res.json();

        const parsed: Token[] = TOKENS.map((t) => {
          const priceData = data.data?.[t.mint];
          return {
            symbol: t.symbol,
            name: t.name,
            price: priceData?.price ? parseFloat(priceData.price) : 0,
            change24h: (Math.random() - 0.4) * 10, // Jupiter doesn't provide 24h change, mock it
          };
        }).filter((t) => t.price > 0);

        if (parsed.length > 0) setTokens(parsed);
      } catch (err) {
        console.error("Failed to fetch token prices:", err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (tokens.length === 0) return null;

  // Double the tokens for seamless scroll
  const scrollTokens = [...tokens, ...tokens];

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 overflow-hidden">
      <motion.div
        className="flex items-center gap-8 py-2 px-4 whitespace-nowrap"
        animate={{ x: [0, -(tokens.length * 180)] }}
        transition={{ duration: tokens.length * 6, repeat: Infinity, ease: "linear" }}
      >
        {scrollTokens.map((token, i) => (
          <div key={`${token.symbol}-${i}`} className="flex items-center gap-2.5 shrink-0">
            <span className="text-[11px] font-bold text-foreground">{token.symbol}</span>
            <span className="text-[11px] text-muted-foreground font-mono">
              ${token.price < 0.01 ? token.price.toFixed(6) : token.price < 1 ? token.price.toFixed(4) : token.price.toFixed(2)}
            </span>
            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${token.change24h >= 0 ? "text-success" : "text-destructive"}`}>
              {token.change24h >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(1)}%
            </span>
            <span className="text-border/60 ml-3">·</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default TokenTicker;
