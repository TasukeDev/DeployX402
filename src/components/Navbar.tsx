import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-2xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">LaunchPad</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</a>
          <a href="#integrations" className="text-sm text-muted-foreground hover:text-primary transition-colors">Channels</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</a>
        </div>
        <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50">
          Sign In
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
