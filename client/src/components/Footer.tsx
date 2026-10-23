import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, HeartHandshake, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Reception<span className="text-purple-400">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Autonomous AI receptionists and appointment booking agents for dental clinics and modern healthcare practices.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>Operating in US, UK, Canada & Australia</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About & Live Services</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">Features & Tool Agent</Link></li>
              <li><Link to="/industries" className="hover:text-white transition-colors">Dental Clinic Template</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Subscription Pricing</Link></li>
              <li><Link to="/demo" className="hover:text-white transition-colors">Interactive Live Demo</Link></li>
              <li><Link to="/docs" className="hover:text-white transition-colors">Embed Widget Snippet</Link></li>
            </ul>
          </div>

          {/* Compliance & Safety */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Safety & Compliance</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero Hallucination Database Tool Architecture</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Strict Dental Diagnosis Refusal Guardrails</span>
              </li>
              <li className="flex items-start gap-2">
                <HeartHandshake className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>Urgent Emergency Triage & Human Handoff</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Multi-Tenant Data Isolation by Design</span>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy & PHI Notice</Link></li>
              <li><Link to="/docs#hipaa" className="hover:text-white transition-colors">HIPAA Compliance Roadmap</Link></li>
              <li><Link to="/docs#security" className="hover:text-white transition-colors">Security Whitepaper</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ReceptionAI Inc. All rights reserved.</p>
          <p className="mt-2 md:mt-0 text-slate-500">
            Designed for professional dental and medical practices across North America, UK, and APAC.
          </p>
        </div>
      </div>
    </footer>
  );
};
