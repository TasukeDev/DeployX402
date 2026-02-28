import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthContext";
import { useWallet } from "@/components/WalletContext";
import { ArrowLeft, Loader2, Mail, Wallet } from "lucide-react";
import { motion } from "framer-motion";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<"wallet" | "email" | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authenticated } = useAuth();
  const { connected, connect, connecting, shortAddress, disconnect } = useWallet();

  useEffect(() => {
    if (authenticated || connected) navigate("/dashboard");
  }, [authenticated, connected, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else navigate("/dashboard");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else {
        toast({ title: "Account created!", description: "You're now signed in." });
        navigate("/dashboard");
      }
    }
    setLoading(false);
  };

  const handleWalletConnect = async (walletType: "phantom" | "jupiter") => {
    if (walletType === "phantom") {
      const phantom = (window as any).solana;
      if (!phantom?.isPhantom) {
        window.open("https://phantom.app/", "_blank");
        return;
      }
      await connect();
    } else {
      // Jupiter wallet uses the same Solana provider interface
      const provider = (window as any).jupiter || (window as any).solana;
      if (!provider) {
        window.open("https://jup.ag/", "_blank");
        return;
      }
      await connect();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-3 w-3" /> back
          </button>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-primary font-mono text-sm">◆</span>
            <span className="text-sm font-mono font-medium">solagent</span>
          </div>
          <h1 className="text-xl font-medium mb-1">
            {method === "email" ? (isLogin ? "Sign in" : "Create account") : "Get started"}
          </h1>
          <p className="text-xs font-mono text-muted-foreground">
            {method === "email"
              ? (isLogin ? "Enter your credentials" : "No email confirmation needed")
              : "Connect your wallet or use email"}
          </p>
        </div>

        {/* Method selection */}
        {!method && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Wallet options */}
            <button
              onClick={() => handleWalletConnect("phantom")}
              disabled={connecting}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-colors group"
            >
              <div className="h-8 w-8 rounded-lg bg-[#AB9FF2]/10 flex items-center justify-center">
                <span className="text-sm font-bold text-[#AB9FF2]">P</span>
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-mono font-medium">Phantom</p>
                <p className="text-[10px] font-mono text-muted-foreground">Connect Phantom wallet</p>
              </div>
              {connecting && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </button>

            <button
              onClick={() => handleWalletConnect("jupiter")}
              disabled={connecting}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-colors group"
            >
              <div className="h-8 w-8 rounded-lg bg-[#FFC629]/10 flex items-center justify-center">
                <span className="text-sm font-bold text-[#FFC629]">J</span>
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-mono font-medium">Jupiter</p>
                <p className="text-[10px] font-mono text-muted-foreground">Connect Jupiter wallet</p>
              </div>
              {connecting && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </button>

            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-mono text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={() => setMethod("email")}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-mono font-medium">Email</p>
                <p className="text-[10px] font-mono text-muted-foreground">Sign in with email & password</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* Email form */}
        {method === "email" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase">email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary/50 border-border h-10 font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase">password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-secondary/50 border-border h-10 font-mono text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {isLogin ? "sign in" : "create account"}
              </button>
            </form>

            <p className="text-center text-[10px] font-mono text-muted-foreground mt-4">
              {isLogin ? "No account?" : "Already have one?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
                {isLogin ? "sign up" : "sign in"}
              </button>
            </p>

            <button
              onClick={() => setMethod(null)}
              className="w-full text-center text-[10px] font-mono text-muted-foreground hover:text-foreground mt-3 transition-colors"
            >
              ← other methods
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Auth;
