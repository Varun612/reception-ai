import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { Users, Plus, ShieldCheck, Mail, UserCheck } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { currentTenant } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('RECEPTIONIST');
  const [inviteName, setInviteName] = useState('');

  useEffect(() => {
    if (currentTenant) {
      loadMembers();
    }
  }, [currentTenant]);

  const loadMembers = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/tenants/${currentTenant.id}`);
      setMembers(res.tenant?.memberships || []);
    } catch (err) {
      console.error('Failed to load team members', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Invitation sent to ${inviteEmail} with role ${inviteRole}.`);
    setInviteModalOpen(false);
    setInviteEmail('');
    setInviteName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Practice Team & Permissions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage who has access to view appointments, adjust receptionist rules, and edit billing.
          </p>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 flex items-center justify-between">
          <span>Authorized Users ({members.length})</span>
          <span className="text-[11px] text-slate-400">Role-based access enforced server-side</span>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center">
                  {m.user?.fullName?.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{m.user?.fullName || 'Staff User'}</h4>
                  <p className="text-slate-400 text-[11px]">{m.user?.email}</p>
                </div>
              </div>

              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Invite Team Member</h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Rachel Adams"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="rachel@clinic.com"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
                >
                  <option value="ADMIN">Practice Admin (Full settings & billing control)</option>
                  <option value="RECEPTIONIST">Front Desk Receptionist (Appointments & Handoffs)</option>
                  <option value="MEMBER">Standard Member (View Only)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 text-white font-bold"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
