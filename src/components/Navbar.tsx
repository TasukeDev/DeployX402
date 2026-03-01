import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Menu, X, Twitter } from "lucide-react";
import { useWallet } from "@/components/WalletContext";
import { useAuth } from "@/components/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How" },
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
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-nav rounded-full px-6 py-2.5 flex items-center gap-6 transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(160_70%_45%/0.12)]">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 cursor-pointer">
          <span className="text-primary font-mono text-xs">◆</span>
          <span className="text-sm font-mono font-medium text-foreground tracking-tight">DeployX402</span>
        </button>

        <div className="h-3 w-px bg-border" />

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-5">
          {NAV_LINKS.map((l) => (
            <button
              key={l.href}
              onClick={() => handleNavClick(l)}
              className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors nav-link-underline"
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="h-3 w-px bg-border hidden sm:block" />

        {/* Auth / user */}
        {(authenticated || connected) ? (
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => navigate("/dashboard")} className="text-xs font-mono text-primary hover:text-primary/80 transition-colors">
              Platform
            </button>
            {connected && <span className="text-[10px] font-mono text-muted-foreground">{shortAddress}</span>}
            {!connected && authenticated && <span className="text-[10px] font-mono text-muted-foreground">{userDisplay?.split("@")[0]}</span>}
          </div>
        ) : (
          <button onClick={() => navigate("/auth")} className="hidden sm:flex text-xs font-mono text-primary hover:text-primary/80 transition-colors items-center gap-1.5">
            <Wallet className="h-3 w-3" />
            {userDisplay ? userDisplay.split("@")[0] : "Sign in"}
          </button>
        )}

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="sm:hidden flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
            className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] max-w-xs rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl px-4 py-4 flex flex-col gap-3"
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
