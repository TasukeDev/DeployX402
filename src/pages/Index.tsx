import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import DeveloperSection from "@/components/DeveloperSection";
import IntegrationsSection from "@/components/IntegrationsSection";
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
      <DeveloperSection />
      <IntegrationsSection />
      <PricingSection />
      <FAQSection />
      <FooterCTA />
      <StickyBottomCTA />
    </div>
  );
};

export default Index;
