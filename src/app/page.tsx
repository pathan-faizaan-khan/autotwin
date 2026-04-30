import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import HeroSection from "@/components/sections/hero-section";
import FeaturesSection from "@/components/sections/features-section";
import HowItWorksSection from "@/components/sections/how-it-works-section";
import DemoSection from "@/components/sections/demo-section";
import TrustSection from "@/components/sections/trust-section";
import Footer from "@/components/footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autotwinai.com";

export const metadata: Metadata = {
  title: "AutoTwin AI – AI-Powered Financial Automation",
  description:
    "AutoTwin AI prevents financial mistakes before they happen. Automate invoice processing, detect risks with AI confidence scoring, and get intelligent financial insights.",
  alternates: { canonical: "/" },
  openGraph: { url: siteUrl },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "AutoTwin AI",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/favicon.ico`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "AutoTwin AI",
      description:
        "AI-powered financial automation that prevents mistakes before they happen.",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: "AutoTwin AI",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "FinancialApplication",
      description:
        "AutoTwin AI automates financial workflows by processing invoices from Gmail, detecting risks with AI confidence scoring, and providing intelligent financial insights.",
      url: siteUrl,
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free trial available",
      },
      featureList: [
        "AI Invoice Processing",
        "Gmail Integration",
        "Risk Prevention",
        "Financial Analytics",
        "WhatsApp Alerts",
        "Confidence-Aware AI",
      ],
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
