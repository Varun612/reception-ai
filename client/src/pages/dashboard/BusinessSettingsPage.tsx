import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { Building, Clock, ShieldCheck, Save, CheckCircle2 } from 'lucide-react';

export const BusinessSettingsPage: React.FC = () => {
  const { currentTenant, refreshMe } = useAuth();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      loadSettings();
    }
  }, [currentTenant]);

  const loadSettings = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/tenants/${currentTenant.id}`);
      setTenant(res.tenant);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !tenant) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      await apiRequest(`/tenants/${currentTenant.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify({
          name: tenant.name,
          timeZone: tenant.timeZone,
          profile: tenant.businessProfile,
        }),
      });

      // Also update hours & policies if modified
      await apiRequest(`/tenants/${currentTenant.id}/onboarding`, {
        method: 'PUT',
        body: JSON.stringify({
          hours: tenant.businessHours,
          policies: tenant.bookingPolicy,
        }),
      });

      setSaveSuccess(true);
      await refreshMe();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-sm">Loading practice settings...</div>;
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Profile & Operating Hours</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your clinic details, timezone, and calendar open hours.
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Practice Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-purple-700" />
            <span>General Practice Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Practice Name</label>
              <input
                type="text"
                value={tenant.name}
                onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinic Timezone</label>
              <select
                value={tenant.timeZone}
                onChange={(e) => setTenant({ ...tenant, timeZone: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
              >
                <option value="America/Chicago">Central Time (US & Canada)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="America/Denver">Mountain Time (US & Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="Europe/London">London (GMT / BST)</option>
                <option value="Australia/Sydney">Sydney (AEST)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={tenant.businessProfile?.phone || ''}
                onChange={(e) =>
                  setTenant({
                    ...tenant,
                    businessProfile: { ...tenant.businessProfile, phone: e.target.value },
                  })
                }
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                value={tenant.businessProfile?.website || ''}
                onChange={(e) =>
                  setTenant({
                    ...tenant,
                    businessProfile: { ...tenant.businessProfile, website: e.target.value },
                  })
                }
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Clinic Physical Address</label>
              <input
                type="text"
                value={tenant.businessProfile?.address || ''}
                onChange={(e) =>
                  setTenant({
                    ...tenant,
                    businessProfile: { ...tenant.businessProfile, address: e.target.value },
                  })
                }
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Emergency Care Protocol</label>
              <textarea
                rows={2}
                value={tenant.businessProfile?.emergencyContactProtocol || ''}
                onChange={(e) =>
                  setTenant({
                    ...tenant,
                    businessProfile: { ...tenant.businessProfile, emergencyContactProtocol: e.target.value },
                  })
                }
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours Editor */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-purple-700" />
            <span>Weekly Operating Hours</span>
          </h3>

          <div className="space-y-3">
            {tenant.businessHours?.map((bh: any, idx: number) => (
              <div key={bh.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-28 font-bold text-slate-900">{daysOfWeek[bh.dayOfWeek]}</span>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bh.isClosed}
                      onChange={(e) => {
                        const updated = [...tenant.businessHours];
                        updated[idx].isClosed = e.target.checked;
                        setTenant({ ...tenant, businessHours: updated });
                      }}
                      className="rounded text-purple-700"
                    />
                    <span className="text-[11px] font-semibold text-slate-600">Closed</span>
                  </label>

                  {!bh.isClosed && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={bh.openTime}
                        onChange={(e) => {
                          const updated = [...tenant.businessHours];
                          updated[idx].openTime = e.target.value;
                          setTenant({ ...tenant, businessHours: updated });
                        }}
                        className="border border-slate-300 rounded px-2 py-1 bg-white"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="time"
                        value={bh.closeTime}
                        onChange={(e) => {
                          const updated = [...tenant.businessHours];
                          updated[idx].closeTime = e.target.value;
                          setTenant({ ...tenant, businessHours: updated });
                        }}
                        className="border border-slate-300 rounded px-2 py-1 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl font-bold text-white bg-purple-700 hover:bg-purple-800 transition-colors shadow-sm disabled:opacity-50 text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
