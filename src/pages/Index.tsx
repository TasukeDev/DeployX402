import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import LeaderboardSection from "@/components/LeaderboardSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import FooterCTA from "@/components/FooterCTA";
import StickyBottomCTA from "@/components/StickyBottomCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <LeaderboardSection />
      <PricingSection />
      <FAQSection />
      <FooterCTA />
      <StickyBottomCTA />
    </div>
  );
};

export default Index;
