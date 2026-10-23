import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import {
  Bot,
  Sparkles,
  Save,
  Plus,
  Trash2,
  BookOpen,
  Send,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Mail,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const AgentSettingsPage: React.FC = () => {
  const { currentTenant } = useAuth();
  const [config, setConfig] = useState<any>({
    agentName: 'Sarah',
    tone: 'PROFESSIONAL',
    greetingMessage: '',
    customInstructions: '',
    emergencyEscalationNumber: '',
    humanHandoffEmail: '',
    allowPriceQuoting: true,
    isEnabled: true,
  });
  const [knowledgeDocs, setKnowledgeDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // FAQ Modal
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [faqTitle, setFaqTitle] = useState('');
  const [faqContent, setFaqContent] = useState('');
  const [faqCategory, setFaqCategory] = useState('FAQ');

  // Sandbox Chat State
  const [sandboxMessages, setSandboxMessages] = useState<any[]>([
    { role: 'assistant', text: "Hello! I'm ready to assist your patients. What would you like to test?" },
  ]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (currentTenant) {
      loadAgentData();
    }
  }, [currentTenant]);

  const loadAgentData = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/tenants/${currentTenant.id}/agent`);
      if (res.config) setConfig(res.config);
      if (res.knowledgeDocuments) setKnowledgeDocs(res.knowledgeDocuments);
    } catch (err) {
      console.error('Failed to load agent settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      await apiRequest(`/tenants/${currentTenant.id}/agent`, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !faqTitle.trim() || !faqContent.trim()) return;

    try {
      const res = await apiRequest(`/tenants/${currentTenant.id}/agent/knowledge`, {
        method: 'POST',
        body: JSON.stringify({
          title: faqTitle,
          content: faqContent,
          category: faqCategory,
        }),
      });

      setKnowledgeDocs([res.document, ...knowledgeDocs]);
      setFaqTitle('');
      setFaqContent('');
      setFaqModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add FAQ');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!currentTenant) return;
    try {
      await apiRequest(`/tenants/${currentTenant.id}/agent/knowledge/${id}`, {
        method: 'DELETE',
      });
      setKnowledgeDocs(knowledgeDocs.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete knowledge document');
    }
  };

  const handleSandboxSend = async () => {
    if (!sandboxInput.trim() || !currentTenant || sandboxLoading) return;
    const msg = sandboxInput;
    setSandboxMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setSandboxInput('');
    setSandboxLoading(true);

    try {
      const res = await apiRequest(`/tenants/${currentTenant.id}/agent/chat`, {
        method: 'POST',
        body: JSON.stringify({
          message: msg,
          conversationId,
        }),
      });
      if (res.conversationId) setConversationId(res.conversationId);
      setSandboxMessages((prev) => [...prev, { role: 'assistant', text: res.reply }]);
    } catch (err: any) {
      setSandboxMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Error in sandbox simulator: ' + err.message },
      ]);
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Receptionist Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your virtual receptionist persona, approved knowledge, and safety rules.
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-700" />
                <span>Personality & Tone</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-600">Receptionist Status:</span>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, isEnabled: !config.isEnabled })}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    config.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {config.isEnabled ? 'ONLINE' : 'PAUSED'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={config.agentName}
                  onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Communication Tone</label>
                <select
                  value={config.tone}
                  onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
                >
                  <option value="FRIENDLY">Friendly & Approachable</option>
                  <option value="PROFESSIONAL">Professional & Reassuring (Recommended)</option>
                  <option value="FORMAL">Formal & Direct</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Welcome Greeting Message</label>
                <textarea
                  rows={2}
                  value={config.greetingMessage}
                  onChange={(e) => setConfig({ ...config, greetingMessage: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Custom Practice Instructions</label>
                <textarea
                  rows={3}
                  value={config.customInstructions || ''}
                  onChange={(e) => setConfig({ ...config, customInstructions: e.target.value })}
                  placeholder="e.g. Always mention that routine teeth whitening consultations are currently 10% off this month."
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Human Handoff Email</label>
                <input
                  type="email"
                  value={config.humanHandoffEmail || ''}
                  onChange={(e) => setConfig({ ...config, humanHandoffEmail: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Escalation Phone</label>
                <input
                  type="text"
                  value={config.emergencyEscalationNumber || ''}
                  onChange={(e) => setConfig({ ...config, emergencyEscalationNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900">Allow Pricing Quotes</span>
                  <p className="text-[11px] text-slate-500">Allow the receptionist to quote exact service fees when asked by patients.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.allowPriceQuoting}
                  onChange={(e) => setConfig({ ...config, allowPriceQuoting: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-bold text-white bg-purple-700 hover:bg-purple-800 transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Agent Settings'}</span>
              </button>
            </div>
          </form>

          {/* Approved Knowledge Base Documents & FAQs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-700" />
                  <span>Approved Knowledge Base & FAQs</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Information the AI uses to answer patient questions (insurance, parking, rules).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFaqModalOpen(true)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ / Policy</span>
              </button>
            </div>

            <div className="space-y-3">
              {knowledgeDocs.length === 0 ? (
                <div className="py-6 text-center text-slate-400">No knowledge documents yet. Add your insurance or parking FAQ!</div>
              ) : (
                knowledgeDocs.map((doc) => (
                  <div key={doc.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{doc.title}</span>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                          {doc.category}
                        </span>
                      </span>
                      <button
                        onClick={() => handleDeleteFaq(doc.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{doc.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sandbox Simulator (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-soft p-5 flex flex-col h-[700px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="font-bold text-sm text-slate-900">Sandbox Simulator</h3>
            </div>
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              {config.agentName}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50 rounded-xl my-3 text-xs">
            {sandboxMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                    m.role === 'user'
                      ? 'bg-purple-700 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sandboxLoading && (
              <div className="text-slate-400 text-xs italic">Sarah is typing...</div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={sandboxInput}
              onChange={(e) => setSandboxInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSandboxSend()}
              placeholder="Test asking questions or booking..."
              className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              onClick={handleSandboxSend}
              disabled={sandboxLoading}
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add FAQ Modal */}
      {faqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add Knowledge Document</h3>
              <button onClick={() => setFaqModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleAddFaq} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title / Question</label>
                <input
                  type="text"
                  required
                  value={faqTitle}
                  onChange={(e) => setFaqTitle(e.target.value)}
                  placeholder="e.g. Accepted Dental Insurances"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
                >
                  <option value="FAQ">General FAQ</option>
                  <option value="INSURANCE">Insurance & Billing</option>
                  <option value="LOCATION">Parking & Directions</option>
                  <option value="POLICY">Practice Policies</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approved Content / Answer</label>
                <textarea
                  rows={4}
                  required
                  value={faqContent}
                  onChange={(e) => setFaqContent(e.target.value)}
                  placeholder="The exact guidance the AI should provide to patients..."
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFaqModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 text-white font-bold"
                >
                  Add to Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
