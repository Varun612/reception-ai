import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Smile,
  Sparkles,
  HeartPulse,
  Scale,
  Scissors,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const IndustriesPage: React.FC = () => {
  const industries = [
    {
      icon: Smile,
      name: 'Dental Practices & Orthodontics',
      tag: 'Flagship Template',
      desc: 'General dental clinics, cosmetic dentistry, orthodontists, and pediatric practices.',
      features: [
        'Routine cleaning and hygiene slot rules',
        'Multi-operatory and multi-dentist chair allocation',
        'Clinical triage rules (severe toothache vs trauma)',
        'Dental insurance in-network answering',
      ],
      linkText: 'Explore Dental Template',
    },
    {
      icon: HeartPulse,
      name: 'Medical & Specialty Clinics',
      tag: 'Ready to Deploy',
      desc: 'Physical therapy, chiropractic, dermatology, and general outpatient practices.',
      features: [
        'New patient intake questionnaire collection',
        'Referral and insurance policy explanations',
        'Provider buffer times between procedures',
        'Strict HIPAA-conscious non-diagnostic safety rules',
      ],
      linkText: 'Explore Medical Template',
    },
    {
      icon: Scissors,
      name: 'MedSpas & Aesthetic Clinics',
      tag: 'Ready to Deploy',
      desc: 'Medical spas, laser clinics, injectables, and high-end wellness studios.',
      features: [
        'Consultation deposit collection rules',
        'Treatment contraindication screening questions',
        'Staff specialist room assignments',
        'Package and pricing inquiry handling',
      ],
      linkText: 'Explore MedSpa Template',
    },
    {
      icon: Scale,
      name: 'Legal & Professional Advisory',
      tag: 'Expansion Module',
      desc: 'Law firms, accounting practices, and financial advisory consultancies.',
      features: [
        'Initial consultation fee quoting',
        'Conflict of interest pre-qualification questions',
        'Partner vs associate calendar booking',
        'Document requirement reminders',
      ],
      linkText: 'Explore Advisory Template',
    },
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Vertical AI Solutions</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Tailored for high-trust, appointment-based businesses.
          </h1>
          <p className="text-slate-600 text-lg">
            Every industry has unique scheduling rules, staff requirements, and safety policies. ReceptionAI comes with turnkey vertical templates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {industries.map((ind, i) => {
            const Icon = ind.icon;
            return (
              <div
                key={i}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col justify-between hover:shadow-soft transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full">
                      {ind.tag}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{ind.name}</h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">{ind.desc}</p>

                  <div className="space-y-2.5 border-t border-slate-200/80 pt-6">
                    {ind.features.map((feat, fidx) => (
                      <div key={fidx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    to="/register"
                    className="inline-flex items-center space-x-2 text-sm font-bold text-purple-700 hover:text-purple-800 transition-colors"
                  >
                    <span>Launch with {ind.name.split(' ')[0]} Template</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
