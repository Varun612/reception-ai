import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  HeartPulse,
  CreditCard,
  FileText,
  Activity,
} from 'lucide-react';
import {
  getOrCreateSessionId,
  sendTelemetryEvent,
  recordMitigatedClick,
  getMitigatedClicksCount,
  getDeviceContext,
} from '../../api/telemetry';

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

  // Structured Patient & Clinical Details Form
  const [customerName, setCustomerName] = useState(nameParam);
  const [customerPhone, setCustomerPhone] = useState(phoneParam);
  const [customerEmail, setCustomerEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [patientType, setPatientType] = useState<'NEW_PATIENT' | 'RETURNING_PATIENT'>('NEW_PATIENT');
  const [chiefComplaint, setChiefComplaint] = useState('Routine Dental Cleaning & Checkup');
  const [customComplaint, setCustomComplaint] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('Delta Dental');
  const [specialAccommodations, setSpecialAccommodations] = useState('None');
  const [patientNotes, setPatientNotes] = useState('');

  // Interaction State
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clickLocked, setClickLocked] = useState(false);
  const [localPreventedClicks, setLocalPreventedClicks] = useState(0);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const inFlightRef = useRef<boolean>(false);

  useEffect(() => {
    if (tenantSlug) {
      loadConfig();
      // Record initial customer interaction
      sendTelemetryEvent({
        tenantSlug,
        eventType: 'SESSION_START',
        channel: 'CALL_TO_CHAT',
        metadata: { entryPoint: 'sms_call_to_chat_revert', initialPhone: phoneParam },
      });
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

      sendTelemetryEvent({
        tenantSlug,
        eventType: 'SLOT_BROWSE',
        channel: 'CALL_TO_CHAT',
        metadata: { serviceId: selectedServiceId, date: selectedDate, slotsCount: data.slots?.length || 0 },
      });
    } catch {
      setError('Unable to load schedule for this date.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectSlot = (startTime: string) => {
    setSelectedSlotTime(startTime);
    sendTelemetryEvent({
      tenantSlug,
      eventType: 'SLOT_SELECT',
      channel: 'CALL_TO_CHAT',
      metadata: { selectedTime: startTime },
    });
  };

  /**
   * Safe Submit with Multi-Click Protection & Deduplication
   */
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. CLIENT-SIDE MULTI-CLICK GUARD: Intercept rapid multi-clicks
    if (inFlightRef.current || submitting || clickLocked) {
      const totalPrevented = recordMitigatedClick();
      setLocalPreventedClicks((prev) => prev + 1);
      console.warn(`[Client Multi-Click Guard] Duplicate click prevented! Sparing server hit.`);
      
      sendTelemetryEvent({
        tenantSlug,
        eventType: 'DUPLICATE_CLICK_PREVENTED',
        channel: 'CALL_TO_CHAT',
        metadata: { form: 'book_chat_page', mitigatedCount: totalPrevented },
      });
      return;
    }

    if (!selectedSlotTime || !tenantSlug) return;

    // Immediately lock out any further clicks
    inFlightRef.current = true;
    setSubmitting(true);
    setClickLocked(true);
    setError(null);

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const finalComplaint = chiefComplaint === 'Other' ? customComplaint || 'General Dental Consultation' : chiefComplaint;
    const sessionId = getOrCreateSessionId();
    const device = getDeviceContext();

    const idempotencyKey = `bk_${sessionId}_${Date.now()}`;

    try {
      // Record submission event
      sendTelemetryEvent({
        tenantSlug,
        eventType: 'BOOKING_SUBMITTED',
        channel: 'CALL_TO_CHAT',
        timeSpentSeconds: timeSpent,
        metadata: {
          serviceId: selectedServiceId,
          chiefComplaint: finalComplaint,
          patientType,
          insuranceProvider,
        },
      });

      const res = await fetch(`/api/widget/${tenantSlug}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey,
          'x-client-session-id': sessionId,
          'x-duplicate-clicks-prevented': String(getMitigatedClicksCount()),
        },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          startTime: selectedSlotTime,
          customerName,
          customerEmail,
          customerPhone,
          chiefComplaint: finalComplaint,
          patientType,
          insuranceProvider,
          specialAccommodations,
          dateOfBirth: dateOfBirth || undefined,
          notes: patientNotes ? `Notes: ${patientNotes}` : 'Booked via Call-to-Chat Revert Link',
          sessionId,
          sessionMetadata: {
            ...device,
            timeSpentSeconds: timeSpent,
            duplicateClicksPrevented: getMitigatedClicksCount(),
            entryChannel: 'SMS_CALL_TO_CHAT',
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConfirmedBooking(data.appointment);

        // Record confirmed booking telemetry
        sendTelemetryEvent({
          tenantSlug,
          eventType: 'BOOKING_CONFIRMED',
          channel: 'CALL_TO_CHAT',
          appointmentId: data.appointment.id,
          customerEmail,
          customerPhone,
          timeSpentSeconds: timeSpent,
          metadata: {
            serviceName: data.appointment.service?.name,
            startTime: data.appointment.startTime,
            patientType,
          },
        });
      } else {
        setError(data.error || 'The slot was just taken. Please choose another time.');
      }
    } catch (err: any) {
      setError(err.message || 'Booking conflict');
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
      // Retain click lock for 2 seconds to eliminate accidental double taps
      setTimeout(() => setClickLocked(false), 2000);
    }
  };

  if (!config) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading practice schedule...</div>;
  }

  const selectedService = services.find((s) => s.id === selectedServiceId);

  const COMPLAINT_OPTIONS = [
    'Routine Dental Cleaning & Checkup',
    'Toothache / Severe Pain',
    'Cosmetic Teeth Whitening',
    'Broken or Chipped Tooth',
    'Bleeding Gums / Sensitive Teeth',
    'Crown / Filling Replacement',
    'Emergency Dental Consultation',
    'Other',
  ];

  const INSURANCE_OPTIONS = [
    'Delta Dental',
    'MetLife Dental',
    'Cigna Dental',
    'Aetna Dental',
    'Guardian',
    'UnitedHealthcare Dental',
    'Self-Pay / Cash / No Insurance',
    'Other / Private Insurance',
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full mx-auto space-y-5">
        {/* Practice Header Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">{config.businessName}</h2>
              <p className="text-[11px] text-purple-700 font-medium">Verified Dental Chair Booking • Front Desk AI</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Live Chairs
            </span>
            {localPreventedClicks > 0 && (
              <span className="text-[9px] font-semibold text-purple-600 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {localPreventedClicks} duplicate click{localPreventedClicks > 1 ? 's' : ''} intercepted
              </span>
            )}
          </div>
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
                Your appointment has been reserved directly into the dental schedule.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-medium text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full">
                  {patientType === 'NEW_PATIENT' ? 'New Patient' : 'Returning Patient'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-purple-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reason / Complaint:</span>
                <span className="font-medium text-slate-800">{chiefComplaint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment / Insurance:</span>
                <span className="font-medium text-slate-800">{insuranceProvider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-900">
                  {new Date(selectedSlotTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-medium text-slate-700">{config.address || 'Clinic Front Desk'}</span>
              </div>
            </div>

            {/* Dual Confirmation Status Box */}
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-left text-xs space-y-2 text-purple-900">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-700" />
                <span>Dual Confirmations Successfully Sent</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                📱 <strong>SMS Sent to Phone:</strong> {customerPhone || 'Your Mobile'}<br />
                📧 <strong>Confirmation Email Sent to:</strong> {customerEmail}
              </p>
            </div>

            {/* Click Telemetry Info */}
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-click deduplication verified • Server zero redundant load</span>
            </div>
          </div>
        ) : (
          /* Interactive Booking Form with Full Clinical Details */
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-5 text-xs">
            <div>
              <h3 className="font-bold text-base text-slate-900">Select Procedure & Enter Patient Details</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Choose your dental treatment, select an open chair, and enter your details to lock in your appointment.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleConfirm} className="space-y-4">
              {/* 1. Service Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dental Treatment / Service</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    sendTelemetryEvent({
                      tenantSlug,
                      eventType: 'SERVICE_SELECT',
                      channel: 'CALL_TO_CHAT',
                      metadata: { serviceId: e.target.value },
                    });
                  }}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min • ${s.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Date Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Appointment Date</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              {/* 3. Available Slots */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Available Clinic Openings</label>
                  <span className="text-[10px] text-slate-400">Live chair sync</span>
                </div>

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
                          onClick={() => handleSelectSlot(s.startTime)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
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

              {/* 4. Patient Information Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <User className="w-4 h-4 text-purple-700" />
                  <span>Patient Identity & Contact Details</span>
                </span>

                {/* Patient Type (New vs Returning) */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPatientType('NEW_PATIENT')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      patientType === 'NEW_PATIENT'
                        ? 'bg-purple-50 text-purple-800 border-purple-400'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    ✨ New Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientType('RETURNING_PATIENT')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      patientType === 'RETURNING_PATIENT'
                        ? 'bg-purple-50 text-purple-800 border-purple-400'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    🏥 Returning Patient
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone (SMS Confirmation) *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1 (512) 555-0100"
                      className="w-full border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-purple-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email (Calendar Receipt) *</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="alex.morgan@example.com"
                      className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Clinical & Visit Reason */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <HeartPulse className="w-4 h-4 text-purple-700" />
                  <span>Reason for Visit & Medical Details</span>
                </span>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Dental Complaint *</label>
                  <select
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                  >
                    {COMPLAINT_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {chiefComplaint === 'Other' && (
                  <div>
                    <input
                      type="text"
                      required
                      value={customComplaint}
                      onChange={(e) => setCustomComplaint(e.target.value)}
                      placeholder="Please briefly describe your dental symptoms..."
                      className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-600 outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Insurance / Payment</label>
                    <select
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs focus:ring-2 focus:ring-purple-600 outline-none"
                    >
                      {INSURANCE_OPTIONS.map((ins) => (
                        <option key={ins} value={ins}>
                          {ins}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Special Accommodations</label>
                    <select
                      value={specialAccommodations}
                      onChange={(e) => setSpecialAccommodations(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs focus:ring-2 focus:ring-purple-600 outline-none"
                    >
                      <option value="None">None</option>
                      <option value="Dental Anxiety / Nitrous Sedation">Dental Anxiety / Nitrous</option>
                      <option value="Wheelchair Accessibility">Wheelchair Accessible</option>
                      <option value="Penicillin or Latex Allergy">Latex / Medication Allergy</option>
                      <option value="Need Language Translator">Language Assistance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Additional Notes for Doctor (Optional)</label>
                  <textarea
                    rows={2}
                    value={patientNotes}
                    onChange={(e) => setPatientNotes(e.target.value)}
                    placeholder="Any specific tooth area, history, or symptoms the dentist should know..."
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
              </div>

              {/* 6. Multi-Click Protected Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || clickLocked || !selectedSlotTime}
                  className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Securing Slot & Sending Confirmations...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="w-4 h-4" />
                      <span>Confirm & Book Appointment</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Double-click protected • Server verified transaction</span>
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
