import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client.js';
import { Building2, Search, Power, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AdminTenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const res = await apiRequest('/admin/tenants');
      setTenants(res.tenants || []);
    } catch (err) {
      console.error('Failed to load tenants', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    const action = currentStatus === 'ACTIVE' ? 'suspend' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} this business workspace?`)) return;

    try {
      await apiRequest(`/admin/tenants/${tenantId}/toggle-status`, { method: 'POST' });
      loadTenants();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const filteredTenants = tenants.filter((t) => {
    if (!search) return true;
    return (
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Registered Businesses & Tenants</h1>
          <p className="text-xs text-slate-400 mt-1">
            Inspect onboarding status, subscription plans, and administrative controls.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search business..."
            className="w-full text-xs bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4">Practice Name</th>
              <th className="p-4">Industry / Region</th>
              <th className="p-4">Subscription Plan</th>
              <th className="p-4">Total Appointments</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredTenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-bold text-white">
                  {t.name}
                  <div className="text-[10px] text-slate-400 font-mono font-normal">slug: {t.slug}</div>
                </td>
                <td className="p-4 text-slate-300">
                  <span className="capitalize">{t.businessProfile?.industry || 'dental'}</span> • {t.country || 'US'}
                </td>
                <td className="p-4 text-slate-300">
                  <span className="capitalize font-semibold text-amber-300">
                    {t.subscription?.plan?.name || 'Starter'}
                  </span>
                </td>
                <td className="p-4 text-slate-300 font-mono">{t._count?.appointments || 0}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => toggleTenantStatus(t.id, t.status)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      t.status === 'ACTIVE'
                        ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                    }`}
                  >
                    {t.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
