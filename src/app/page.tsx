import Navbar from "@/components/navbar";
import HeroSection from "@/components/sections/hero-section";
import FeaturesSection from "@/components/sections/features-section";
import HowItWorksSection from "@/components/sections/how-it-works-section";
import DemoSection from "@/components/sections/demo-section";
import TrustSection from "@/components/sections/trust-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSection />
      <TrustSection />
      <Footer />
    </main>
  );
}
