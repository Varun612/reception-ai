import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Smartphone,
  Mail,
  User,
  AlertCircle,
  MapPin,
  Phone,
} from 'lucide-react';

export const BookChatPage: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchParams] = useSearchParams();

  const phoneParam = searchParams.get('phone') || '';
  const nameParam = searchParams.get('name') || '';

  const [config, setConfig] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [customerName, setCustomerName] = useState(nameParam);
  const [customerPhone, setCustomerPhone] = useState(phoneParam);
  const [customerEmail, setCustomerEmail] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantSlug) {
      loadConfig();
    }
  }, [tenantSlug]);

  const loadConfig = async () => {
    try {
      const res = await fetch(`/api/widget/${tenantSlug}/config`);
      const data = await res.json();
      setConfig(data);
      setServices(data.services || []);
      if (data.services?.length > 0) {
        setSelectedServiceId(data.services[0].id);
      }
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tenantSlug && selectedServiceId && selectedDate) {
      fetchSlots();
    }
  }, [tenantSlug, selectedServiceId, selectedDate]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    setError(null);
    try {
      const res = await fetch(`/api/widget/${tenantSlug}/availability?serviceId=${selectedServiceId}&date=${selectedDate}`);
      const data = await res.json();
      setSlots(data.slots || []);
      if (data.slots?.length > 0) {
        setSelectedSlotTime(data.slots[0].startTime);
      } else {
        setSelectedSlotTime('');
      }
    } catch {
      setError('Unable to load schedule for this date.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotTime || !tenantSlug) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/widget/${tenantSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          startTime: selectedSlotTime,
          customerName,
          customerEmail,
          customerPhone,
          notes: 'Booked via Call-to-Chat Revert Link',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConfirmedBooking(data.appointment);
      } else {
        setError(data.error || 'The slot was just taken. Please choose another time.');
      }
    } catch (err: any) {
      setError(err.message || 'Booking conflict');
    } finally {
      setSubmitting(false);
    }
  };

  if (!config) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading practice schedule...</div>;
  }

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Practice Header Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">{config.businessName}</h2>
              <p className="text-[11px] text-purple-700">Online Slot Picker • Virtual Receptionist</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            Real-Time
          </span>
        </div>

        {/* Confirmation Screen */}
        {confirmedBooking ? (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-emerald-200 shadow-soft text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Appointment Confirmed!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your appointment has been locked into the clinic calendar.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-purple-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-900">
                  {new Date(selectedSlotTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-medium text-slate-700">{config.address || 'Practice Location'}</span>
              </div>
            </div>

            {/* Omnichannel Dispatch Status Box */}
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-left text-xs space-y-2 text-purple-900">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-700" />
                <span>Confirmations Dispatched</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                📱 <strong>SMS Sent to:</strong> {customerPhone || 'your mobile'}<br />
                📧 <strong>Calendar Email Sent to:</strong> {customerEmail}
              </p>
            </div>
          </div>
        ) : (
          /* Interactive Booking Form */
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-5 text-xs">
            <div>
              <h3 className="font-bold text-base text-slate-900">Choose Your Appointment Chair</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Select your preferred dental procedure, date, and available time.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Procedure</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min - ${s.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Date</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                />
              </div>

              {/* Slot Chips Grid */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Available Chairs & Times</label>
                {loadingSlots ? (
                  <div className="text-slate-400 py-3 text-center italic">Checking real-time clinic openings...</div>
                ) : slots.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-center">
                    No openings for this date. Please pick another day.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s, idx) => {
                      const isSelected = selectedSlotTime === s.startTime;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlotTime(s.startTime)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                          }`}
                        >
                          {s.displayTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="font-bold text-slate-900 block">Your Contact Information</span>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Patient Name"
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number (for SMS)</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1 (512) 555-0100"
                      className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email (for Receipt)</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="patient@example.com"
                      className="w-full border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !selectedSlotTime}
                  className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>{submitting ? 'Confirming & Dispatching Notifications...' : 'Approve & Book Chair'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
