import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { User, UserRole } from '../types';

interface AdminAuthProps {
  onLogin: (user: User) => void;
}

type AlertType = 'success' | 'error' | '';

const AdminAuth: React.FC<AdminAuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAlertType('');
    setLoading(true);

    if (!email.includes('@') || password.length < 6) {
      setError('Please enter a valid email and password (min 6 characters)');
      setAlertType('error');
      setLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem('admin_credentials');
      if (!stored) {
        setError('No admin account found. Contact system administrator.');
        setAlertType('error');
        setLoading(false);
        return;
      }

      const { email: storedEmail, password: storedPassword } = JSON.parse(stored);
      if (email !== storedEmail || password !== storedPassword) {
        setError('Invalid email or password');
        setAlertType('error');
        setLoading(false);
        return;
      }

      const adminUser: User = {
        id: 'admin-' + Date.now(),
        name: email.split('@')[0],
        role: UserRole.ADMIN
      };

      setAlertType('success');
      setError('Login successful. Redirecting…');

      setTimeout(() => {
        onLogin(adminUser);
      }, 800);
    } catch {
      setError('Authentication failed');
      setAlertType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center">
            <ShieldCheck className="w-9 h-9 text-blue-700" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Admin Access
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authorized personnel only
          </p>
        </div>

        {/* ALERT */}
        {alertType && (
          <div
            className={`mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium
              ${
                alertType === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
          >
            {alertType === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-slate-800
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white
                       hover:bg-blue-700 active:scale-[0.98]
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all"
          >
            {loading ? 'Authenticating…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAuth;
