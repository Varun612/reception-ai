import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import {
  CalendarDays,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const { currentTenant } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Manual Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    serviceId: '',
    staffMemberId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    patientType: 'NEW_PATIENT',
    chiefComplaint: 'Routine Dental Cleaning & Checkup',
    insuranceProvider: 'Delta Dental',
    specialAccommodations: 'None',
    notes: '',
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      loadData();
    }
  }, [currentTenant, statusFilter]);

  const loadData = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const query = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const [apptsRes, servRes, staffRes] = await Promise.all([
        apiRequest(`/tenants/${currentTenant.id}/appointments${query}`),
        apiRequest(`/tenants/${currentTenant.id}/services`),
        apiRequest(`/tenants/${currentTenant.id}/staff`),
      ]);
      setAppointments(apptsRes.appointments || []);
      setServices(servRes.services || []);
      setStaff(staffRes.staff || []);
      if (servRes.services?.length > 0 && !modalForm.serviceId) {
        setModalForm((prev) => ({ ...prev, serviceId: servRes.services[0].id }));
      }
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, status: string, reason?: string) => {
    if (!currentTenant) return;
    try {
      await apiRequest(`/tenants/${currentTenant.id}/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;
    setModalError(null);
    setModalSubmitting(true);

    try {
      const startTime = new Date(`${modalForm.date}T${modalForm.time}:00Z`).toISOString();
      await apiRequest(`/tenants/${currentTenant.id}/appointments`, {
        method: 'POST',
        body: JSON.stringify({
          serviceId: modalForm.serviceId,
          staffMemberId: modalForm.staffMemberId || undefined,
          startTime,
          customerName: modalForm.customerName,
          customerEmail: modalForm.customerEmail,
          customerPhone: modalForm.customerPhone,
          patientType: modalForm.patientType,
          chiefComplaint: modalForm.chiefComplaint,
          insuranceProvider: modalForm.insuranceProvider,
          specialAccommodations: modalForm.specialAccommodations,
          notes: modalForm.notes,
        }),
      });

      setBookingModalOpen(false);
      setModalForm({
        serviceId: services[0]?.id || '',
        staffMemberId: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        patientType: 'NEW_PATIENT',
        chiefComplaint: 'Routine Dental Cleaning & Checkup',
        insuranceProvider: 'Delta Dental',
        specialAccommodations: 'None',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Booking conflict or error.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (!search) return true;
    const nameMatch = a.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const emailMatch = a.customer?.email?.toLowerCase().includes(search.toLowerCase());
    const serviceMatch = a.service?.name?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || emailMatch || serviceMatch;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Customer Name', 'Customer Email', 'Service', 'Start Time', 'Status', 'Booked Via'];
    const rows = filteredAppointments.map((a) => [
      a.id,
      `"${a.customer?.name || ''}"`,
      a.customer?.email || '',
      `"${a.service?.name || ''}"`,
      a.startTime,
      a.status,
      a.bookedVia,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `appointments_${currentTenant?.slug}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time schedule synchronized with your autonomous receptionist.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setBookingModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                  statusFilter === status
                    ? 'bg-white text-purple-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status.toLowerCase().replace('_', '-')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient or service..."
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-semibold ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              List Table
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg font-semibold ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No appointments found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Provider</th>
                    <th className="p-4">Channel</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appt) => {
                    const start = new Date(appt.startTime);
                    const end = new Date(appt.endTime);
                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{appt.customer?.name}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                appt.patientType === 'RETURNING_PATIENT'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {appt.patientType === 'RETURNING_PATIENT' ? 'Returning' : 'New Patient'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {appt.customer?.email} • {appt.customer?.phone || 'No phone'}
                          </div>
                          {appt.chiefComplaint && (
                            <div className="text-[10px] text-purple-700 font-medium mt-1">
                              🩺 {appt.chiefComplaint}
                            </div>
                          )}
                          {appt.insuranceProvider && (
                            <div className="text-[9px] text-slate-400">
                              💳 {appt.insuranceProvider}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-slate-700 font-medium">{appt.service?.name}</td>
                        <td className="p-4 text-slate-600">
                          <div className="font-semibold text-slate-900">
                            {start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{appt.staffMember?.name || 'Any Staff'}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                            {appt.bookedVia}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              appt.status === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : appt.status === 'COMPLETED'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : appt.status === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {appt.status === 'CONFIRMED' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(appt.id, 'COMPLETED')}
                                  title="Mark Completed"
                                  className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStatusChange(appt.id, 'CANCELLED', 'Cancelled by front desk')}
                                  title="Cancel Appointment"
                                  className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Calendar Schedule Grid View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-purple-700" />
              <span>Upcoming Scheduled Chairs</span>
            </h3>
            <span className="text-xs text-slate-500">Showing confirmed sessions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredAppointments
              .filter((a) => a.status === 'CONFIRMED')
              .map((appt) => {
                const start = new Date(appt.startTime);
                return (
                  <div
                    key={appt.id}
                    className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2 hover:shadow-soft transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                        {start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs font-bold text-purple-700">
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{appt.customer?.name}</h4>
                    <p className="text-xs text-slate-600">{appt.service?.name}</p>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-purple-100 flex items-center justify-between">
                      <span>Doctor: {appt.staffMember?.name || 'Any'}</span>
                      <span className="font-mono text-[10px]">{appt.bookedVia}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Schedule New Appointment</h3>
              <button onClick={() => setBookingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleManualBooking} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Service</label>
                <select
                  required
                  value={modalForm.serviceId}
                  onChange={(e) => setModalForm({ ...modalForm, serviceId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min - ${s.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Staff Member (Optional)</label>
                <select
                  value={modalForm.staffMemberId}
                  onChange={(e) => setModalForm({ ...modalForm, staffMemberId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
                >
                  <option value="">Any Available Staff</option>
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.title || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={modalForm.date}
                    onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time (UTC / Local)</label>
                  <input
                    type="time"
                    required
                    value={modalForm.time}
                    onChange={(e) => setModalForm({ ...modalForm, time: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    value={modalForm.customerName}
                    onChange={(e) => setModalForm({ ...modalForm, customerName: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Email</label>
                  <input
                    type="email"
                    required
                    value={modalForm.customerEmail}
                    onChange={(e) => setModalForm({ ...modalForm, customerEmail: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Phone</label>
                <input
                  type="text"
                  value={modalForm.customerPhone}
                  onChange={(e) => setModalForm({ ...modalForm, customerPhone: e.target.value })}
                  placeholder="(512) 555-0100"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 rounded-xl text-white bg-purple-700 hover:bg-purple-800 font-bold disabled:opacity-50"
                >
                  {modalSubmitting ? 'Verifying & Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
