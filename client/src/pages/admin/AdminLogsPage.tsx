import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client.js';
import { FileText, ShieldAlert, Clock, User } from 'lucide-react';

export const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await apiRequest('/admin/logs');
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security & Audit Event Stream</h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable event log tracking administrative modifications, appointments, and cancellations.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Action</th>
              <th className="p-4">Practice / Tenant</th>
              <th className="p-4">Resource</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No audit logs recorded yet.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 text-slate-400 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-mono font-bold text-amber-400">{log.action}</td>
                  <td className="p-4 text-slate-300">{log.tenant?.name || 'System / Platform'}</td>
                  <td className="p-4 text-slate-400">{log.resourceType}</td>
                  <td className="p-4 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                    {log.details || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
