import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client.js';
import {
  Activity,
  Building2,
  DollarSign,
  CalendarCheck,
  Cpu,
  Database,
  ShieldCheck,
  Users,
  Zap,
  Globe,
  Radio,
} from 'lucide-react';

export const AdminMetricsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [metricsRes, telemetryRes] = await Promise.all([
        apiRequest('/admin/metrics'),
        apiRequest('/admin/telemetry').catch(() => null),
      ]);
      setData(metricsRes);
      setTelemetry(telemetryRes);
    } catch (err) {
      console.error('Failed to load admin metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-sm">Loading platform metrics...</div>;
  }

  const m = data?.metrics || {};
  const t = telemetry?.summary || { totalDuplicateClicksMitigated: 0, estimatedBandwidthSavedKB: 0, totalPlatformSessions: 0 };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Overview & Metrics</h1>
        <p className="text-xs text-slate-400 mt-1">
          Super-admin monitoring for all tenant workspaces, subscription revenues, click mitigation, and AI system health.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Businesses</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">{m.totalTenants}</div>
          <p className="text-[11px] text-emerald-400">{m.activeTenants} active clinics</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Estimated SaaS MRR</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">${m.estimatedMrr}</div>
          <p className="text-[11px] text-emerald-400">{m.activePaidSubscriptions} paid subscriptions</p>
        </div>

        {/* Duplicate Clicks Mitigated Across Platform */}
        <div className="bg-slate-900 border border-purple-800/60 p-5 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-semibold">Redundant Clicks Mitigated</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-300">
            {t.totalDuplicateClicksMitigated}
          </div>
          <p className="text-[11px] text-purple-300 font-medium">
            ⚡ {t.estimatedBandwidthSavedKB} KB bandwidth & server hits saved
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Bookings</span>
            <CalendarCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{m.totalAppointmentsBooked}</div>
          <p className="text-[11px] text-slate-400">Processed across all tenants</p>
        </div>
      </div>

      {/* Tenant Traffic & Mitigation Breakdown */}
      {telemetry?.tenants && telemetry.tenants.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Clinic Telemetry & Click Mitigation Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400">Server protection active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {telemetry.tenants.map((tItem: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white text-xs">{tItem.name}</div>
                <div className="text-[11px] text-slate-400">Slug: /{tItem.slug}</div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Duplicate Hits Blocked:</span>
                  <span className="font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/50">
                    {tItem.mitigated}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-white">Platform Infrastructure & Service Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">AI Agent Tool Engine:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {m.geminiEngineStatus}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Relational Database:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {m.databaseStatus}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Idempotency & Deduplication Engine:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Active & Guarding
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
