import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import {
  CreditCard,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const BillingPage: React.FC = () => {
  const { currentTenant } = useAuth();
  const [billingData, setBillingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    if (currentTenant) {
      loadBilling();
    }
  }, [currentTenant]);

  const loadBilling = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/tenants/${currentTenant.id}/billing`);
      setBillingData(res);
    } catch (err) {
      console.error('Failed to load billing', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planCode: string) => {
    if (!currentTenant) return;
    setUpgrading(true);
    try {
      const session = await apiRequest(`/tenants/${currentTenant.id}/billing/checkout`, {
        method: 'POST',
        body: JSON.stringify({ planCode }),
      });

      if (session.mode === 'mock') {
        // Trigger mock webhook completion
        await apiRequest('/billing/webhook', {
          method: 'POST',
          body: JSON.stringify({
            type: 'checkout.session.completed',
            mock_success: true,
            tenantId: currentTenant.id,
            planCode,
          }),
        });

        setSuccessBanner(`Successfully upgraded to ${planCode.toUpperCase()} plan!`);
        await loadBilling();
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Upgrade checkout failed');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-sm">Loading billing details...</div>;
  }

  const subscription = billingData?.subscription;
  const usage = billingData?.usage || { conversations: 0, conversationLimit: 250, staffCount: 1, staffLimit: 3 };
  const plans = billingData?.availablePlans || [];

  const conversationPct = Math.min(100, Math.round((usage.conversations / (usage.conversationLimit || 1)) * 100));
  const staffPct = Math.min(100, Math.round((usage.staffCount / (usage.staffLimit || 1)) * 100));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription & Usage Metering</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitor your practice's conversational quota, current plan, and billing history.
        </p>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Current Plan Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">{subscription?.plan?.name || 'Starter Plan'}</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {subscription?.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Billed monthly at ${subscription?.plan?.monthlyPrice || 49}/mo
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 text-right">
            <span>Current Period Renews: </span>
            <span className="font-semibold text-slate-900">
              {subscription?.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Next Month'}
            </span>
          </div>
        </div>

        {/* Real-time Usage Meters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Meter 1: Conversations */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Monthly AI Conversations</span>
              <span className="font-bold text-slate-900">
                {usage.conversations} / {usage.conversationLimit}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  conversationPct > 85 ? 'bg-rose-500' : 'bg-purple-600'
                }`}
                style={{ width: `${conversationPct}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500">
              {usage.conversationLimit - usage.conversations} conversations remaining in current cycle ({conversationPct}% used).
            </p>
          </div>

          {/* Meter 2: Staff Roster */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Provider & Staff Seats</span>
              <span className="font-bold text-slate-900">
                {usage.staffCount} / {usage.staffLimit}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${staffPct}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500">
              {usage.staffLimit - usage.staffCount} provider seats available on current plan.
            </p>
          </div>
        </div>
      </div>

      {/* Available Plans Selector */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-slate-900">Upgrade or Modify Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p: any) => {
            const isCurrent = subscription?.plan?.code === p.code;
            return (
              <div
                key={p.code}
                className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-purple-600 bg-purple-50/30 shadow-md ring-2 ring-purple-600/20'
                    : 'border-slate-200 bg-white hover:shadow-soft'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-slate-900">{p.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold text-slate-900">${p.monthlyPrice}</span>
                    <span className="text-xs text-slate-500 ml-1">/ month</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{p.description}</p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>{p.conversationLimit} Monthly Conversations</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Up to {p.staffLimit} Staff Members</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(p.code)}
                      disabled={upgrading}
                      className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {upgrading ? 'Processing...' : `Switch to ${p.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
