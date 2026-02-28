import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhatIsSection from "@/components/WhatIsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import EcosystemSection from "@/components/EcosystemSection";
import FooterCTA from "@/components/FooterCTA";
import StickyBottomCTA from "@/components/StickyBottomCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <div className="divider-fade" />
      <WhatIsSection />
      <div className="divider-fade" />
      <HowItWorksSection />
      <div className="divider-fade" />
      <EcosystemSection />
      <StickyBottomCTA />
      <FooterCTA />
    </div>
  );
};

export default Index;
