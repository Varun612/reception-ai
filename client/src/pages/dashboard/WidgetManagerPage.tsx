import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  Code2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Smartphone,
  Monitor,
} from 'lucide-react';

export const WidgetManagerPage: React.FC = () => {
  const { currentTenant } = useAuth();
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState<'right' | 'left'>('right');
  const [primaryColor, setPrimaryColor] = useState('#7e22ce');

  const originUrl = window.location.origin;
  const scriptSnippet = `<script 
  src="${originUrl}/widget.js" 
  data-tenant="${currentTenant?.slug}" 
  async>
</script>`;

  const directBookingUrl = `${originUrl}/embed/${currentTenant?.slug}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Website Chat Widget</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Embed your autonomous virtual receptionist on your practice website in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Embed Details & Snippet (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* HTML Embed Snippet Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-700" />
                <span>Single-Line Installation Script</span>
              </h3>
              <button
                onClick={() => handleCopy(scriptSnippet)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Snippet'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Paste this tag into your website HTML right before the closing <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 text-xs">&lt;/body&gt;</code> tag. Compatible with WordPress, Squarespace, Webflow, and custom HTML.
            </p>

            <div className="bg-slate-900 p-4 rounded-xl text-purple-300 font-mono text-xs overflow-x-auto">
              <pre>{scriptSnippet}</pre>
            </div>
          </div>

          {/* Direct Link Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Direct Shareable Booking URL</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Send this link in SMS reminders, Instagram bio, or Google Business profile for one-click scheduling:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={directBookingUrl}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-700 select-all"
              />
              <button
                onClick={() => handleCopy(directBookingUrl)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                Copy
              </button>
              <a
                href={directBookingUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1"
              >
                <span>Open</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Widget Appearance Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900">Customization & Placement</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Widget Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
                >
                  <option value="right">Bottom Right (Standard)</option>
                  <option value="left">Bottom Left</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 border border-slate-300 rounded-lg p-1 bg-white cursor-pointer"
                  />
                  <span className="font-mono text-slate-600">{primaryColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Iframe Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <span className="font-bold text-slate-900">Live Widget Simulator</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Synchronized
            </span>
          </div>

          <div className="flex-1 mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            {currentTenant && (
              <iframe
                src={`/embed/${currentTenant.slug}`}
                title="Widget Preview"
                className="w-full h-full border-none"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
