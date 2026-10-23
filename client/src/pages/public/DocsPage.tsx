import React from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  FileCode,
  ShieldCheck,
  PhoneCall,
  Terminal,
  ExternalLink,
  BookOpen,
  Copy,
} from 'lucide-react';

export const DocsPage: React.FC = () => {
  const sampleSnippet = `<script 
  src="https://app.receptionai.com/widget.js" 
  data-tenant="YOUR_TENANT_SLUG" 
  async>
</script>`;

  return (
    <div className="bg-white py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer & Practice Documentation</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            ReceptionAI Documentation & Integration Guide
          </h1>
          <p className="text-slate-600 text-base">
            Everything you need to embed your AI receptionist, synchronize external calendars, or query our REST APIs.
          </p>
        </div>

        {/* 1. Embed Widget Guide */}
        <section className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Website Chat Widget Embed</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every business receives its own isolated chat receptionist. To embed the widget on your practice website (HTML, WordPress, Squarespace, Webflow, or Shopify), copy and paste this snippet right before the closing <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> tag:
          </p>

          <div className="bg-slate-900 rounded-2xl p-6 text-slate-200 text-xs font-mono relative overflow-hidden">
            <pre className="text-purple-300">{sampleSnippet}</pre>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
            <strong>Customization:</strong> You can configure launcher position (bottom-right vs bottom-left), brand color palette, agent avatar, and initial greeting directly in your Clinic Dashboard under <strong>Website Widget</strong> without modifying code!
          </div>
        </section>

        {/* 2. REST API & Webhooks */}
        <section className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">REST API & Webhooks</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            All endpoints require HTTPS and Bearer JWT authentication (except public widget endpoints).
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Method</th>
                  <th className="p-3">Endpoint</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-mono font-bold text-blue-600">POST</td>
                  <td className="p-3 font-mono">/api/auth/login</td>
                  <td className="p-3 text-slate-600">Authenticate user and obtain JWT token</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-emerald-600">GET</td>
                  <td className="p-3 font-mono">/api/tenants/:tenantId/appointments</td>
                  <td className="p-3 text-slate-600">List appointments with status & date filters</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-blue-600">POST</td>
                  <td className="p-3 font-mono">/api/widget/:slug/chat</td>
                  <td className="p-3 text-slate-600">Process user message through Tool-Calling Agent</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-emerald-600">GET</td>
                  <td className="p-3 font-mono">/api/widget/:slug/availability</td>
                  <td className="p-3 text-slate-600">Calculate real available slots for service and date</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-blue-600">POST</td>
                  <td className="p-3 font-mono">/api/billing/webhook</td>
                  <td className="p-3 text-slate-600">Stripe payment & subscription event receiver</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Safety, Healthcare & HIPAA Roadmap */}
        <section id="hipaa" className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Healthcare Safety & HIPAA Framework</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            ReceptionAI is engineered for administrative scheduling and inquiry triage. We implement strict healthcare safety controls:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-700 leading-relaxed">
            <li><strong>Minimal Patient Data:</strong> The AI collects only standard booking demographics (name, email, phone number, and appointment reason). It does not solicit medical histories or sensitive health files in routine booking conversations.</li>
            <li><strong>Refusal of Diagnostic Advice:</strong> Built-in safety classifiers immediately intercept requests for diagnoses, medications, or treatment evaluations.</li>
            <li><strong>Emergency Redirection:</strong> Acute symptoms (breathing impairment, severe facial swelling, trauma) immediately trigger a clinic emergency hotline or 911 recommendation.</li>
            <li><strong>HIPAA BAA Availability:</strong> For Pro Enterprise tier customers in the United States handling Protected Health Information (PHI), Business Associate Agreements (BAAs) and dedicated audit logging are available.</li>
          </ul>
        </section>

        {/* 4. AI Voice Receptionist Module Architecture */}
        <section className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">AI Phone Receptionist (Telephony Module)</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            The platform architecture abstracts the conversational engine from the presentation layer. Phone calls are managed via an adapter interface supporting Twilio Voice Webhooks and WebSockets:
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2">
            <p>1. Inbound telephone call routes to Twilio SIP or Media Streams.</p>
            <p>2. Speech-to-Text (STT) streams transcription to the ReceptionAI Agent Engine.</p>
            <p>3. The same deterministic tools (<code className="text-purple-700">check_availability</code>, <code className="text-purple-700">create_appointment</code>) query the database live.</p>
            <p>4. Text-to-Speech (TTS) synthesizes human-like voice responses with zero audio lag.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
