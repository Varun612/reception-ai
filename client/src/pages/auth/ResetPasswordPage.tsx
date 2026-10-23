import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { Sparkles, ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const userId = searchParams.get('userId') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !userId) {
      setError('Invalid or missing password reset link parameters.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ userId, token, newPassword }),
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-bold text-slate-900">Set New Practice Password</h2>
        <p className="mt-2 text-xs text-slate-600">
          Enter your new password below to secure your practice workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-soft sm:rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          {success ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Password Reset Successful!</span>
              </div>
              <p>Your password has been updated. Redirecting to workspace sign in...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">New Password</label>
                  <div className="mt-1 relative">
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600 pl-10"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                  <div className="mt-1 relative">
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
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
                  <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          <div className="pt-2 text-center">
            <Link to="/login" className="text-xs font-semibold text-purple-700 hover:text-purple-800">
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
