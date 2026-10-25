import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, ArrowRight, ShieldCheck, CheckCircle2, Lock, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      if (err.statusCode === 401 || err.message?.toLowerCase().includes('invalid')) {
        setError("Account not found or password incorrect. If you haven't registered yet, click 'Create Account' above, or use 'One-Click Demo Sign In' below!");
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@apiwise.dev');
    setPassword('Password123!');
    setError(null);
    setLoading(true);
    try {
      await login('demo@apiwise.dev', 'Password123!');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-radial from-slate-900 via-slate-950 to-black relative overflow-hidden">
      {/* Decorative gradient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-glow mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Welcome to <span className="text-indigo-400">APIWise</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Intelligent API Testing, Automation, and Assertions Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-7 shadow-2xl border border-slate-800">
          {/* Sign In vs Sign Up Navigation Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 mb-5 border border-slate-800">
            <button
              type="button"
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-glow"
            >
              Sign In
            </button>
            <Link
              to="/register"
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white text-center transition-colors"
            >
              Create Account (Sign Up)
            </Link>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-glow flex items-center justify-center space-x-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Instant 1-Click Demo Sign In */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 text-indigo-300 font-semibold text-xs border border-indigo-500/30 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-glow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ One-Click Demo Sign In (No signup needed)</span>
            </button>
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-6 flex items-center justify-center space-x-4 text-[11px] text-slate-500">
          <span className="flex items-center space-x-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>BCrypt & JWT</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span>SSRF Guard</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-violet-400" />
            <span>AES-256 Secrets</span>
          </span>
        </div>
      </div>
    </div>
  );
};
