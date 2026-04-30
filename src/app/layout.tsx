import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autotwinai.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7c3aed",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AutoTwin AI – AI-Powered Financial Automation",
    template: "%s | AutoTwin AI",
  },
  description:
    "AutoTwin AI prevents financial mistakes before they happen. Automate invoice processing, detect risks with AI confidence scoring, and get intelligent financial insights.",
  keywords: [
    "AI financial automation",
    "invoice processing AI",
    "financial AI assistant",
    "automated invoice management",
    "AI accounts payable",
    "financial workflow automation",
    "Gmail invoice automation",
    "AI financial intelligence",
  ],
  authors: [{ name: "AutoTwin AI", url: siteUrl }],
  creator: "AutoTwin AI",
  publisher: "AutoTwin AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "AutoTwin AI",
    title: "AutoTwin AI – AI-Powered Financial Automation",
    description:
      "AutoTwin AI prevents financial mistakes before they happen. Automate invoice processing, detect risks with AI confidence scoring, and get intelligent financial insights.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoTwin AI – AI-Powered Financial Automation",
    description:
      "AutoTwin AI prevents financial mistakes before they happen. Automate invoice processing and get AI-powered financial intelligence.",
    creator: "@autotwinai",
    site: "@autotwinai",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
