import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthContext";
import { WalletProvider } from "@/components/WalletContext";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BrowseAgents from "./pages/BrowseAgents";
import AgentDetail from "./pages/AgentDetail";
import NotFound from "./pages/NotFound";
import Docs from "./pages/Docs";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <WalletProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AnimatePresence mode="wait">
              {showSplash ? (
                <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
              ) : null}
            </AnimatePresence>
            {!showSplash && (
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/browse" element={<BrowseAgents />} />
                  <Route path="/agent/:id" element={<AgentDetail />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            )}
          </TooltipProvider>
        </QueryClientProvider>
      </WalletProvider>
    </AuthProvider>
  );
};

export default App;
