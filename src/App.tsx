import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AnimatePresence>
            {showSplash && (
              <SplashScreen onComplete={() => setShowSplash(false)} />
            )}
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showSplash ? 0 : 1 }}
            transition={{ duration: 0.5 }}
          >
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </motion.div>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

export default App;
