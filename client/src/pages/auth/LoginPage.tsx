import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(data.token, data.user, data.tenants);

      if (data.user.isPlatformAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
            Reception<span className="text-purple-600">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900">Sign in to your practice workspace</h2>
        <p className="mt-2 text-xs text-slate-600">
          Or{' '}
          <Link to="/register" className="font-semibold text-purple-700 hover:text-purple-800">
            start your 14-day free trial
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-soft sm:rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email address</label>
              <div className="mt-1 relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600 pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="mt-1 relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600 pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 transition-all shadow-sm disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign in to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Picker */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Quick Test Logins (Demo Seed)
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('dr.lin@apexdentalspa.com', 'DentalOwner123!')}
                className="w-full text-left p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 transition-colors text-xs"
              >
                <div className="font-semibold text-purple-900">Dr. Sarah Lin (Apex Dental Spa)</div>
                <div className="text-[10px] text-purple-600">dr.lin@apexdentalspa.com • US Dental Clinic</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('admin@receptionai.com', 'AdminPassword123!')}
                className="w-full text-left p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 transition-colors text-xs"
              >
                <div className="font-semibold text-amber-900">Platform Super-Admin</div>
                <div className="text-[10px] text-amber-700">admin@receptionai.com • Platform Control Plane</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('dr.smith@smilecraft.co.uk', 'LondonDental123!')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs"
              >
                <div className="font-semibold text-slate-800">Dr. Arthur Smith (SmileCraft UK)</div>
                <div className="text-[10px] text-slate-500">dr.smith@smilecraft.co.uk • Multi-Tenant Isolation Test</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
