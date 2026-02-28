import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const StickyBottomCTA = () => {
  const { login, authenticated } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.8;
      const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 300;
      setVisible(pastHero && !nearBottom);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCTA = () => {
    if (authenticated) {
      navigate("/dashboard");
    } else {
      login();
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-xl"
        >
          <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground hidden sm:block">
              Build & deploy AI agents from your browser — no setup needed.
            </p>
            <Button
              size="sm"
              onClick={handleCTA}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-6 font-semibold ml-auto"
            >
              Start Building Free <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyBottomCTA;
