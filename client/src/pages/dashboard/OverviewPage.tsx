import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import {
  CalendarDays,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Bot,
  ExternalLink,
  Clock,
  Sparkles,
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { currentTenant } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenant) {
      loadOverview();
    }
  }, [currentTenant]);

  const loadOverview = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/tenants/${currentTenant.id}/overview`);
      setData(res);
    } catch (err) {
      console.error('Failed to load overview', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700 mr-3"></div>
        <span>Loading practice overview...</span>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalAppointments: 0,
    upcomingAppointments: 0,
    totalConversations: 0,
    conversionRate: 0,
    escalatedConversations: 0,
    activeServices: 0,
    activeStaff: 0,
  };

  const recentAppointments = data?.recentAppointments || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Booking Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {currentTenant?.name}
          </h1>
          <p className="text-purple-200 text-xs sm:text-sm mt-1 max-w-xl">
            Your AI receptionist is online, answering patient inquiries, and booking appointments into your calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/agent"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white text-purple-900 font-bold text-xs hover:bg-purple-50 transition-colors shadow-sm"
          >
            <Bot className="w-4 h-4 text-purple-700" />
            <span>AI Sandbox Simulator</span>
          </Link>
          <a
            href={`/embed/${currentTenant?.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-purple-700/60 hover:bg-purple-700 text-white font-semibold text-xs border border-purple-400/30 transition-colors"
          >
            <span>Live Chat</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Appointments</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.totalAppointments}</div>
          <p className="text-[11px] text-emerald-600 font-medium">
            {metrics.upcomingAppointments} upcoming scheduled
          </p>
        </div>

        {/* Conversations Handled */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Conversations Handled</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.totalConversations}</div>
          <p className="text-[11px] text-slate-500">
            24/7 autonomous chat & web inquiries
          </p>
        </div>

        {/* Booking Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Booking Conversion</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.conversionRate}%</div>
          <p className="text-[11px] text-emerald-600 font-medium">
            Inquiries converted to confirmed visits
          </p>
        </div>

        {/* Escalated to Staff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Human Escalations</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.escalatedConversations}</div>
          <p className="text-[11px] text-amber-700 font-medium">
            Handled by front desk triage
          </p>
        </div>
      </div>

      {/* Recent Appointments & Practice Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Appointments Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Recent Appointments</h3>
            <Link
              to="/dashboard/appointments"
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No appointments booked yet. Open the AI widget to test your first booking!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Procedure</th>
                    <th className="pb-3">Scheduled For</th>
                    <th className="pb-3">Provider</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAppointments.map((appt: any) => {
                    const start = new Date(appt.startTime);
                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 font-semibold text-slate-900">
                          {appt.customer?.name}
                          <div className="text-[10px] text-slate-400 font-normal">{appt.customer?.email}</div>
                        </td>
                        <td className="py-3 text-slate-700">{appt.service?.name}</td>
                        <td className="py-3 text-slate-600">
                          {start.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          <span className="text-slate-400">
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{appt.staffMember?.name || 'Any Staff'}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              appt.status === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : appt.status === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Practice Quick Status (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Virtual Receptionist</h3>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                S
              </div>
              <div>
                <h4 className="font-bold text-xs text-purple-950">Sarah</h4>
                <p className="text-[11px] text-purple-700">Tone: Professional & Reassuring</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Active Procedures:</span>
                <span className="font-bold text-slate-900">{metrics.activeServices}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Active Providers:</span>
                <span className="font-bold text-slate-900">{metrics.activeStaff}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Clinical Safety:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/dashboard/widget"
                className="w-full block text-center py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors"
              >
                Get Website Embed Code
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
