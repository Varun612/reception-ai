import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      code: 'starter',
      name: 'Starter',
      price: annual ? 39 : 49,
      desc: 'Single-location clinics needing automated website reception and booking.',
      conversations: '250',
      staff: '3',
      features: [
        'Website AI Chat Receptionist',
        'Direct Database Slot Booking',
        '250 Monthly Conversations',
        'Up to 3 Staff Members',
        'Automated Email Confirmations',
        'Standard Dental Safety Guardrails',
        'Single Location Workspace',
      ],
      popular: false,
    },
    {
      code: 'growth',
      name: 'Growth',
      price: annual ? 79 : 99,
      desc: 'Growing practices needing calendar synchronization and customized agent personas.',
      conversations: '1,000',
      staff: '10',
      features: [
        'Everything in Starter',
        '1,000 Monthly Conversations',
        'Up to 10 Staff Members',
        'Google Calendar Two-Way Sync',
        'SMS Reminder Infrastructure',
        'Custom Agent Tone & Voice',
        'Dedicated Knowledge Documents (FAQs)',
        'Human Escalation Routing Inbox',
      ],
      popular: true,
    },
    {
      code: 'pro',
      name: 'Pro Enterprise',
      price: annual ? 159 : 199,
      desc: 'Multi-doctor practices and high-volume clinics with priority routing.',
      conversations: '3,500',
      staff: '30',
      features: [
        'Everything in Growth',
        '3,500 Monthly Conversations',
        'Up to 30 Staff Members',
        'AI Voice Receptionist Telephony Module',
        'Priority SLA Support',
        'Multi-location Routing',
        'Healthcare Administrative Security & Audit Safeguards (BAA Ready)',
        'Custom API & Webhook Integrations',
      ],
      popular: false,
    },
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clear, Predictable SaaS Subscriptions</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Plans that pay for themselves with a single booking.
          </h1>
          <p className="text-slate-600 text-lg">
            One new dental patient is typically worth $800 to $1,500 in lifetime value. Capture lost calls and inquiries starting at $49/mo.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${!annual ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative w-12 h-6 bg-purple-700 rounded-full p-1 transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${annual ? 'translate-x-6' : 'translate-x-0'}`}
              ></div>
            </button>
            <span className={`text-sm font-semibold ${annual ? 'text-slate-900' : 'text-slate-500'}`}>
              Annual <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => (
            <div
              key={p.code}
              className={`rounded-2xl p-8 flex flex-col justify-between transition-all ${
                p.popular
                  ? 'bg-purple-900 text-white border-2 border-purple-500 shadow-xl relative'
                  : 'bg-white border border-slate-200 text-slate-900 shadow-sm hover:shadow-soft'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-400 to-indigo-400 text-slate-950 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full">
                  Recommended for Clinics
                </div>
              )}
              <div>
                <h3 className={`text-xl font-bold ${p.popular ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
                <p className={`text-xs mt-1 ${p.popular ? 'text-purple-200' : 'text-slate-500'}`}>{p.desc}</p>
                <div className="mt-6 flex items-baseline">
                  <span className={`text-4xl font-extrabold ${p.popular ? 'text-white' : 'text-slate-900'}`}>
                    ${p.price}
                  </span>
                  <span className={`text-sm ml-1 ${p.popular ? 'text-purple-200' : 'text-slate-500'}`}>
                    / month {annual && '(billed annually)'}
                  </span>
                </div>

                <ul className={`mt-8 space-y-3 text-xs border-t pt-6 ${p.popular ? 'border-purple-800 text-purple-100' : 'border-slate-100 text-slate-600'}`}>
                  {p.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${p.popular ? 'text-purple-300' : 'text-purple-600'}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  to="/register"
                  className={`w-full block text-center py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${
                    p.popular
                      ? 'bg-white text-purple-900 hover:bg-purple-50'
                      : 'bg-purple-700 text-white hover:bg-purple-800'
                  }`}
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
