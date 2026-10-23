import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import {
  Activity,
  ShieldCheck,
  Users,
  Clock,
  ArrowRight,
  Smartphone,
  Monitor,
  TrendingUp,
  AlertCircle,
  Eye,
  CheckCircle2,
  CalendarCheck,
  RefreshCw,
  Database,
  Search,
} from 'lucide-react';

export const PatientJourneyTelemetryPage: React.FC = () => {
  const { currentTenant } = useAuth();
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (currentTenant) {
      loadTelemetry();
    }
  }, [currentTenant]);

  const loadTelemetry = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/tenants/${currentTenant?.id}/telemetry`);
      setTelemetryData(data);
    } catch (err) {
      console.error('Failed to load telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !telemetryData) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-purple-600" />
        <span>Loading interaction metadata & click telemetry...</span>
      </div>
    );
  }

  const { summary, funnel, deviceBreakdown, channelBreakdown, recentSessions } = telemetryData;

  const filteredSessions = recentSessions.filter((s: any) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.sessionId.toLowerCase().includes(q) ||
      s.eventType.toLowerCase().includes(q) ||
      s.customerEmail?.toLowerCase().includes(q) ||
      s.customerPhone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Patient Journey & Interaction Telemetry
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Study customer end-to-end touchpoints, drop-offs, and multi-click prevention stats for {currentTenant?.name}.
          </p>
        </div>

        <button
          onClick={loadTelemetry}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 shadow-xs transition-colors self-start"
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-700" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Patient Sessions</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{summary.totalSessions}</div>
          <p className="text-[11px] text-slate-400 mt-1">Unique customer journeys tracked</p>
        </div>

        {/* Duplicate Clicks Mitigated */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-soft relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-0"></div>
          <div className="flex items-center justify-between text-purple-700 mb-2 relative z-10">
            <span className="text-xs font-semibold uppercase tracking-wider">Duplicate Clicks Mitigated</span>
            <ShieldCheck className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-3xl font-extrabold text-purple-900 relative z-10">
            {summary.totalClicksMitigated}
          </div>
          <p className="text-[11px] text-purple-700 font-medium mt-1 relative z-10">
            ⚡ {summary.estimatedServerHitsSaved} redundant API hits intercepted
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Booking Conversion</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{summary.conversionRate}%</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.confirmedBookings} confirmed appointments
          </p>
        </div>

        {/* Average Time Spent */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Time-to-Book</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {Math.floor(summary.avgTimeSpentSeconds / 60)}m {summary.avgTimeSpentSeconds % 60}s
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Frictionless self-scheduling speed</p>
        </div>
      </div>

      {/* Visual Funnel Analysis */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Patient Conversion Funnel</h3>
            <p className="text-slate-500 text-xs">
              Step-by-step customer progression from initial interaction to confirmed booking.
            </p>
          </div>
          <span className="text-xs font-semibold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            End-to-End Touchpoints
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {funnel.map((f: any, idx: number) => {
            const maxVal = Math.max(...funnel.map((i: any) => i.count), 1);
            const percentage = Math.round((f.count / maxVal) * 100);

            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3 relative"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Step {idx + 1}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 mt-1 leading-tight">{f.step}</h4>
                </div>

                <div>
                  <div className="text-2xl font-black text-purple-900">{f.count}</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-purple-700 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown: Device & Entry Channel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-purple-700" />
            <span>Device Breakdown</span>
          </h3>
          <div className="space-y-2.5 text-xs">
            {Object.entries(deviceBreakdown).map(([device, count]: any) => (
              <div key={device} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-700">{device}</span>
                <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-lg">
                  {count} ({Math.round((count / (summary.totalInteractions || 1)) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-700" />
            <span>Customer Entry Channels</span>
          </h3>
          <div className="space-y-2.5 text-xs">
            {Object.entries(channelBreakdown).map(([channel, count]: any) => (
              <div key={channel} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-700">{channel}</span>
                <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-lg">
                  {count} touches
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Metadata Inspector Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">Recent Customer Interaction Sessions</h3>
            <p className="text-xs text-slate-500">
              Inspect session timestamps, device metadata, click mitigation events, and patient details.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search session ID or patient..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Channel / Device</th>
                <th className="py-3 px-4">Patient / Contact</th>
                <th className="py-3 px-4">Duplicate Clicks Mitigated</th>
                <th className="py-3 px-4">Time Spent</th>
                <th className="py-3 px-4 text-right">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No customer interaction events matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.eventType === 'BOOKING_CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.eventType === 'DUPLICATE_CLICK_PREVENTED'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.eventType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{s.channel}</div>
                      <div className="text-[10px] text-slate-400">
                        {s.deviceType} • {s.browser} • {s.os}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {s.customerEmail || s.customerPhone ? (
                        <div>
                          <div className="text-slate-900 font-semibold">{s.customerEmail || '—'}</div>
                          <div className="text-[10px] text-slate-500">{s.customerPhone || '—'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Anonymous Visitor</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.duplicateClicksMitigated > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full text-[10px]">
                          <ShieldCheck className="w-3 h-3" />
                          {s.duplicateClicksMitigated} saved
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {s.timeSpentSeconds > 0 ? `${s.timeSpentSeconds}s` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedSession(s)}
                        className="p-1.5 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Metadata Inspector Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated max-w-lg w-full p-6 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-700" />
                <h3 className="font-bold text-sm text-slate-900">Session Metadata Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-400 block">Session ID:</span>
                <span className="font-mono font-bold text-slate-800">{selectedSession.sessionId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Event Type:</span>
                <span className="font-bold text-purple-800">{selectedSession.eventType}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Device & OS:</span>
                <span className="font-medium text-slate-800">
                  {selectedSession.deviceType} / {selectedSession.os}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Browser:</span>
                <span className="font-medium text-slate-800">{selectedSession.browser}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 mb-1 block">Full Metadata JSON Payload</span>
              <pre className="p-3 bg-slate-900 text-purple-200 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedSession.metadata || {}, null, 2)}
              </pre>
            </div>

            {selectedSession.appointment && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 text-emerald-900 text-[11px]">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Linked Appointment Confirmed</span>
                </div>
                <p>
                  Procedure: <strong>{selectedSession.appointment.service?.name}</strong> • Status:{' '}
                  <strong>{selectedSession.appointment.status}</strong>
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 bg-purple-700 text-white font-bold rounded-xl text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
