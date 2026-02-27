import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FallbackAuthProvider } from "@/components/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || "cmm5azso800ie0cl4ina2swlj";
const isPrivyConfigured = PRIVY_APP_ID.length > 5 && PRIVY_APP_ID.startsWith("cl");

const InnerApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const App = () => {
  if (isPrivyConfigured) {
    // Dynamic import to avoid loading Privy when not configured
    const { PrivyProvider } = require("@privy-io/react-auth");
    const { PrivyAuthBridge } = require("@/components/AuthContext");

    return (
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          appearance: { theme: "dark", accentColor: "#2dd4bf" },
          loginMethods: ["email", "wallet", "google"],
        }}
      >
        <PrivyAuthBridge>
          <InnerApp />
        </PrivyAuthBridge>
      </PrivyProvider>
    );
  }

  return (
    <FallbackAuthProvider>
      <InnerApp />
    </FallbackAuthProvider>
  );
};

export default App;
