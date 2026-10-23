import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  ShieldAlert,
  Building2,
  Layers,
  FileText,
  ArrowLeft,
  Activity,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Platform Metrics', href: '/admin', icon: Activity },
    { name: 'Tenants & Businesses', href: '/admin/tenants', icon: Building2 },
    { name: 'Subscription Plans', href: '/admin/plans', icon: Layers },
    { name: 'Audit Logs', href: '/admin/logs', icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-200">
      {/* Super-admin Top Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold tracking-tight text-white text-base">
              ReceptionAI <span className="text-amber-400 font-mono text-xs uppercase px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">Super-Admin</span>
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700"></div>

          <Link
            to="/dashboard"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Clinic Workspace</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-xs text-slate-400">{user?.email}</span>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Admin Navigation Sidebar */}
        <aside className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 space-y-1">
          <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Control Plane
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </aside>

        {/* Admin Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
