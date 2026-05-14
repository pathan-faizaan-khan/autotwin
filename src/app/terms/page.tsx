import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import LegalContent from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and conditions for using the AutoTwin AI platform.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <LegalContent title="Terms and Conditions" lastUpdated="May 14, 2026">
        <p>
          Please read these Terms and Conditions (&ldquo;Terms&rdquo;) carefully before using the AutoTwin AI platform (&ldquo;Service&rdquo;) operated by AutoTwin AI (&ldquo;us,&rdquo; &ldquo;we,&rdquo; or &ldquo;our&rdquo;).
        </p>
        <p>
          By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
        </p>

        <h2>1. Description of Service</h2>
        <p>
          AutoTwin AI is a confidence-aware financial intelligence platform that utilizes artificial intelligence to process financial documents, automate workflows, and provide predictive insights.
        </p>

        <h2>2. Accounts and Registration</h2>
        <ul>
          <li>You must provide accurate and complete information when creating an account.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You must notify us immediately of any unauthorized use of your account.</li>
          <li>We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion.</li>
        </ul>

        <h2>3. Use of AI and Accuracy</h2>
        <ul>
          <li><strong>Nature of AI:</strong> You acknowledge that our Service uses advanced artificial intelligence models (including Google Gemini) to process data. While we strive for high accuracy, AI outputs may contain errors or omissions.</li>
          <li><strong>Confidence Engine:</strong> Our platform provides confidence scores for processed data. You are responsible for reviewing data with low confidence scores.</li>
          <li><strong>Decision Responsibility:</strong> All financial decisions, approvals, and actions taken based on Service outputs are your sole responsibility. We are not a financial advisor or a licensed accounting firm.</li>
        </ul>

        <h2>4. User Obligations and Prohibited Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any illegal purpose.</li>
          <li>Upload fraudulent or malicious documents.</li>
          <li>Attempt to gain unauthorized access to our systems or other users&apos; data.</li>
          <li>Reverse engineer or attempt to extract the source code of our AI models.</li>
          <li>Use the Service to build a competing product.</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <ul>
          <li>The Service and its original content, features, and functionality are and will remain the exclusive property of AutoTwin AI and its licensors.</li>
          <li>Your data (uploaded documents, etc.) remains your property. By using the Service, you grant us a limited license to process your data for the purpose of providing and improving the Service.</li>
        </ul>

        <h2>6. Integrations and Third-Party Services</h2>
        <ul>
          <li>Our Service integrates with third-party platforms (e.g., Google Gmail, WhatsApp, QuickBooks).</li>
          <li>Your use of these integrations is subject to the terms and conditions of those third parties.</li>
          <li>We are not responsible for any issues arising from third-party services or data breaches on their platforms.</li>
        </ul>

        <h2>7. Fees and Payments</h2>
        <ul>
          <li>Some features of the Service require a paid subscription.</li>
          <li>Fees are non-refundable unless otherwise stated or required by law.</li>
          <li>We reserve the right to change our pricing upon notice to you.</li>
        </ul>

        <h2>8. Limitation of Liability</h2>
        <p>
          In no event shall AutoTwin AI, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul>
          <li>Your use or inability to use the Service.</li>
          <li>Any errors or inaccuracies in the AI-generated outputs.</li>
          <li>Unauthorized access to your data.</li>
          <li>Any conduct or content of any third party on the Service.</li>
        </ul>

        <h2>9. Disclaimer</h2>
        <p>
          Your use of the Service is at your sole risk. The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. We disclaim all warranties of any kind, whether express or implied.
        </p>

        <h2>10. Termination</h2>
        <p>
          We may terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction Placeholder], without regard to its conflict of law provisions.
        </p>

        <h2>12. Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us at:</p>
        <p>
          <strong>Email:</strong>contact.pathank@gmail.com<br />
        </p>
      </LegalContent>
      <Footer />
    </>
  );
}
