import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Sparkles,
  Send,
  CalendarCheck,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const EmbedWidgetPage: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [config, setConfig] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Direct Booking Modal inside widget
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  useEffect(() => {
    if (tenantSlug) {
      loadConfig();
    }
  }, [tenantSlug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConfig = async () => {
    try {
      const res = await fetch(`/api/widget/${tenantSlug}/config`);
      const data = await res.json();
      setConfig(data);
      setMessages([
        {
          role: 'assistant',
          text: data.greetingMessage || `Hello! Welcome to ${data.businessName}. How can I assist you today?`,
        },
      ]);
      if (data.services?.length > 0) {
        setSelectedServiceId(data.services[0].id);
      }
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    } catch (err) {
      console.error('Failed to load widget config', err);
    }
  };

  const sendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading || !tenantSlug) return;

    const userMsg = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/api/widget/${tenantSlug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationId,
        }),
      });

      const data = await res.json();
      if (data.conversationId) setConversationId(data.conversationId);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || "I'd be pleased to help you with your booking.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Our front desk assistant is momentarily unreachable. Please check your connection or contact our clinic directly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailabilityForModal = async () => {
    if (!tenantSlug || !selectedServiceId || !selectedDate) return;
    setBookingLoading(true);
    try {
      const res = await fetch(`/api/widget/${tenantSlug}/availability?serviceId=${selectedServiceId}&date=${selectedDate}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
      if (data.slots?.length > 0) {
        setSelectedSlotTime(data.slots[0].startTime);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    if (bookingModalOpen && selectedServiceId && selectedDate) {
      checkAvailabilityForModal();
    }
  }, [bookingModalOpen, selectedServiceId, selectedDate]);

  const handleConfirmDirectBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantSlug || !selectedSlotTime) return;
    setBookingLoading(true);

    try {
      const res = await fetch(`/api/widget/${tenantSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          startTime: selectedSlotTime,
          customerName: bookingForm.name,
          customerEmail: bookingForm.email,
          customerPhone: bookingForm.phone,
          notes: bookingForm.notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBookingSuccess(data.appointment);
        setBookingModalOpen(false);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `🎉 Thank you, ${bookingForm.name}! Your appointment has been booked and confirmed for ${new Date(selectedSlotTime).toLocaleString()}. A confirmation has been sent to ${bookingForm.email}.`,
          },
        ]);
      } else {
        alert(data.error || 'Failed to book slot');
      }
    } catch (err: any) {
      alert(err.message || 'Booking conflict');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-400 text-xs">
        <span>Loading receptionist...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-800">
      {/* Widget Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-4 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
            {config.agentName?.charAt(0) || 'S'}
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">{config.agentName}</h3>
            <p className="text-[11px] text-purple-200">{config.businessName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Online</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-purple-700 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-400 italic text-[11px] flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce delay-200"></span>
              <span>Checking schedule...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fast Action Shortcuts */}
      <div className="p-2 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-1.5 text-[11px]">
        <button
          onClick={() => setBookingModalOpen(true)}
          className="px-2.5 py-1 bg-purple-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1"
        >
          <CalendarCheck className="w-3 h-3" />
          <span>Book Online</span>
        </button>
        <button
          onClick={() => sendMessage('What are your clinic hours and location?')}
          className="px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 rounded-lg border border-slate-200 transition-colors"
        >
          Hours & Location
        </button>
        <button
          onClick={() => sendMessage('What services do you offer?')}
          className="px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 rounded-lg border border-slate-200 transition-colors"
        >
          Our Services
        </button>
      </div>

      {/* Input Field */}
      <div className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask a question or request a booking..."
          className="flex-1 text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Direct Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm text-slate-900">Select Date & Time</h4>
              <button onClick={() => setBookingModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleConfirmDirectBooking} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {config.services?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes}m - ${s.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Available Times</label>
                {bookingLoading ? (
                  <div className="text-slate-400 text-xs py-2">Checking open chairs...</div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-rose-600 text-xs py-1">No open slots on this day. Please pick another date.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                    {availableSlots.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSlotTime(s.startTime)}
                        className={`p-2 rounded text-xs font-semibold border text-center transition-colors ${
                          selectedSlotTime === s.startTime
                            ? 'bg-purple-700 text-white border-purple-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        {s.displayTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading || !selectedSlotTime}
                  className="px-4 py-1.5 rounded-lg bg-purple-700 text-white font-bold disabled:opacity-50"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
