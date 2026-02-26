import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold mb-8">
          <ArrowLeft size={20} /> Back to Home
        </button>
        
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="text-blue-600 w-10 h-10" />
          <h1 className="text-3xl md:text-4xl font-extrabold">Privacy Policy</h1>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Effective Date: October 26, 2025
          </p>

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p>
              YDTechPro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Data:</strong> Name, email address, phone number, and billing information.</li>
              <li><strong>Transaction Data:</strong> Details about payments, quotes, and negotiations.</li>
              <li><strong>Usage Data:</strong> Information about how you use our website, including IP address and browser type.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Facilitate blind negotiations and secure transactions.</li>
              <li>Process payments and governance fees.</li>
              <li>Send real-time notifications and updates.</li>
              <li>Improve platform security and prevent fraud.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
            <p>
              We implement enterprise-grade security measures, including AES-256 encryption, to protect your personal information. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at <a href="mailto:privacy@ydtechpro.com" className="text-blue-600 hover:underline">privacy@ydtechpro.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
