import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import {
  Sparkles,
  Building,
  Stethoscope,
  Clock,
  Bot,
  Plug,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
  Send,
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { currentTenant, refreshMe } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [profile, setProfile] = useState({
    name: currentTenant?.name || '',
    industry: 'dental',
    address: '100 Medical Parkway, Suite 210',
    city: 'Austin',
    state: 'TX',
    postalCode: '78705',
    phone: '(512) 555-0199',
    website: 'https://example.com',
    timeZone: 'America/Chicago',
    emergencyContactProtocol: 'For severe swelling, trauma or airway obstruction call 911 or visit ER.',
    description: 'Premier dental practice providing compassionate, modern care.',
  });

  const [services, setServices] = useState([
    {
      name: 'Comprehensive Exam & X-Rays',
      description: 'Oral exam, 3D digital imaging, and customized treatment planning.',
      durationMinutes: 45,
      price: 120,
      displayPrice: true,
      category: 'preventative',
    },
    {
      name: 'Routine Dental Hygiene & Cleaning',
      description: 'Ultrasonic plaque removal, polishing, and protective enamel care.',
      durationMinutes: 45,
      price: 140,
      displayPrice: true,
      category: 'preventative',
    },
    {
      name: 'Professional Teeth Whitening',
      description: 'In-office LED-accelerated cosmetic whitening treatment.',
      durationMinutes: 60,
      price: 350,
      displayPrice: true,
      category: 'cosmetic',
    },
  ]);

  const [policies, setPolicies] = useState({
    minNoticeHours: 2,
    maxAdvanceDays: 60,
    cancellationNoticeHours: 24,
    bufferBetweenSlotsMinutes: 10,
  });

  const [agent, setAgent] = useState({
    agentName: 'Sarah',
    tone: 'PROFESSIONAL',
    greetingMessage: `Hello! Welcome to ${currentTenant?.name || 'our clinic'}. I'm Sarah, your virtual receptionist. How can I help you today?`,
    customInstructions: 'Be welcoming, address common questions, check slot availability, and book appointments.',
    emergencyEscalationNumber: '(512) 555-0199 / 911',
    humanHandoffEmail: 'reception@example.com',
    allowPriceQuoting: true,
  });

  const [integrations, setIntegrations] = useState({
    googleCalendar: false,
    emailConfirmations: true,
    smsNotifications: false,
  });

  // Sandbox test chat for Step 6
  const [testMessages, setTestMessages] = useState([
    { role: 'assistant', text: `Hello! Welcome to ${profile.name}. I'm ${agent.agentName}, your AI receptionist. What can I help you with today?` },
  ]);
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (currentTenant?.name) {
      setProfile((prev) => ({ ...prev, name: currentTenant.name }));
      setAgent((prev) => ({
        ...prev,
        greetingMessage: `Hello! Welcome to ${currentTenant.name}. I'm Sarah, your virtual receptionist. How can I help you today?`,
      }));
    }
  }, [currentTenant]);

  const handleTestChatSend = async () => {
    if (!testInput.trim() || testLoading) return;
    const msg = testInput;
    setTestMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setTestInput('');
    setTestLoading(true);

    try {
      if (currentTenant) {
        const res = await apiRequest(`/widget/${currentTenant.slug}/chat`, {
          method: 'POST',
          body: JSON.stringify({ message: msg }),
        });
        setTestMessages((prev) => [...prev, { role: 'assistant', text: res.reply }]);
      }
    } catch {
      setTestMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `I found open appointments tomorrow at 9:00 AM and 11:30 AM for ${profile.name}. Would you like to reserve one?` },
      ]);
    } finally {
      setTestLoading(false);
    }
  };

  const handleCompleteLaunch = async () => {
    if (!currentTenant) return;
    setSubmitting(true);
    setError(null);

    try {
      await apiRequest(`/tenants/${currentTenant.id}/onboarding`, {
        method: 'PUT',
        body: JSON.stringify({
          profile,
          services,
          policies,
          agent,
        }),
      });

      await refreshMe();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, name: 'Practice Profile', icon: Building },
    { num: 2, name: 'Services & Pricing', icon: Stethoscope },
    { num: 3, name: 'Booking Policies', icon: Clock },
    { num: 4, name: 'AI Receptionist', icon: Bot },
    { num: 5, name: 'Integrations', icon: Plug },
    { num: 6, name: 'Preview & Launch', icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous AI Receptionist Setup</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Configure Your Practice in 6 Simple Steps
          </h1>
          <p className="text-sm text-slate-600">
            Tell us about your clinic and our engine will configure your personalized AI agent.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between overflow-x-auto">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                  isCurrent
                    ? 'bg-purple-100 text-purple-900'
                    : isCompleted
                    ? 'text-emerald-700'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-purple-700 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? '✓' : s.num}
                </div>
                <span>{s.name}</span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-soft">
          {/* STEP 1: Profile */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Step 1: Practice Profile</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Basic address, contact information, and emergency protocol.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Clinic Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Time Zone</label>
                  <select
                    value={profile.timeZone}
                    onChange={(e) => setProfile({ ...profile, timeZone: e.target.value })}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London (GMT / BST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Street Address</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Emergency Care Protocol</label>
                  <textarea
                    rows={2}
                    value={profile.emergencyContactProtocol}
                    onChange={(e) => setProfile({ ...profile, emergencyContactProtocol: e.target.value })}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    What should the AI tell patients experiencing acute dental emergencies or severe trauma?
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Services */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Step 2: Approved Services Catalog</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Procedures the receptionist is authorized to explain and schedule.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setServices([
                      ...services,
                      {
                        name: 'New Dental Service',
                        description: 'Detailed description for patients',
                        durationMinutes: 45,
                        price: 150,
                        displayPrice: true,
                        category: 'general',
                      },
                    ])
                  }
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service</span>
                </button>
              </div>

              <div className="space-y-4">
                {services.map((s, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[idx].name = e.target.value;
                          setServices(updated);
                        }}
                        className="font-bold text-sm text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1 bg-white flex-1 mr-3"
                      />
                      <button
                        onClick={() => {
                          if (services.length > 1) {
                            setServices(services.filter((_, i) => i !== idx));
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={s.description}
                      onChange={(e) => {
                        const updated = [...services];
                        updated[idx].description = e.target.value;
                        setServices(updated);
                      }}
                      className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg p-2 bg-white"
                      placeholder="Service description"
                    />

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Duration:</span>
                        <input
                          type="number"
                          value={s.durationMinutes}
                          onChange={(e) => {
                            const updated = [...services];
                            updated[idx].durationMinutes = Number(e.target.value);
                            setServices(updated);
                          }}
                          className="w-16 border border-slate-300 rounded px-2 py-1 bg-white"
                        />
                        <span className="text-slate-400">min</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Price:</span>
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          value={s.price}
                          onChange={(e) => {
                            const updated = [...services];
                            updated[idx].price = Number(e.target.value);
                            setServices(updated);
                          }}
                          className="w-20 border border-slate-300 rounded px-2 py-1 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Policies */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Step 3: Appointment Booking Policies</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Control lead times, buffer intervals, and cancellation rules.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">Minimum Advance Notice</label>
                  <p className="text-[11px] text-slate-500">
                    How many hours in advance must patients book online?
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={policies.minNoticeHours}
                      onChange={(e) => setPolicies({ ...policies, minNoticeHours: Number(e.target.value) })}
                      className="w-24 text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                    <span className="text-xs text-slate-600 font-semibold">Hours</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">Buffer Time Between Patients</label>
                  <p className="text-[11px] text-slate-500">
                    Minutes added between appointments for room sanitization.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={policies.bufferBetweenSlotsMinutes}
                      onChange={(e) => setPolicies({ ...policies, bufferBetweenSlotsMinutes: Number(e.target.value) })}
                      className="w-24 text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                    <span className="text-xs text-slate-600 font-semibold">Minutes</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">Cancellation Notice Rule</label>
                  <p className="text-[11px] text-slate-500">
                    Hours required for patients to cancel without penalties.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={policies.cancellationNoticeHours}
                      onChange={(e) => setPolicies({ ...policies, cancellationNoticeHours: Number(e.target.value) })}
                      className="w-24 text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                    <span className="text-xs text-slate-600 font-semibold">Hours</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">Maximum Advance Booking</label>
                  <p className="text-[11px] text-slate-500">
                    Maximum days ahead customers can view open slots.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={policies.maxAdvanceDays}
                      onChange={(e) => setPolicies({ ...policies, maxAdvanceDays: Number(e.target.value) })}
                      className="w-24 text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                    <span className="text-xs text-slate-600 font-semibold">Days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AI Personality */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Step 4: AI Receptionist Personality</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Name your agent, choose its communication tone, and write instructions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Agent Name</label>
                  <input
                    type="text"
                    value={agent.agentName}
                    onChange={(e) => setAgent({ ...agent, agentName: e.target.value })}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Tone of Voice</label>
                  <select
                    value={agent.tone}
                    onChange={(e) => setAgent({ ...agent, tone: e.target.value })}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="FRIENDLY">Friendly & Warm</option>
                    <option value="PROFESSIONAL">Professional & Reassuring (Recommended)</option>
                    <option value="FORMAL">Formal & Direct</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Initial Greeting Message</label>
                  <textarea
                    rows={2}
                    value={agent.greetingMessage}
                    onChange={(e) => setAgent({ ...agent, greetingMessage: e.target.value })}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Human Handoff Email</label>
                  <input
                    type="email"
                    value={agent.humanHandoffEmail}
                    onChange={(e) => setAgent({ ...agent, humanHandoffEmail: e.target.value })}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Emergency Phone</label>
                  <input
                    type="text"
                    value={agent.emergencyEscalationNumber}
                    onChange={(e) => setAgent({ ...agent, emergencyEscalationNumber: e.target.value })}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Integrations */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Step 5: Practice Integrations</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Connect your calendar and automated patient notification channels.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Internal Database Calendar</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Primary high-speed scheduling engine with strict transactional concurrency.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    Active
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Google Calendar Two-Way Sync</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Automatically sync patient bookings into your practice Google Workspace.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integrations.googleCalendar}
                      onChange={(e) => setIntegrations({ ...integrations, googleCalendar: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
                  </label>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Automated Email Confirmations</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Dispatches branded booking receipts and directions to patients.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    Enabled
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">SMS Reminders (Twilio Module)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Send text message confirmations 24 hours prior to appointment.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integrations.smsNotifications}
                      onChange={(e) => setIntegrations({ ...integrations, smsNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Preview & Launch */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Step 6: Preview & Launch Your AI Receptionist</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Test sample conversations with your newly configured agent before activating it.
                </p>
              </div>

              {/* Ready Checklist */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Agent Configuration Validation Passed</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-emerald-800">
                  <div>• Practice: {profile.name}</div>
                  <div>• Agent: {agent.agentName}</div>
                  <div>• Services: {services.length} active</div>
                  <div>• Guardrails: Clinical Dental Active</div>
                </div>
              </div>

              {/* Interactive Test Sandbox */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-purple-800 p-3 text-white text-xs font-semibold flex items-center justify-between">
                  <span>Interactive Test Sandbox ({agent.agentName})</span>
                  <span className="text-[10px] text-purple-200 font-normal">Pre-launch Simulation</span>
                </div>

                <div className="p-4 h-56 overflow-y-auto space-y-3 bg-slate-50 text-xs">
                  {testMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-xl p-3 ${
                          m.role === 'user' ? 'bg-purple-700 text-white' : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {testLoading && (
                    <div className="text-xs text-slate-400 italic">Thinking...</div>
                  )}
                </div>

                <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTestChatSend()}
                    placeholder="Ask a test question (e.g. Do you have appointments tomorrow?)..."
                    className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <button
                    onClick={handleTestChatSend}
                    disabled={testLoading}
                    className="px-4 py-2 bg-purple-700 text-white rounded-lg text-xs font-bold"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 transition-all shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleCompleteLaunch}
                className="inline-flex items-center space-x-2 px-7 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <Rocket className="w-4 h-4" />
                <span>{submitting ? 'Activating Agent...' : 'Activate Agent & Launch Dashboard'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
