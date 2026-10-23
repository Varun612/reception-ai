import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  CalendarCheck,
  ShieldCheck,
  Cpu,
  Layers,
  PhoneCall,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const featureList = [
    {
      icon: Cpu,
      title: 'Deterministic Tool-Calling Architecture',
      desc: 'The AI never guesses or hallucinates appointments. All booking availability, doctor schedules, and confirmations are queried and committed through server-validated database tools.',
    },
    {
      icon: Lock,
      title: 'Multi-Tenant Data Isolation',
      desc: 'Strict tenant boundaries enforced at database and server levels. Patient records, clinic policies, and audit logs are physically isolated and never leak across clinics.',
    },
    {
      icon: ShieldCheck,
      title: 'Clinical Safety & Dental Guardrails',
      desc: 'Specialized safety filters prevent unlawful medical diagnoses or drug prescriptions. Directs acute emergencies (severe trauma, airway obstruction) immediately to emergency protocols.',
    },
    {
      icon: CalendarCheck,
      title: 'Zero Double-Booking Concurrency',
      desc: 'Transactional locks guarantee that when two patients attempt to book the same slot at the exact same second, only the first succeeds while the second receives an alternative recommendation.',
    },
    {
      icon: Bot,
      title: 'Configurable Agent Personas',
      desc: 'Customize your receptionist’s name, communication tone (Friendly, Professional, or Formal), greeting message, allowed topics, and escalation rules in seconds.',
    },
    {
      icon: PhoneCall,
      title: 'Ready for AI Voice Telephony',
      desc: 'Architected with a clean adapter layer ready for Twilio and telephony providers, allowing seamless expansion from web chat to phone receptionist.',
    },
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Capabilities</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Engineered for reliability, safety, and conversion.
          </h1>
          <p className="text-slate-600 text-lg">
            A production-ready AI agent platform built from the ground up to handle real customer bookings without technical headaches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 hover:shadow-soft transition-all space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Technical Architecture Deep Dive */}
        <div className="mt-20 bg-slate-900 rounded-3xl p-8 sm:p-12 text-white">
          <div className="max-w-3xl">
            <h2 className="text-xs uppercase font-mono tracking-widest text-purple-400 mb-2">Technical Core</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-4">
              How the Tool-Calling Agent Prevents Hallucinations
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Many SaaS chatbots fail because they treat booking as text generation. In ReceptionAI, when a user says "Book me for Tuesday at 10 AM", the language model produces an execution plan targeting our verified backend tool <code className="bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded text-xs">create_appointment</code>. The backend verifies tenant ownership, validates operating hours, calculates buffer times, locks the database row, and only returns confirmation once committed.
            </p>
            <Link
              to="/demo"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all"
            >
              <span>See It in Action in the Live Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
