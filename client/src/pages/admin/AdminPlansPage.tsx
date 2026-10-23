import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client.js';
import { Layers, Save, CheckCircle2 } from 'lucide-react';

export const AdminPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await apiRequest('/admin/plans');
      setPlans(res.plans || []);
    } catch (err) {
      console.error('Failed to load plans', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (plan: any) => {
    setSavingId(plan.id);
    try {
      await apiRequest(`/admin/plans/${plan.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          monthlyPrice: plan.monthlyPrice,
          conversationLimit: plan.conversationLimit,
          staffLimit: plan.staffLimit,
        }),
      });
      alert('Plan updated successfully');
      loadPlans();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Plans & Quotas</h1>
        <p className="text-xs text-slate-400 mt-1">
          Adjust monthly subscription fees, conversational quotas, and staff limits across tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p, idx) => (
          <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">{p.name}</h3>
              <span className="font-mono text-amber-400 text-[10px] uppercase">{p.code}</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Monthly Price ($)</label>
              <input
                type="number"
                value={p.monthlyPrice}
                onChange={(e) => {
                  const updated = [...plans];
                  updated[idx].monthlyPrice = Number(e.target.value);
                  setPlans(updated);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Conversation Quota / Month</label>
              <input
                type="number"
                value={p.conversationLimit}
                onChange={(e) => {
                  const updated = [...plans];
                  updated[idx].conversationLimit = Number(e.target.value);
                  setPlans(updated);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Max Staff Member Seats</label>
              <input
                type="number"
                value={p.staffLimit}
                onChange={(e) => {
                  const updated = [...plans];
                  updated[idx].staffLimit = Number(e.target.value);
                  setPlans(updated);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleUpdate(p)}
                disabled={savingId === p.id}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold transition-colors"
              >
                {savingId === p.id ? 'Saving...' : 'Update Plan Settings'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
