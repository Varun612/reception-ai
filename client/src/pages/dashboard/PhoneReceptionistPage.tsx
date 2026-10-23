import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import {
  PhoneCall,
  Mic,
  MicOff,
  Volume2,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  PhoneForwarded,
  ShieldCheck,
  Save,
  Play,
  Square,
  Sparkles,
  Smartphone,
  Mail,
  User,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';

export const PhoneReceptionistPage: React.FC = () => {
  const { currentTenant } = useAuth();
  const [agentConfig, setAgentConfig] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Voice Studio Settings
  const [voiceSettings, setVoiceSettings] = useState({
    voiceId: 'sarah-warm',
    customAudioGreetingUrl: '',
    phoneReceptionistEnabled: true,
    forwardingPhoneNumber: '(512) 555-0199',
    callToChatEnabled: true,
  });

  // Audio Recording Studio
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Live Phone Call Simulator State
  const [callActive, setCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'dialing' | 'connected' | 'speaking' | 'listening'>('idle');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callerPhone, setCallerPhone] = useState('+1 (512) 555-7890');
  const [callerName, setCallerName] = useState('Alex Morgan');
  const [callTurns, setCallTurns] = useState<{ role: 'caller' | 'receptionist'; text: string }[]>([]);
  const [callInput, setCallInput] = useState('');
  const [simulatedSmsAlert, setSimulatedSmsAlert] = useState<string | null>(null);
  const [simulatedEmailAlert, setSimulatedEmailAlert] = useState<string | null>(null);

  useEffect(() => {
    if (currentTenant) {
      loadData();
    }
  }, [currentTenant]);

  const loadData = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const [agentRes, callsRes, notifRes] = await Promise.all([
        apiRequest(`/tenants/${currentTenant.id}/agent`),
        apiRequest(`/tenants/${currentTenant.id}/calls`),
        apiRequest(`/tenants/${currentTenant.id}/notifications`),
      ]);

      if (agentRes.config) {
        setAgentConfig(agentRes.config);
        setVoiceSettings({
          voiceId: agentRes.config.voiceId || 'sarah-warm',
          customAudioGreetingUrl: agentRes.config.customAudioGreetingUrl || '',
          phoneReceptionistEnabled: agentRes.config.phoneReceptionistEnabled !== false,
          forwardingPhoneNumber: agentRes.config.forwardingPhoneNumber || '(512) 555-0199',
          callToChatEnabled: agentRes.config.callToChatEnabled !== false,
        });
        if (agentRes.config.customAudioGreetingUrl) {
          setRecordedAudioUrl(agentRes.config.customAudioGreetingUrl);
        }
      }
      setCalls(callsRes.calls || []);
      setNotifications(notifRes.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Text-To-Speech audio player helper
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Microphone audio recording
  const startRecordingGreeting = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setRecordedAudioUrl(base64data);
          setVoiceSettings((prev) => ({ ...prev, customAudioGreetingUrl: base64data }));
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access is required to record your receptionist greeting.');
    }
  };

  const stopRecordingGreeting = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSaveVoiceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;
    setSavingSettings(true);
    setSaveSuccess(false);

    try {
      await apiRequest(`/tenants/${currentTenant.id}/voice/settings`, {
        method: 'POST',
        body: JSON.stringify(voiceSettings),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Start Telephone Call Simulation
  const handleStartSimulatedCall = async () => {
    if (!currentTenant) return;
    setCallActive(true);
    setCallStatus('dialing');
    setCallTurns([]);
    setSimulatedSmsAlert(null);
    setSimulatedEmailAlert(null);

    // Simulate connection delay
    setTimeout(async () => {
      try {
        const res = await apiRequest(`/telephony/${currentTenant.slug}/call/start`, {
          method: 'POST',
          body: JSON.stringify({
            callerPhone,
            callerName,
          }),
        });

        setActiveCallId(res.callId);
        setCallStatus('connected');
        setCallTurns([{ role: 'receptionist', text: res.greetingText }]);
        speakText(res.greetingText);
      } catch (err: any) {
        alert(err.message || 'Call failed to connect');
        setCallActive(false);
        setCallStatus('idle');
      }
    }, 1200);
  };

  // Speak speech turn during phone call
  const handleSendCallUtterance = async (textToSend?: string) => {
    const text = textToSend || callInput;
    if (!text.trim() || !activeCallId || !currentTenant) return;

    const newTurns = [...callTurns, { role: 'caller' as const, text }];
    setCallTurns(newTurns);
    setCallInput('');
    setCallStatus('speaking');

    try {
      const res = await apiRequest(`/telephony/${currentTenant.slug}/call/turn`, {
        method: 'POST',
        body: JSON.stringify({
          callId: activeCallId,
          callerPhone,
          callerName,
          callerEmail: 'alex.morgan@example.com',
          utterance: text,
        }),
      });

      setCallTurns([...newTurns, { role: 'receptionist', text: res.replyText }]);
      speakText(res.replyText);

      // Check if SMS chat link was dispatched
      if (res.smsLinkSent || res.chatLink) {
        setSimulatedSmsAlert(
          `📱 SMS Delivered to ${callerPhone}: "${currentTenant.name}: Tap to select your appointment time: ${res.chatLink || `/book-chat/${currentTenant.slug}`}"`
        );
      }

      // Check if Appointment was confirmed
      if (res.appointmentBooked) {
        setSimulatedSmsAlert(
          `📱 SMS Delivered to ${callerPhone}: "Confirmed! Your appointment with ${currentTenant.name} is booked. Reply HELP or call front desk."`
        );
        setSimulatedEmailAlert(
          `📧 Email Delivered to alex.morgan@example.com: "Confirmed: Your appointment receipt and calendar invite have been dispatched."`
        );
      }

      await loadData();
    } catch (err: any) {
      setCallTurns([...newTurns, { role: 'receptionist', text: 'Thank you for holding. Let me check that for you.' }]);
    } finally {
      setCallStatus('connected');
    }
  };

  // Send interactive slot link
  const handleRequestSmsSlotLink = async () => {
    await handleSendCallUtterance('Could you please text the appointment booking link to my mobile phone?');
  };

  // End Call
  const handleEndSimulatedCall = async () => {
    if (activeCallId && currentTenant) {
      await apiRequest(`/telephony/${currentTenant.slug}/call/end`, {
        method: 'POST',
        body: JSON.stringify({ callId: activeCallId, durationSeconds: 65 }),
      });
    }
    window.speechSynthesis?.cancel();
    setCallActive(false);
    setCallStatus('idle');
    setActiveCallId(null);
    await loadData();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-1">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>AI Phone Attendance & Omnichannel Revert</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Phone Receptionist & Voice Studio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Attend incoming patient calls, record custom audio greetings, and text interactive slot-pickers to callers.
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Voice settings updated!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Voice Studio & Recording (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Voice Receptionist Settings Card */}
          <form onSubmit={handleSaveVoiceSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-700" />
                <span>Voice Receptionist Persona</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-600">Phone Status:</span>
                <button
                  type="button"
                  onClick={() => setVoiceSettings({ ...voiceSettings, phoneReceptionistEnabled: !voiceSettings.phoneReceptionistEnabled })}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    voiceSettings.phoneReceptionistEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {voiceSettings.phoneReceptionistEnabled ? 'ATTENDING CALLS' : 'PAUSED'}
                </button>
              </div>
            </div>

            {/* Voice Model Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">AI Voice Model</label>
                <select
                  value={voiceSettings.voiceId}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, voiceId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
                >
                  <option value="sarah-warm">Sarah — Warm & Reassuring (American)</option>
                  <option value="james-uk">James — Professional Dental (British)</option>
                  <option value="olivia-health">Olivia — Compassionate Healthcare (American)</option>
                  <option value="michael-aus">Michael — Clear & Direct (Australian)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Live Call Forwarding Number</label>
                <input
                  type="text"
                  value={voiceSettings.forwardingPhoneNumber}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, forwardingPhoneNumber: e.target.value })}
                  placeholder="(512) 555-0199"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>
            </div>

            {/* Custom Audio Receptionist Recording Studio */}
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-purple-700" />
                    <span>Practice Owner Voice Recording Studio</span>
                  </h4>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    Record your own voice via browser microphone to greet callers before the AI assistant attends.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecordingGreeting}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record Audio Greeting</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecordingGreeting}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm animate-pulse transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop Recording ({recordingSeconds}s)</span>
                  </button>
                )}

                {recordedAudioUrl && (
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-purple-200">
                    <audio src={recordedAudioUrl} controls className="h-8 max-w-[200px]" />
                    <button
                      type="button"
                      onClick={() => {
                        setRecordedAudioUrl(null);
                        setVoiceSettings((prev) => ({ ...prev, customAudioGreetingUrl: '' }));
                      }}
                      className="text-slate-400 hover:text-rose-600 text-xs font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Call-to-Chat Revert Toggle */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span>Omnichannel Call-to-Chat Revert</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Allows callers to request an interactive mobile booking link texted to their phone so they can visually select an appointment chair.
                </p>
              </div>
              <input
                type="checkbox"
                checked={voiceSettings.callToChatEnabled}
                onChange={(e) => setVoiceSettings({ ...voiceSettings, callToChatEnabled: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-bold text-white bg-purple-700 hover:bg-purple-800 transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSettings ? 'Saving...' : 'Save Voice Settings'}</span>
              </button>
            </div>
          </form>

          {/* Omnichannel Dispatch Stream (SMS + Email) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recent Omnichannel Dispatches (Phone SMS & Email)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live Dispatches</span>
            </h3>

            <div className="space-y-2.5">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  No notifications dispatched yet. Book an appointment over the phone to see real-time SMS & Email dispatches.
                </div>
              ) : (
                notifications.slice(0, 5).map((notif) => {
                  const payload = notif.payload ? JSON.parse(notif.payload) : {};
                  return (
                    <div key={notif.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            notif.type.includes('SMS') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {notif.type.includes('SMS') ? <Smartphone className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {notif.type === 'SMS_CONFIRMATION' ? 'SMS Confirmation Sent' : 'Email Receipt Sent'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">To: {notif.recipient}</div>
                        </div>
                      </div>

                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {notif.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Phone Dialer & Live Call Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col h-[740px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${callActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></div>
              <h3 className="font-bold text-sm text-slate-900">Interactive Phone Call Simulator</h3>
            </div>
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              Twilio / Voice Adapter
            </span>
          </div>

          {/* Caller Profile Settings */}
          {!callActive && (
            <div className="p-3 my-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700">Simulate Inbound Caller:</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  placeholder="Caller Name"
                  className="border border-slate-300 rounded-lg p-1.5 bg-white"
                />
                <input
                  type="text"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  placeholder="Caller Mobile"
                  className="border border-slate-300 rounded-lg p-1.5 bg-white font-mono"
                />
              </div>
            </div>
          )}

          {/* Live Call Dialog / Screen */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-900 rounded-xl my-2 text-xs text-slate-200 font-sans">
            {!callActive ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 text-purple-400 flex items-center justify-center shadow-inner">
                  <PhoneCall className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Call Reception Desk</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click "Dial Practice" below to simulate an incoming phone call to {currentTenant?.name}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800 font-mono">
                  <span>Call Active • {callerPhone}</span>
                  <span className="text-emerald-400">Audio Synthesis Online</span>
                </div>

                {callTurns.map((turn, idx) => (
                  <div
                    key={idx}
                    className={`flex ${turn.role === 'caller' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        turn.role === 'caller'
                          ? 'bg-purple-700 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-purple-300 mb-0.5 capitalize">
                        {turn.role === 'caller' ? callerName : 'AI Receptionist Sarah'}
                      </div>
                      {turn.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simulated In-Call SMS & Email Alerts */}
          {simulatedSmsAlert && (
            <div className="my-1.5 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4 shrink-0 text-purple-700" />
              <span className="truncate">{simulatedSmsAlert}</span>
            </div>
          )}

          {simulatedEmailAlert && (
            <div className="my-1.5 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0 text-blue-700" />
              <span className="truncate">{simulatedEmailAlert}</span>
            </div>
          )}

          {/* Quick Caller Prompts during call */}
          {callActive && (
            <div className="py-2 flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleSendCallUtterance('How much is teeth whitening and do you have openings tomorrow?')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 text-slate-800 rounded-lg border border-slate-200 transition-colors"
              >
                Ask Whitening & Slots
              </button>
              <button
                type="button"
                onClick={handleRequestSmsSlotLink}
                className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Smartphone className="w-3 h-3" />
                <span>Text me slot link</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendCallUtterance('Yes, please confirm the 9:00 AM slot for Alex Morgan.')}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <CalendarCheck className="w-3 h-3" />
                <span>Confirm 9:00 AM</span>
              </button>
            </div>
          )}

          {/* Action / Dialer Controls */}
          <div className="pt-2 border-t border-slate-100">
            {!callActive ? (
              <button
                type="button"
                onClick={handleStartSimulatedCall}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Dial Practice ({currentTenant?.name})</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={callInput}
                    onChange={(e) => setCallInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendCallUtterance()}
                    placeholder="Speak to receptionist (or type)..."
                    className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendCallUtterance()}
                    className="px-3.5 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleEndSimulatedCall}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Hang Up Phone Call</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function PhoneOff(props: any) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="22" y1="2" x2="2" y2="22" />
    </svg>
  );
}
