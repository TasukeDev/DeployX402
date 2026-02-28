import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        onAnimationComplete={(definition) => {
          // handled by parent timeout
        }}
      >
        {/* Orb backgrounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 orb-cyan rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 0.6, 0.3] }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 orb-purple rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 0.5, 0.25] }}
            transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Logo */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <motion.div
            className="glow-primary rounded-3xl"
            animate={{ boxShadow: [
              "0 0 30px -5px hsl(175 80% 50% / 0.0)",
              "0 0 60px -5px hsl(175 80% 50% / 0.5)",
              "0 0 30px -5px hsl(175 80% 50% / 0.2)",
            ]}}
            transition={{ duration: 2, delay: 0.8, ease: "easeInOut" }}
          >
            <img
              src="/logo.png"
              alt="LaunchPad"
              className="h-24 w-24 rounded-3xl"
            />
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.h1
          className="mt-8 text-3xl font-extrabold tracking-tight text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          Launch<span className="text-primary">Pad</span>
        </motion.h1>

        <motion.p
          className="mt-2 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          Deploy AI Agents Everywhere
        </motion.p>

        {/* Loading bar */}
        <motion.div
          className="mt-10 h-1 w-48 overflow-hidden rounded-full bg-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.3, duration: 1.5, ease: "easeInOut" }}
            onAnimationComplete={onComplete}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
