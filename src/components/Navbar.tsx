import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { login, logout, authenticated, userDisplay } = useAuth();
  const navigate = useNavigate();

  const links = [
    { href: "#features", label: "Features" },
    { href: "#developers", label: "API" },
    { href: "#integrations", label: "Channels" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-2xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 cursor-pointer">
          <img src="/logo.png" alt="LaunchPad logo" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-bold text-foreground tracking-tight">LaunchPad</span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button key={l.href} onClick={() => handleLinkClick(l)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {l.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block">
          {authenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">{userDisplay}</span>
              <Button size="sm" variant="outline" onClick={logout} className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
                Sign Out
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={login} className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50">
              Sign In
            </Button>
          )}
        </div>

        <button
          className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg text-foreground hover:bg-secondary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-2xl">
          <div className="container mx-auto px-6 py-4 space-y-1">
            {links.map((l) => (
              <button key={l.href} onClick={() => { handleLinkClick(l); setMobileOpen(false); }} className="block w-full text-left py-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                {l.label}
              </button>
            ))}
            <div className="pt-3 border-t border-border/50">
              {authenticated ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground truncate">{userDisplay}</p>
                  <Button size="sm" variant="outline" onClick={logout} className="w-full border-border text-muted-foreground">Sign Out</Button>
                </div>
              ) : (
                <Button size="sm" onClick={login} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Sign In</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
