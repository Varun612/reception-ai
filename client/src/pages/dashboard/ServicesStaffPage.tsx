import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import {
  Stethoscope,
  Users,
  Plus,
  Trash2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';

export const ServicesStaffPage: React.FC = () => {
  const { currentTenant } = useAuth();
  const [activeTab, setActiveTab] = useState<'services' | 'staff'>('services');
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Service Modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    durationMinutes: 45,
    bufferMinutes: 15,
    price: 150,
    displayPrice: true,
    category: 'preventative',
  });

  // New Staff Modal
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
  });

  useEffect(() => {
    if (currentTenant) {
      loadData();
    }
  }, [currentTenant]);

  const loadData = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const [servRes, staffRes] = await Promise.all([
        apiRequest(`/tenants/${currentTenant.id}/services`),
        apiRequest(`/tenants/${currentTenant.id}/staff`),
      ]);
      setServices(servRes.services || []);
      setStaff(staffRes.staff || []);
    } catch (err) {
      console.error('Failed to load services & staff', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;
    try {
      await apiRequest(`/tenants/${currentTenant.id}/services`, {
        method: 'POST',
        body: JSON.stringify(serviceForm),
      });
      setServiceModalOpen(false);
      setServiceForm({
        name: '',
        description: '',
        durationMinutes: 45,
        bufferMinutes: 15,
        price: 150,
        displayPrice: true,
        category: 'preventative',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create service');
    }
  };

  const handleDeactivateService = async (id: string) => {
    if (!currentTenant) return;
    if (!confirm('Are you sure you want to deactivate this service?')) return;
    try {
      await apiRequest(`/tenants/${currentTenant.id}/services/${id}`, {
        method: 'DELETE',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate service');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;
    try {
      await apiRequest(`/tenants/${currentTenant.id}/staff`, {
        method: 'POST',
        body: JSON.stringify(staffForm),
      });
      setStaffModalOpen(false);
      setStaffForm({
        name: '',
        email: '',
        phone: '',
        title: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add staff member');
    }
  };

  const handleDeactivateStaff = async (id: string) => {
    if (!currentTenant) return;
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;
    try {
      await apiRequest(`/tenants/${currentTenant.id}/staff/${id}`, {
        method: 'DELETE',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate staff');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Services & Providers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your clinical procedure catalog and doctor/hygienist roster.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'services' ? (
            <button
              onClick={() => setServiceModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Procedure</span>
            </button>
          ) : (
            <button
              onClick={() => setStaffModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Provider</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center space-x-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'services'
              ? 'border-purple-700 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Services Catalog ({services.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center space-x-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-purple-700 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clinical Staff ({staff.length})</span>
        </button>
      </div>

      {/* Services List View */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                s.isActive
                  ? 'bg-white border-slate-200 shadow-sm hover:shadow-soft'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                    {s.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">${s.price}</span>
                    {s.isActive && (
                      <button
                        onClick={() => handleDeactivateService(s.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Deactivate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900">{s.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.description || 'Clinical dental procedure'}</p>

                <div className="flex items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {s.durationMinutes} min (+{s.bufferMinutes}m buffer)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff List View */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {staff.map((st) => (
            <div
              key={st.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm">
                    {st.name.charAt(0)}
                  </div>
                  {st.isActive && (
                    <button
                      onClick={() => handleDeactivateStaff(st.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Deactivate Staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900">{st.name}</h3>
                <p className="text-xs text-purple-700 font-medium">{st.title || 'Healthcare Provider'}</p>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>{st.email || 'No email configured'}</p>
                  <p>{st.phone || 'No phone configured'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add Clinical Procedure</h3>
              <button onClick={() => setServiceModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Procedure Name</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="e.g. In-Office Teeth Whitening"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description for Patients</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Brief clinical description"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.durationMinutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 text-white font-bold"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add Clinical Provider</h3>
              <button onClick={() => setStaffModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name & Title</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Dr. Emily Watson, DDS"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role / Specialization</label>
                <input
                  type="text"
                  value={staffForm.title}
                  onChange={(e) => setStaffForm({ ...staffForm, title: e.target.value })}
                  placeholder="e.g. Orthodontist / Dental Hygienist"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="provider@clinic.com"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 text-white font-bold"
                >
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
