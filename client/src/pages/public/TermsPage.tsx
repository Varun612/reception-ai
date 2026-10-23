import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-700 text-sm leading-relaxed">
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
          <p className="text-xs text-slate-500 mt-2">Last Updated: October 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By subscribing to, creating an account on, or embedding the ReceptionAI platform ("Service"), you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a clinic or business, you represent that you have the authority to bind that entity.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. Medical and Clinical Disclaimer</h2>
          <p className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium">
            <strong>CRITICAL NOTICE:</strong> ReceptionAI is an administrative scheduling and inquiry triage tool. It is NOT a medical device, licensed medical professional, or clinical diagnostic system. It does not diagnose dental or medical conditions, prescribe drugs, or deliver medical care.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Subscription, Quotas & Billing</h2>
          <p>
            Subscriptions are billed monthly or annually in advance. Each tier includes a specific monthly quota of conversations and staff seats. Usage exceeding plan limits may be throttled or billed at published overage rates. You may cancel your subscription at any time via your dashboard.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">4. Multi-Tenant Isolation & Customer Data</h2>
          <p>
            ReceptionAI maintains strict tenant data isolation. We do not sell your customer or patient data. You retain ownership of all business profile details, service descriptions, and appointment records.
          </p>
        </section>
      </div>
    </div>
  );
};
