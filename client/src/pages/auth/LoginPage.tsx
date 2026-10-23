import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2, X } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    setForgotLoading(true);

    try {
      const res = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotMessage(res.message || 'If an account exists with this email, password reset instructions have been sent.');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to submit password reset request.');
    } finally {
      setForgotLoading(false);
    }
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
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-purple-700 hover:text-purple-800 font-semibold"
                >
                  Forgot password?
                </button>
              </div>
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

          {/* Secure Evaluation Notice for Prospective Clients */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="text-center text-xs text-slate-500">
              Evaluating ReceptionAI for your medical practice?
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                to="/demo"
                className="py-2.5 px-3 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-700 font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Sandbox</span>
              </Link>
              <Link
                to="/register"
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Start Free Trial</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Reset Practice Password</h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMessage(null);
                  setForgotError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotMessage ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Enter your clinic account email address. We will verify your workspace and generate secure password reset instructions.
                </p>

                {forgotError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Email address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="doctor@clinic.com"
                    className="mt-1 w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Instructions'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
