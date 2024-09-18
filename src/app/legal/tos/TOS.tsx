import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen text-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="mb-4">
          Effective Date: September 17, 2024
        </p>

        <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing and using [Your SaaS Name], you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
        <p className="mb-4">
          We may update these Terms of Service from time to time. Your continued use of our services following any changes indicates your acceptance of the new terms.
        </p>

        <h2 className="text-2xl font-semibold mb-4">User Responsibilities</h2>
        <p className="mb-4">
          As a user of our services, you agree to:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>Provide accurate and complete information when required.</li>
          <li>Use our services only for lawful purposes and in accordance with applicable laws.</li>
          <li>Refrain from engaging in any activity that may harm or disrupt our services or infrastructure.</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">Account Security</h2>
        <p className="mb-4">
          You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. Notify us immediately if you suspect any unauthorized use of your account.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
        <p className="mb-4">
          All content and materials provided through our services are the property of [Your SaaS Name] or its licensors and are protected by intellectual property laws. You may not use, reproduce, or distribute any content without our prior written consent.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
        <p className="mb-4">
          To the maximum extent permitted by law, [Your SaaS Name] will not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Termination</h2>
        <p className="mb-4">
          We reserve the right to terminate or suspend your access to our services at our sole discretion, without prior notice, for any reason, including but not limited to a breach of these Terms of Service.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
        <p className="mb-4">
          These Terms of Service are governed by and construed in accordance with the laws of [Your Jurisdiction]. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of [Your Jurisdiction].
        </p>

        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <p className="mb-4">
          If you have any questions or concerns about these Terms of Service, please contact us at [contact@example.com].
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
