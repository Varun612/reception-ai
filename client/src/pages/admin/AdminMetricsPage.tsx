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
} from 'lucide-react';

export const AdminMetricsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const res = await apiRequest('/admin/metrics');
      setData(res);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Overview & Metrics</h1>
        <p className="text-xs text-slate-400 mt-1">
          Super-admin monitoring for all tenant workspaces, subscription revenues, and AI system health.
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

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Bookings</span>
            <CalendarCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{m.totalAppointmentsBooked}</div>
          <p className="text-[11px] text-slate-400">Processed across all tenants</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Conversations Volume</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{m.totalConversationsHandled}</div>
          <p className="text-[11px] text-slate-400">Handled by tool-calling agents</p>
        </div>
      </div>

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
            <span className="text-slate-400">System Overall:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {m.systemHealth}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
