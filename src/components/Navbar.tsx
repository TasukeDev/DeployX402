import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Menu, X } from "lucide-react";
import { useWallet } from "@/components/WalletContext";
import { useAuth } from "@/components/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How" },
  { href: "#ecosystem", label: "Ecosystem" },
  { href: "/leaderboard", label: "Leaderboard", isRoute: true },
  { href: "/docs", label: "Docs", isRoute: true },
  { href: "/api-docs", label: "API", isRoute: true },
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
      {/* Slim top bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 cursor-pointer group">
            <span className="text-primary font-mono text-xs group-hover:text-primary/80 transition-colors">◆</span>
            <span className="text-sm font-mono font-bold text-foreground tracking-tight">AutoX402</span>
          </button>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => handleNavClick(l)}
                className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden sm:flex items-center">
            {(authenticated || connected) ? (
              <div className="flex items-center gap-4">
                <button onClick={() => navigate("/dashboard")} className="text-[11px] font-mono text-primary hover:text-primary/80 transition-colors uppercase tracking-wider">
                  Platform
                </button>
                {connected && <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5">{shortAddress}</span>}
                {!connected && authenticated && <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5">{userDisplay?.split("@")[0]}</span>}
              </div>
            ) : (
              <button onClick={() => navigate("/auth")} className="flex items-center gap-1.5 text-[11px] font-mono text-primary hover:text-primary/80 transition-colors uppercase tracking-wider">
                <Wallet className="h-3 w-3" />
                {userDisplay ? userDisplay.split("@")[0] : "Sign in"}
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="sm:hidden flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed top-14 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 flex flex-col gap-3"
          >
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => handleNavClick(l)}
                className="text-left text-xs font-mono text-muted-foreground hover:text-foreground transition-colors py-1 uppercase tracking-wider"
              >
                {l.label}
              </button>
            ))}
            <div className="h-px bg-border my-1" />
            {(authenticated || connected) ? (
              <button
                onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}
                className="text-left text-xs font-mono text-primary hover:text-primary/80 transition-colors py-1 uppercase tracking-wider"
              >
                Platform →
              </button>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); navigate("/auth"); }}
                className="flex items-center gap-2 text-xs font-mono text-primary hover:text-primary/80 transition-colors py-1 uppercase tracking-wider"
              >
                <Wallet className="h-3.5 w-3.5" />
                {userDisplay ? userDisplay.split("@")[0] : "Sign in"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
