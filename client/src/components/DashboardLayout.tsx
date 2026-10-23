import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  CalendarDays,
  Bot,
  Stethoscope,
  Settings,
  Code2,
  CreditCard,
  Users,
  LogOut,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building2,
  Menu,
  X,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, currentTenant, tenants, setCurrentTenant, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarDays },
    { name: 'AI Receptionist', href: '/dashboard/agent', icon: Bot },
    { name: 'Services & Staff', href: '/dashboard/services', icon: Stethoscope },
    { name: 'Business Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Website Widget', href: '/dashboard/widget', icon: Code2 },
    { name: 'Billing & Quota', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Team Members', href: '/dashboard/team', icon: Users },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 border-r border-slate-800 text-slate-300">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Reception<span className="text-purple-400">AI</span>
            </span>
          </Link>
        </div>

        {/* Workspace Switcher */}
        <div className="p-4 border-b border-slate-800/80 relative">
          <button
            onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-left transition-colors border border-slate-700/60"
          >
            <div className="flex items-center space-x-3 truncate">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{currentTenant?.name || 'Workspace'}</p>
                <p className="text-[11px] text-slate-400 capitalize">{currentTenant?.role?.toLowerCase() || 'member'}</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* Tenant Dropdown */}
          {tenantDropdownOpen && tenants.length > 1 && (
            <div className="absolute left-4 right-4 top-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 py-1 overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Switch Clinic
              </div>
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setCurrentTenant(t);
                    setTenantDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-700/70 transition-colors ${
                    t.id === currentTenant?.id ? 'text-purple-400 font-semibold' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate">{t.name}</span>
                  <span className="text-[10px] text-slate-400">{t.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer & User Profile */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          {user?.isPlatformAdmin && (
            <Link
              to="/admin"
              className="flex items-center justify-center space-x-2 w-full py-2 px-3 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Platform Admin Control</span>
            </Link>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center space-x-3 truncate">
              <div className="w-8 h-8 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white truncate">{user?.fullName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-slate-900">{currentTenant?.name}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Receptionist Active
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentTenant && (
              <a
                href={`/embed/${currentTenant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
              >
                <span>Test Live Widget</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Modal */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 text-slate-300">
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <span className="font-bold text-white text-lg">ReceptionAI</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                      active ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-slate-800 text-rose-300 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
