import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import LegalContent from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AutoTwin AI protects your financial and personal data.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <LegalContent title="Privacy Policy" lastUpdated="May 14, 2026">
        <p>
          Welcome to AutoTwin AI (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to protecting your privacy and ensuring the security of your financial and personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, including our website, dashboard, and integrations (Gmail, WhatsApp, etc.).
        </p>

        <h2>1. Information We Collect</h2>
        <h3>1.1 Personal Information</h3>
        <ul>
          <li><strong>Account Data:</strong> Name, email address, password, and profile information provided during registration.</li>
          <li><strong>Communication Data:</strong> Phone number (for WhatsApp integration) and any information you provide during interactions with our AI chatbot or support team.</li>
        </ul>

        <h3>1.2 Financial and Operational Data</h3>
        <ul>
          <li><strong>Financial Documents:</strong> Invoices, receipts, bills, and other financial documents you upload or that are ingested via connected accounts.</li>
          <li><strong>Transaction Data:</strong> Details of financial transactions extracted from documents or synced from integrated accounting software.</li>
          <li><strong>Gmail Data:</strong> If you connect your Gmail account, we access only the emails and attachments relevant to financial processing (e.g., invoices) as authorized by your scope selections.</li>
        </ul>

        <h3>1.3 Technical Data</h3>
        <ul>
          <li><strong>Usage Data:</strong> Log files, IP addresses, browser type, device information, and interaction data with our platform.</li>
          <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to enhance your experience and analyze platform performance.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the collected data for the following purposes:</p>
        <ul>
          <li><strong>AI Processing:</strong> To extract data from financial documents using our multi-modal vision models.</li>
          <li><strong>Financial Intelligence:</strong> To build your Financial Memory Graph, detect anomalies, predict risks, and provide budget insights.</li>
          <li><strong>Workflow Automation:</strong> To execute financial workflows, such as syncing data to Google Sheets or accounting software.</li>
          <li><strong>Communication:</strong> To send you alerts via email or WhatsApp and respond to your queries.</li>
          <li><strong>Security:</strong> To protect our platform from fraud, unauthorized access, and other security threats.</li>
        </ul>

        <h2>3. Data Sharing and Disclosure</h2>
        <p>We do not sell your personal or financial data. We may share information only in the following circumstances:</p>
        <ul>
          <li><strong>Service Providers:</strong> With trusted third-party vendors who assist us in operating our platform (e.g., cloud hosting, AI model providers like Google Gemini).</li>
          <li><strong>Integrations:</strong> With platforms you explicitly connect (e.g., Google Workspace, WhatsApp/Meta, QuickBooks).</li>
          <li><strong>Legal Requirements:</strong> If required by law, regulation, or legal process.</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition of our company.</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>We implement enterprise-grade security measures to protect your data:</p>
        <ul>
          <li><strong>Encryption:</strong> All data is encrypted in transit (SSL/TLS) and at rest.</li>
          <li><strong>Secure Vault:</strong> Financial documents are stored in a secure storage bucket with strict Access Control Lists (ACLs).</li>
          <li><strong>OAuth2:</strong> We use secure OAuth2 protocols for third-party integrations, ensuring we never store your passwords.</li>
        </ul>

        <h2>5. Your Rights and Choices</h2>
        <ul>
          <li><strong>Access and Correction:</strong> You can access and update your account information via the dashboard.</li>
          <li><strong>Data Deletion:</strong> You may request the deletion of your account and associated data at any time.</li>
          <li><strong>Integration Management:</strong> You can disconnect third-party integrations (Gmail, WhatsApp) at any time via the Settings page.</li>
          <li><strong>Marketing Opt-out:</strong> You can unsubscribe from marketing communications via the link in our emails.</li>
        </ul>

        <h2>6. International Data Transfers</h2>
        <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this policy.</p>

        <h2>7. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our platform and updating the &ldquo;Last Updated&rdquo; date.</p>

        <h2>8. Contact Us</h2>
        <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
        <p>
          <strong>Email:</strong>contact.pathank@gmail.com<br />
        </p>
      </LegalContent>
      <Footer />
    </>
  );
}
