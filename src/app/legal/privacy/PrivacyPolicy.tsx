import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen text-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="mb-4">
          Effective Date: September 17, 2024
        </p>

        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          Welcome to [Your SaaS Name]! This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this policy carefully.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
        <p className="mb-4">
          We may collect information about you in a variety of ways. The information we may collect includes:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>Personal Data: Personally identifiable information, such as your name, email address, and contact details.</li>
          <li>Usage Data: Information about your interactions with our services, such as your IP address, browser type, and pages visited.</li>
          <li>Transactional Data: Information about transactions you make through our services.</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
        <p className="mb-4">
          We use the information we collect to:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>Provide, operate, and maintain our services.</li>
          <li>Improve, personalize, and expand our services.</li>
          <li>Communicate with you, including sending updates, marketing, and promotional materials.</li>
          <li>Process transactions and manage your orders.</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">How We Protect Your Information</h2>
        <p className="mb-4">
          We implement a variety of security measures to maintain the safety of your personal information. These measures include encryption, secure servers, and regular security assessments.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Sharing Your Information</h2>
        <p className="mb-4">
          We may share your information with third parties in the following situations:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>With service providers who assist us in providing and improving our services.</li>
          <li>To comply with legal obligations or respond to legal requests.</li>
          <li>In connection with a merger, acquisition, or sale of all or a portion of our business.</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">Your Choices</h2>
        <p className="mb-4">
          You have the right to access, correct, or delete your personal information. You can also opt-out of receiving marketing communications from us at any time.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on our website.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this Privacy Policy or our data practices, please contact us at [contact@example.com].
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
