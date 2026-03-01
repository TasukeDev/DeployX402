import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Menu, X, Terminal } from "lucide-react";
import { useWallet } from "@/components/WalletContext";
import { useAuth } from "@/components/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#ecosystem", label: "Ecosystem" },
  { href: "/leaderboard", label: "Leaderboard", isRoute: true },
  { href: "/docs", label: "Docs", isRoute: true },
];

const Navbar = () => {
  const { connect, disconnect, connected, shortAddress } = useWallet();
  const { authenticated, userDisplay } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (link: typeof NAV_LINKS[0]) => {
    setMobileOpen(false);
    if (link.isRoute) navigate(link.href);
    else document.getElementById(link.href.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Full-width flat nav bar — not a pill like azkelx402 */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-6">
        <div className="flex items-center gap-3 mr-8">
          {/* Square logo mark */}
          <div className="h-6 w-6 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="text-primary font-mono text-[10px] font-bold leading-none">DX</span>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm font-mono font-semibold text-foreground tracking-tight"
          >
            DeployX402
          </button>
          <span className="hidden sm:block text-[10px] font-mono text-muted-foreground/50 border border-border/50 px-1.5 py-0.5 rounded-sm">v1.0</span>
        </div>

        {/* Desktop links — left aligned in a row */}
        <div className="hidden sm:flex items-center gap-6 flex-1">
          {NAV_LINKS.map((l) => (
            <button
              key={l.href}
              onClick={() => handleNavClick(l)}
              className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors nav-link-underline uppercase tracking-wider"
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden sm:flex items-center gap-3 ml-auto">
          {(authenticated || connected) ? (
            <>
              <span className="text-[10px] font-mono text-muted-foreground">
                {connected ? shortAddress : userDisplay?.split("@")[0]}
              </span>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Terminal className="h-3 w-3" />
                Platform
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-sm bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
            >
              <Wallet className="h-3 w-3" />
              Sign in
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="sm:hidden ml-auto flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed top-12 left-0 right-0 z-40 border-b border-border bg-card/98 backdrop-blur-md px-6 py-4 flex flex-col gap-3"
          >
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => handleNavClick(l)}
                className="text-left text-sm font-mono text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {l.label}
              </button>
            ))}
            <div className="h-px bg-border my-1" />
            {(authenticated || connected) ? (
              <button
                onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}
                className="text-left text-sm font-mono text-primary hover:text-primary/80 transition-colors py-1"
              >
                Platform →
              </button>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); navigate("/auth"); }}
                className="flex items-center gap-2 text-sm font-mono text-primary hover:text-primary/80 transition-colors py-1"
              >
                <Wallet className="h-3.5 w-3.5" />
                Sign in
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
