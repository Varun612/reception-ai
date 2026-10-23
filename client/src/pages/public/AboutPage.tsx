import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  PhoneCall,
  CalendarCheck,
  ShieldCheck,
  Activity,
  Code2,
  ExternalLink,
  Layers,
  ArrowRight,
  Database,
  Mail,
  Smartphone,
  Cpu,
  Globe,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const liveServices = [
    {
      title: 'Call-to-Chat Visual Slot Picker',
      category: 'Patient Experience',
      badge: 'Live Service',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Smartphone,
      description:
        'Interactive mobile booking link texted to callers during or after an inquiry. Patients visually browse open dental chairs, select treatments, fill structured clinical details, and reserve slots with multi-click protection.',
      url: '/book-chat/apex-dental-spa',
      actionText: 'Open Live Slot Picker',
      isInternal: true,
    },
    {
      title: 'AI Phone Receptionist & Voice Studio',
      category: 'Telephony & Audio Engine',
      badge: 'Voice AI',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: PhoneCall,
      description:
        'Autonomous phone attendance engine with natural voice models (Nova, Alloy, Echo) and an in-browser microphone audio studio for clinic owners to record custom greetings.',
      url: '/dashboard/phone',
      actionText: 'Launch Voice Studio',
      isInternal: true,
      requiresLogin: true,
    },
    {
      title: 'Patient Telemetry & Interaction Analytics',
      category: 'Medical Vendor Insights',
      badge: 'Telemetry & Study',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Activity,
      description:
        'Vendor dashboard to study customer touchpoints, funnel drop-offs, device/browser metadata, and live counts of duplicate clicks prevented from hitting the server.',
      url: '/dashboard/telemetry',
      actionText: 'View Telemetry Dashboard',
      isInternal: true,
      requiresLogin: true,
    },
    {
      title: 'Embeddable Website Receptionist Widget',
      category: 'Turnkey Integration',
      badge: 'Embeddable',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Code2,
      description:
        'Stand-alone widget iframe and embed script (<script src="/widget.js">) allowing any dental clinic to embed an AI booking receptionist directly onto their existing website.',
      url: '/embed/apex-dental-spa',
      actionText: 'Test Embed Widget',
      isInternal: true,
    },
    {
      title: 'Zero-Hallucination Booking Sandbox',
      category: 'Clinical Guardrails',
      badge: 'Interactive Demo',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: CalendarCheck,
      description:
        'Test the deterministic tool-calling engine, price quoting, real calendar slot calculations, and dental emergency triage guardrails in real-time.',
      url: '/demo',
      actionText: 'Launch Live Demo',
      isInternal: true,
    },
    {
      title: 'Multi-Tenant Super-Admin Control Plane',
      category: 'Platform Operations',
      badge: 'Super-Admin',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: Layers,
      description:
        'Platform owner control center to monitor cross-tenant appointments, MRR subscriptions, system health, and global click deduplication telemetry.',
      url: '/admin',
      actionText: 'Access Admin Plane',
      isInternal: true,
      requiresLogin: true,
    },
    {
      title: 'GitHub Open Architecture Repository',
      category: 'Source Code & CI/CD',
      badge: 'Open Repository',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      icon: Database,
      description:
        'Full production codebase featuring Vite + React 19 frontend, Node Express backend, Prisma ORM schema, Render Blueprint specification, and automated test suites.',
      url: 'https://github.com/Varun612/reception-ai',
      actionText: 'View GitHub Repository',
      isInternal: false,
    },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* 1. Header Banner */}
      <section className="bg-mesh-purple border-b border-purple-100 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>About ReceptionAI • Enterprise Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto">
            Autonomous Reception & Appointment Booking for Healthcare
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ReceptionAI was engineered to solve the front-desk bottleneck for dental clinics and medical practices across the United States, United Kingdom, Canada, and Australia.
          </p>
        </div>
      </section>

      {/* 2. Live Services Directory & Direct URLs */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 pb-8 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Live Services & Interactive URLs
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Direct access links to test each component created in the ReceptionAI ecosystem.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 self-start">
            All Services Live & Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveServices.map((svc, idx) => {
            const Icon = svc.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${svc.badgeColor}`}>
                      {svc.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">{svc.category}</span>
                    <h3 className="font-bold text-base text-slate-900 mt-0.5 group-hover:text-purple-700 transition-colors">
                      {svc.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {svc.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {svc.isInternal ? (
                    <Link
                      to={svc.url}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>{svc.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <a
                      href={svc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>{svc.actionText}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {svc.requiresLogin && (
                    <p className="text-[10px] text-center text-slate-400">
                      Requires practice workspace authentication
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Core Architectural Principles */}
      <section className="bg-slate-50 py-16 sm:py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Healthcare Rigor
            </h2>
            <p className="text-sm text-slate-600">
              Generic chat widgets fail in medical practices due to hallucination, double bookings, and clinical risks. ReceptionAI was built with zero compromise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Zero Hallucination</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The AI model never invents appointment slots. Every availability lookup executes against transactional database tools with concurrency locks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Multi-Click Protection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                In-flight locking and server-side idempotency middleware intercept rapid repetitive clicks, preventing multiple requests from straining server capacity.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Dual Confirmations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every committed booking dispatches an instant SMS confirmation to the patient's phone and a calendar email receipt with location and preparation guidelines.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Multi-Tenant Isolation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Each clinic workspace is cryptographically isolated in database queries, ensuring patient records and appointments are strictly private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Ready to Get Started Call to Action */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-purple-900 to-indigo-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Deploy an AI Receptionist for Your Practice
          </h2>
          <p className="text-sm sm:text-base text-purple-200 max-w-xl mx-auto">
            Set up your clinic profile, configure your receptionist voice, and start accepting automated bookings in under 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-purple-900 font-bold text-xs hover:bg-purple-50 transition-colors shadow-lg"
            >
              Start Free 14-Day Trial
            </Link>
            <Link
              to="/demo"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-800/80 hover:bg-purple-800 text-white font-bold text-xs border border-purple-700 transition-colors"
            >
              Try Interactive Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
