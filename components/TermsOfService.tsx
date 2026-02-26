import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const TermsOfService: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold mb-8">
          <ArrowLeft size={20} /> Back to Home
        </button>
        
        <div className="flex items-center gap-3 mb-8">
          <FileText className="text-blue-600 w-10 h-10" />
          <h1 className="text-3xl md:text-4xl font-extrabold">Terms of Service</h1>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Last Updated: October 26, 2025
          </p>

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using YDTechPro, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Platform Usage</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be at least 18 years old to use this platform.</li>
              <li>You agree to provide accurate and complete information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Governance Fees</h2>
            <p>
              A non-refundable governance fee of ₹25 is required from both parties to unlock identities during a negotiation. This fee supports platform oversight and security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Prohibited Conduct</h2>
            <p>
              You agree not to engage in any activity that interferes with or disrupts the platform, including but not limited to fraud, spamming, or distributing malware.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Limitation of Liability</h2>
            <p>
              YDTechPro is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
