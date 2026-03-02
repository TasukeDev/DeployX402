import { useLocation, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import BrowseAgents from "@/pages/BrowseAgents";
import AgentDetail from "@/pages/AgentDetail";
import NotFound from "@/pages/NotFound";
import Docs from "@/pages/Docs";
import Leaderboard from "@/pages/Leaderboard";
import AgentPublicProfile from "@/pages/AgentPublicProfile";
import ApiDocs from "@/pages/ApiDocs";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/browse" element={<PageTransition><BrowseAgents /></PageTransition>} />
        <Route path="/agent/:id" element={<PageTransition><AgentDetail /></PageTransition>} />
        <Route path="/docs" element={<PageTransition><Docs /></PageTransition>} />
        <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
        <Route path="/agent/:id/public" element={<PageTransition><AgentPublicProfile /></PageTransition>} />
        <Route path="/api-docs" element={<PageTransition><ApiDocs /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
