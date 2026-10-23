import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  Terminal,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Clock,
  Calendar,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: any[];
}

export const DemoPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! Welcome to Apex Dental Spa in Austin. I'm Sarah, your virtual assistant. How can I help you with your dental care today?",
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTelemetry, setActiveTelemetry] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await apiRequest('/widget/apex-dental-spa/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: textToSend,
          conversationId,
        }),
      });

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.toolCallsExecuted && data.toolCallsExecuted.length > 0) {
        setActiveTelemetry(data.toolCallsExecuted);
      }

      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.reply || "I'd be glad to help you schedule a visit.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: data.toolCallsExecuted,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: 'I apologize, but our scheduling service encountered an issue. Please try again.',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! Welcome to Apex Dental Spa in Austin. I'm Sarah, your virtual assistant. How can I help you with your dental care today?",
        timestamp: 'Just now',
      },
    ]);
    setActiveTelemetry([]);
    setConversationId(undefined);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Live Sandbox</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Test ReceptionAI with Apex Dental Spa
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Interact with a live tenant instance. Test pricing inquiries, real-time availability checks, dental triage safety guardrails, and automated booking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>
            <Link
              to="/register"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 transition-colors shadow-sm"
            >
              <span>Deploy for Your Clinic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Main Sandbox Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Chat Window (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden h-[640px]">
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-sm">Sarah — Virtual Receptionist</h3>
                  <p className="text-xs text-purple-200">Apex Dental Spa • Austin, TX</p>
                </div>
              </div>
              <span className="flex items-center text-xs font-medium bg-emerald-500/20 text-emerald-200 px-2.5 py-1 rounded-full border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                Connected to Database
              </span>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      S
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-purple-700 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {m.content}
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        {m.toolCalls.map((tc, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-mono"
                          >
                            ⚡ Tool: {tc.tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    S
                  </div>
                  <span>Checking database & slot availability...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Test Prompt Pills */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 self-center mr-1">Try:</span>
              <button
                onClick={() => sendMessage('What dental services do you offer and how much is whitening?')}
                className="px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              >
                Services & Pricing
              </button>
              <button
                onClick={() => sendMessage('Check availability for routine cleaning tomorrow')}
                className="px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              >
                Check Cleaning Slots
              </button>
              <button
                onClick={() => sendMessage('What insurances do you take?')}
                className="px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              >
                Insurance FAQ
              </button>
              <button
                onClick={() => sendMessage('Help, I have severe throat swelling and difficulty breathing!')}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors font-semibold"
              >
                ⚠️ Emergency Triage Test
              </button>
            </div>

            {/* Input Form */}
            <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a patient question or booking request..."
                className="flex-1 text-xs sm:text-sm border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Real-time Telemetry & Tool Call Inspector (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            {/* Live Backend Telemetry Box */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-slate-200 flex-1 shadow-elevated">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-purple-400 font-mono text-xs uppercase font-bold tracking-wider">
                  <Terminal className="w-4 h-4" />
                  <span>Backend Tool Inspector</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Live Sync</span>
              </div>

              <div className="mt-4 space-y-4 text-xs font-mono">
                {activeTelemetry.length === 0 ? (
                  <div className="text-slate-500 italic py-8 text-center">
                    Send a message to see the tool-calling engine execute database checks, slot calculations, and safety rules.
                  </div>
                ) : (
                  activeTelemetry.map((tc, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-purple-300 font-bold">
                        <span>▶ {tc.tool}()</span>
                        <span className="text-emerald-400 text-[10px]">SUCCESS</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Parameters:</span>
                        <pre className="text-amber-300 text-[11px] overflow-x-auto mt-1 p-2 bg-slate-900 rounded">
                          {JSON.stringify(tc.params, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-slate-500">Tool Result:</span>
                        <pre className="text-slate-300 text-[11px] overflow-x-auto mt-1 p-2 bg-slate-900 rounded max-h-40">
                          {JSON.stringify(tc.result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Why This Matters Explainer Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                Why Clinicians Trust ReceptionAI
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When patients chat with generic LLMs, the model often invents times or gives unsafe clinical advice. ReceptionAI’s tool layer forces the agent to ask the database:
                <br />
                <span className="font-semibold text-slate-800">
                  "Does Dr. Lin have an open chair tomorrow at 2 PM?"
                </span>
                <br />
                The response is 100% grounded in your actual schedule.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
