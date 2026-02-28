import { useNavigate } from "react-router-dom";
import { useWallet } from "@/components/WalletContext";
import { useAuth } from "@/components/AuthContext";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const StickyBottomCTA = () => {
  const { connected } = useWallet();
  const { authenticated } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("hero-section");
      const footer = document.querySelector("footer");
      if (!hero) return;
      const pastHero = window.scrollY > hero.offsetHeight * 0.6;
      const nearFooter = footer
        ? window.scrollY + window.innerHeight > footer.offsetTop - 40
        : false;
      setVisible(pastHero && !nearFooter);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    if (authenticated || connected) navigate("/dashboard");
    else navigate("/auth");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <button
            onClick={handleClick}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full glass-nav border-primary/20 text-xs font-mono text-primary hover:bg-primary/10 transition-colors glow-primary"
          >
            {authenticated || connected ? "Open Platform" : "Launch Platform"}
            <ArrowRight className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyBottomCTA;
