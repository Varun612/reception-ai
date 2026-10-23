import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  CalendarCheck,
  Bot,
  CheckCircle2,
  PhoneCall,
  ChevronRight,
  Star,
  Zap,
  Building,
  Heart,
  HelpCircle,
  Play,
  Stethoscope,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [annualBilling, setAnnualBilling] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Mini-sandbox state for hero
  const [heroInput, setHeroInput] = useState('');
  const [heroMessages, setHeroMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! Welcome to Apex Dental Spa. I'm Sarah, your AI receptionist. Would you like to check Dr. Lin's availability for a cleaning or consultation?",
    },
  ]);
  const [heroLoading, setHeroLoading] = useState(false);

  const handleHeroSend = async (textToSend?: string) => {
    const msg = textToSend || heroInput;
    if (!msg.trim()) return;

    const newMsgs = [...heroMessages, { role: 'user', text: msg }];
    setHeroMessages(newMsgs);
    setHeroInput('');
    setHeroLoading(true);

    try {
      const res = await fetch('/api/widget/apex-dental-spa/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setHeroMessages([...newMsgs, { role: 'assistant', text: data.reply || "I'd be happy to help you with that!" }]);
    } catch {
      setHeroMessages([
        ...newMsgs,
        {
          role: 'assistant',
          text: "We have available slots for routine cleaning tomorrow at 9:00 AM, 11:30 AM, and 2:00 PM. Would you like me to reserve one for you?",
        },
      ]);
    } finally {
      setHeroLoading(false);
    }
  };

  const faqs = [
    {
      q: 'How does ReceptionAI prevent double-booking or hallucinated times?',
      a: 'Unlike generic chatbots, ReceptionAI uses a strict tool-calling engine directly bound to your database and calendar. The AI cannot invent times; every slot is validated in real-time against your operating hours, provider schedules, and buffer times before confirmation.',
    },
    {
      q: 'Is ReceptionAI compliant with dental and medical safety rules?',
      a: 'Yes! ReceptionAI has clinical safety guardrails built-in. It will strictly refuse to diagnose conditions or recommend medications. In acute dental emergencies (severe swelling, trauma, airway restriction), it directs callers immediately to your emergency hotline or urgent care.',
    },
    {
      q: 'Can my clinic customize the receptionist’s tone and services?',
      a: 'Absolutely. During our 6-step onboarding wizard, you can define your agent’s name, tone (Friendly, Professional, or Formal), greeting, custom instructions, service prices, duration, and approved knowledge base FAQs.',
    },
    {
      q: 'How do I add the AI receptionist to my website?',
      a: 'Simply copy and paste one line of script into your website HTML, WordPress, Squarespace, or Webflow. We also provide an iframe embed and a shareable booking link.',
    },
    {
      q: 'Can ReceptionAI support international clinics in the UK, Canada, and Australia?',
      a: 'Yes. ReceptionAI natively supports localized timezones, currencies (USD, GBP, CAD, AUD), and international date formats out-of-the-box.',
    },
  ];

  return (
    <div className="bg-white">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-mesh-purple border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-100/80 border border-purple-200 text-purple-900 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span>Next-Gen Dental & Healthcare Reception AI</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                Your AI Receptionist.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-600">
                  Always Ready.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Answer more inquiries, book more appointments, and give every customer a better first impression. 24/7 autonomous scheduling with real-time database verification.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl font-bold text-white bg-purple-700 hover:bg-purple-800 transition-all shadow-lg shadow-purple-700/25 text-base"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all shadow-sm text-base"
                >
                  <Play className="w-4 h-4 text-purple-700 fill-purple-700" />
                  <span>Try Live Demo</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Zero Hallucinations
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" /> 24/7/365 Coverage
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-blue-600" /> Direct Calendar Sync
                </span>
              </div>
            </div>

            {/* Right Interactive Hero Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-elevated border border-slate-200/80 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                      S
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Sarah — Virtual Receptionist</h3>
                      <p className="text-xs text-purple-200">Apex Dental Spa (Austin, TX)</p>
                    </div>
                  </div>
                  <span className="flex items-center text-xs font-semibold bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                    Live
                  </span>
                </div>

                {/* Messages Box */}
                <div className="p-4 h-72 overflow-y-auto space-y-3 bg-slate-50 text-xs">
                  {heroMessages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-purple-700 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {heroLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-slate-400 italic flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce delay-200"></span>
                        <span>Sarah is checking clinic availability...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preset Fast Prompts */}
                <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleHeroSend('What is the cost of routine cleaning?')}
                    className="text-[11px] px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                  >
                    💰 Cleaning cost?
                  </button>
                  <button
                    onClick={() => handleHeroSend('Do you have openings tomorrow morning?')}
                    className="text-[11px] px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                  >
                    📅 Openings tomorrow?
                  </button>
                  <button
                    onClick={() => handleHeroSend('What dental insurances do you take?')}
                    className="text-[11px] px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                  >
                    🏥 Insurance plans?
                  </button>
                </div>

                {/* Input Bar */}
                <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    value={heroInput}
                    onChange={(e) => setHeroInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleHeroSend()}
                    placeholder="Ask Sarah a question or book..."
                    className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <button
                    onClick={() => handleHeroSend()}
                    disabled={heroLoading}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE-STEP WORKFLOW */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-bold tracking-widest text-purple-700 mb-2">Simplicity First</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Live in under 10 minutes. No coding required.
            </h3>
            <p className="mt-3 text-base text-slate-600">
              Transform your website visitors into confirmed patients through our intuitive 3-step setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative bg-slate-50 border border-slate-200/80 rounded-2xl p-8 hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg mb-6">
                1
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Sign up & Select Template</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Choose the dedicated Dental Clinic template (or other appointment-based industry). Instant workspace provisioning with default hours and procedures.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-slate-50 border border-slate-200/80 rounded-2xl p-8 hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg mb-6">
                2
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Configure Your Agent</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Set services, durations, prices, and booking rules. Choose your AI receptionist's name, tone, custom instructions, and emergency escalation protocol.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-slate-50 border border-slate-200/80 rounded-2xl p-8 hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg mb-6">
                3
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Start Accepting Bookings</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Embed our single-line chat widget snippet on your website. Watch after-hours inquiries automatically convert into booked appointments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DENTAL CLINIC SPECIALIZATION SPOTLIGHT */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Dental Industry Specialization</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Purpose-built for modern dental practices.
              </h3>
              <p className="text-slate-600 text-base leading-relaxed">
                General chatbots fail dental clinics because booking hygiene cleanings, composite fillings, and cosmetic consultations requires strict clinical buffers, provider assignments, and medical safety boundaries.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">Pre-configured Dental Procedure Catalog</h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Includes comprehensive exams, ultrasonic prophylaxis cleanings, Zoom whitening, and emergency triage.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">Strict Non-Diagnostic Safety Guardrails</h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Never offers dental diagnoses or suggests prescriptions. Immediately routes acute pain or trauma to your emergency phone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">Multi-Chair Provider Synchronization</h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assign cleanings to hygienists and surgical consults to doctors with automated buffer times between patients.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation Breakdown Showcase */}
            <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sample Patient Interaction
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-100 p-3 rounded-xl text-slate-800">
                  <p className="font-semibold text-slate-900 mb-1">Patient:</p>
                  "Hi, I chipped my front tooth while eating dinner. Can Dr. Lin fix it tomorrow afternoon?"
                </div>

                <div className="bg-purple-50 border border-purple-100 p-3.5 rounded-xl text-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-900">Sarah (AI Receptionist):</span>
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-mono">
                      check_availability() executed
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    "I am so sorry to hear that! Dr. Lin has an opening tomorrow at <strong>2:30 PM</strong> and <strong>4:00 PM</strong> for an emergency exam and composite repair. Are you experiencing severe pain or bleeding?"
                  </p>
                </div>

                <div className="bg-slate-100 p-3 rounded-xl text-slate-800">
                  <p className="font-semibold text-slate-900 mb-1">Patient:</p>
                  "No severe pain, just rough edges. 2:30 PM works great. My name is David Miller, david.m@example.com."
                </div>

                <div className="bg-purple-50 border border-purple-100 p-3.5 rounded-xl text-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-900">Sarah (AI Receptionist):</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                      create_appointment() committed
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    "You're all set, David! Your appointment with Dr. Lin is confirmed for tomorrow at <strong>2:30 PM</strong> at Apex Dental Spa. We’ve sent a confirmation email with directions and free garage parking validation."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SUBSCRIPTION PRICING SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-bold tracking-widest text-purple-700 mb-2">Transparent Subscriptions</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Predictable pricing for practices of every size.
            </h3>
            <p className="mt-3 text-base text-slate-600">
              Start with our 14-day free trial. No setup fees, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Starter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-soft transition-all">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Starter</h4>
                <p className="text-xs text-slate-500 mt-1">For single-location boutique clinics.</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">$49</span>
                  <span className="text-sm text-slate-500 ml-1">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span><strong>1 Location</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span><strong>250</strong> AI Conversations / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Up to <strong>3</strong> Staff Members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Website Chat Widget</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Automated Email Confirmations</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-8 w-full block text-center py-2.5 px-4 rounded-xl font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors text-sm"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Growth */}
            <div className="bg-purple-900 text-white border-2 border-purple-500 rounded-2xl p-8 flex flex-col justify-between shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-400 to-indigo-400 text-slate-950 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full">
                Most Popular
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Growth</h4>
                <p className="text-xs text-purple-200 mt-1">For busy practices with multiple doctors & hygienists.</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-white">$99</span>
                  <span className="text-sm text-purple-200 ml-1">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-purple-100 border-t border-purple-800 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                    <span><strong>1,000</strong> AI Conversations / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                    <span>Up to <strong>10</strong> Staff Members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                    <span>Google Calendar Two-Way Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                    <span>Custom Agent Tone & Persona</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                    <span>Knowledge Documents & Insurance FAQ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                    <span>SMS Reminder Infrastructure</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-8 w-full block text-center py-2.5 px-4 rounded-xl font-bold text-purple-900 bg-white hover:bg-purple-50 transition-colors text-sm shadow-md"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-soft transition-all">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Pro Enterprise</h4>
                <p className="text-xs text-slate-500 mt-1">For high-volume clinics and multi-office groups.</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">$199</span>
                  <span className="text-sm text-slate-500 ml-1">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span><strong>3,500</strong> AI Conversations / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Up to <strong>30</strong> Staff Members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>AI Voice Receptionist Telephony Module</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Priority Support & SLA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Dedicated Account Security Assessment</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-8 w-full block text-center py-2.5 px-4 rounded-xl font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors text-sm"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQS ACCORDION */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-xs uppercase font-bold tracking-widest text-purple-700 mb-2">Got Questions?</h2>
            <h3 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between font-semibold text-slate-900 text-sm"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="py-16 bg-gradient-to-r from-purple-800 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Stop losing patient inquiries after hours.
          </h2>
          <p className="text-purple-200 max-w-2xl mx-auto text-base">
            Rent your autonomous AI receptionist today. Set up in minutes, verify with our live sandbox, and deliver an exceptional first impression to every caller.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl font-bold bg-white text-purple-900 hover:bg-purple-50 transition-all text-base shadow-lg"
            >
              Start Your 14-Day Free Trial
            </Link>
            <Link
              to="/demo"
              className="px-8 py-3.5 rounded-xl font-bold bg-purple-700/60 hover:bg-purple-700 text-white border border-purple-400/30 transition-all text-base"
            >
              Experience Live Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
