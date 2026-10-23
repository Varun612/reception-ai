import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-700 text-sm leading-relaxed">
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy & Health Information Handling</h1>
          <p className="text-xs text-slate-500 mt-2">Last Updated: October 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Data We Collect</h2>
          <p>
            ReceptionAI operates on the principle of data minimization. When a customer or patient uses your virtual receptionist, we collect only information necessary to schedule the appointment:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li>Customer Name, Email Address, and Phone Number</li>
            <li>Requested procedure or service</li>
            <li>Requested appointment timestamp</li>
            <li>Administrative questions (hours, insurance, directions)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. No Medical Records Storage in Booking Logs</h2>
          <p>
            We instruct the AI receptionist never to solicit medical histories, clinical records, or prescription details in routine booking conversations. Conversation logs are retained according to your tenant's retention policy and can be purged upon request.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Encryption & Multi-Tenant Boundaries</h2>
          <p>
            All data in transit is encrypted using TLS 1.3. Database records are isolated by tenant identifiers and protected by server-side query filters. No customer has access to another practice’s records.
          </p>
        </section>
      </div>
    </div>
  );
};
