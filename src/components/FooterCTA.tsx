import { motion } from "framer-motion";
import { Twitter, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LINKS = [
  { label: "Leaderboard", href: "/leaderboard", isRoute: true },
  { label: "Docs", href: "/docs", isRoute: true },
  { label: "Browse Agents", href: "/browse", isRoute: true },
];

const FooterCTA = () => {
  const navigate = useNavigate();

  return (
    <footer className="px-6 pb-12">
      <div className="divider-fade mb-12" />

      <div className="max-w-5xl mx-auto">
        {/* Full-width CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-primary/20 bg-primary/[0.03] rounded-sm px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10"
        >
          <div>
            <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-1">Ready to trade?</p>
            <h3 className="text-xl font-bold text-foreground">Deploy your first agent in minutes.</h3>
          </div>
          <button
            onClick={() => navigate("/auth")}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-primary-foreground text-xs font-mono font-semibold hover:bg-primary/90 transition-colors glow-primary"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
              <span className="text-primary font-mono text-[9px] font-bold leading-none">DX</span>
            </div>
            <span className="text-xs font-mono font-semibold text-foreground">DeployX402</span>
            <span className="text-[10px] font-mono text-muted-foreground/50">© 2026</span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-5">
            {LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => navigate(l.href)}
                className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </button>
            ))}
            <a
              href="https://x.com/DeployX402"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="h-3 w-3" />
              @DeployX402
            </a>
          </div>
        </div>

        <p className="text-[10px] font-mono text-muted-foreground/40 mt-4">
          Trading involves substantial risk. Past performance is not indicative of future results.
        </p>
      </div>
    </footer>
  );
};

export default FooterCTA;
