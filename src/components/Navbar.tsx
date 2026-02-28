import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletContext";

const Navbar = () => {
  const { connect, disconnect, connected, shortAddress } = useWallet();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-nav rounded-full px-6 py-2.5 flex items-center gap-6">
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 cursor-pointer">
        <span className="text-primary font-mono text-xs">◆</span>
        <span className="text-sm font-mono font-medium text-foreground tracking-tight">solagent</span>
      </button>

      <div className="h-3 w-px bg-border" />

      <div className="hidden sm:flex items-center gap-5">
        {[
          { href: "#how-it-works", label: "How" },
          { href: "#ecosystem", label: "Ecosystem" },
          { href: "/docs", label: "Docs", isRoute: true },
        ].map((l) => (
          <button
            key={l.href}
            onClick={() => {
              if (l.isRoute) navigate(l.href);
              else document.getElementById(l.href.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="h-3 w-px bg-border hidden sm:block" />

      {connected ? (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/dashboard")} className="text-xs font-mono text-primary hover:text-primary/80 transition-colors">
            Platform
          </button>
          <span className="text-[10px] font-mono text-muted-foreground">{shortAddress}</span>
        </div>
      ) : (
        <button onClick={connect} className="text-xs font-mono text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
          <Wallet className="h-3 w-3" />
          Connect
        </button>
      )}
    </nav>
  );
};

export default Navbar;
