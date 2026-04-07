import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "AutoTwin AI – Confidence-Aware Financial Intelligence System",
  description: "AI that prevents financial mistakes before they happen. AutoTwin AI understands messy financial data, predicts risks, and takes action.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
