import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { connect, disconnect, connected, shortAddress, balance } = useWallet();
  const navigate = useNavigate();

  const links = [
    { href: "#features", label: "Features" },
    { href: "#performance", label: "Performance" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#pricing", label: "Pricing" },
    { href: "/docs", label: "Docs", isRoute: true },
  ];

  const scrollTo = (href: string) => {
    const id = href.replace('#', '');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLinkClick = (l: { href: string; isRoute?: boolean }) => {
    if (l.isRoute) {
      navigate(l.href);
    } else {
      scrollTo(l.href);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-2xl border-b border-border/40">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 cursor-pointer">
          <img src="/logo.png" alt="SolAgent" className="h-7 w-7 rounded-lg" />
          <span className="text-base font-bold text-foreground tracking-tight">SolAgent</span>
        </button>

        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <button key={l.href} onClick={() => handleLinkClick(l)} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200">
              {l.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block">
          {connected ? (
            <div className="flex items-center gap-2.5">
              <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")} className="border-primary/30 text-primary hover:bg-primary/10 text-xs h-8">
                Dashboard
              </Button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-secondary/50 text-[11px]">
                <span className="text-foreground font-medium">{shortAddress}</span>
                {balance !== null && (
                  <span className="text-muted-foreground">{balance.toFixed(2)} SOL</span>
                )}
              </div>
              <Button size="sm" variant="ghost" onClick={disconnect} className="text-muted-foreground hover:text-foreground text-xs h-8">
                Disconnect
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={connect} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-8 px-4 text-xs">
              <Wallet className="h-3.5 w-3.5 mr-1.5" />
              Connect Wallet
            </Button>
          )}
        </div>

        <button
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-foreground hover:bg-secondary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-2xl">
          <div className="container mx-auto px-6 py-4 space-y-1">
            {links.map((l) => (
              <button key={l.href} onClick={() => { handleLinkClick(l); setMobileOpen(false); }} className="block w-full text-left py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </button>
            ))}
            <div className="pt-3 border-t border-border/40">
              {connected ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground truncate">{shortAddress}</p>
                  <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")} className="w-full">Dashboard</Button>
                  <Button size="sm" variant="ghost" onClick={disconnect} className="w-full text-muted-foreground">Disconnect</Button>
                </div>
              ) : (
                <Button size="sm" onClick={connect} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Wallet className="h-3.5 w-3.5 mr-1.5" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
