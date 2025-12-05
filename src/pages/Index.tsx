import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import DoctorsSection from "@/components/DoctorsSection";
import PharmacySection from "@/components/PharmacySection";
import AIAssistantSection from "@/components/AIAssistantSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ServicesSection />
        <DoctorsSection />
        <PharmacySection />
        <AIAssistantSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
