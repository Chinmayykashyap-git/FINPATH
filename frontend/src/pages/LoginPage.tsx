import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotNotice, setForgotNotice] = useState(false);

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes('@')) {
      setError('Please enter a valid corporate or personal email address.');
      return;
    }

    if (mode === 'register') {
      if (fullName.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password, rememberMe);
      } else {
        await register(fullName, email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.message ||
          'Unable to start demo session. Ensure the FastAPI backend is running.'
      );
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] flex flex-col lg:flex-row relative overflow-hidden">
      {/* Subtle architectural grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #3B82F6 1px, transparent 1px), linear-gradient(to bottom, #3B82F6 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Left Section — Brand & Product Intelligence */}
      <div className="lg:w-7/12 p-8 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#1E293B] bg-[#101827]/60 relative z-10">
        <div>
          {/* FINPATH AI Logo */}
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/40 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#22D3EE]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#F8FAFC]">
                FINPATH <span className="text-[#22D3EE]">AI</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-[#94A3B8]">
                Transaction Intelligence Platform
              </span>
            </div>
          </div>

          {/* Headline & Product Description */}
          <div className="mt-12 lg:mt-20 max-w-xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151F30] border border-[#1E293B] text-xs text-[#22D3EE]">
              <Shield className="w-3.5 h-3.5" />
              <span>Enterprise Payment Telemetry & ML Diagnostics</span>
            </div>

            <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-[#F8FAFC] leading-tight">
              Understand Every Transaction.{' '}
              <span className="text-[#3B82F6]">Predict Every Failure.</span>
            </h1>

            <p className="text-base text-[#94A3B8] leading-relaxed">
              An AI-powered transaction intelligence and failure prediction
              platform that analyzes transaction performance, predicts
              transaction success, identifies potential failure points, and
              generates actionable operational insights.
            </p>
          </div>

          {/* Three Feature Highlights */}
          <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-2xl">
            <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 flex items-center justify-center text-[#3B82F6]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                1. Predict transaction outcomes.
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Random Forest ensemble evaluates latency and system load to
                estimate completion probability.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/15 flex items-center justify-center text-[#22D3EE]">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                2. Identify failure points.
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Multi-class Failure Node Analyzer isolates User, Server, or Bank
                gateway bottlenecks.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/15 flex items-center justify-center text-[#22C55E]">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                3. Discover operational bottlenecks.
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Explore 200,000 simulated transactions with hourly heatmaps and
                real-time simulation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Telemetry Summary */}
        <div className="mt-12 pt-6 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <span>200,000 Simulated Transactions Analyzed</span>
          <span className="font-mono text-[#22D3EE]">
            Dual-Stage Scikit-Learn Random Forest Pipeline
          </span>
        </div>
      </div>

      {/* Right Section — Authentication Card */}
      <div className="lg:w-5/12 p-6 sm:p-12 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#151F30] border border-[#1E293B] shadow-2xl space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-[#F8FAFC]">
              {mode === 'login'
                ? 'Sign in to FinPath AI'
                : 'Create Analyst Account'}
            </h2>
            <p className="text-xs text-[#94A3B8]">
              {mode === 'login'
                ? 'Enter your credentials or launch an instant demo session.'
                : 'Register a new account to access the transaction intelligence workspace.'}
            </p>
          </div>

          {/* Demo Access Button */}
          <div className="p-3.5 rounded-xl bg-[#0B1120] border border-[#3B82F6]/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#22D3EE] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Instant Portfolio Evaluation
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3B82F6]/15 text-[#94A3B8]">
                No signup required
              </span>
            </div>
            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={demoLoading || loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
            >
              <span>
                {demoLoading
                  ? 'Initializing Demo Session...'
                  : 'Launch Interactive Demo Workspace'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#1E293B]" />
            <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-[#94A3B8]">
              Or continue with email
            </span>
            <div className="flex-grow border-t border-[#1E293B]" />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-2.5 text-xs text-[#EF4444]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {forgotNotice && (
            <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-xs text-[#94A3B8] space-y-1">
              <div className="font-semibold text-[#F8FAFC]">
                Password Reset Policy
              </div>
              <p>
                In local or container deployments, use the{' '}
                <strong className="text-[#22D3EE]">
                  Launch Interactive Demo Workspace
                </strong>{' '}
                button above or register a new analyst profile below.
              </p>
            </div>
          )}

          <form onSubmit={validateAndSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@institution.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#3B82F6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-[#94A3B8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#1E293B] bg-[#0B1120] text-[#3B82F6] focus:ring-0"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotNotice((f) => !f)}
                  className="text-[#3B82F6] hover:text-[#22D3EE]"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#3B82F6]/30 text-sm font-semibold text-[#F8FAFC] transition-colors disabled:opacity-50"
            >
              {loading
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[#94A3B8]">
            {mode === 'login' ? (
              <>
                Don&apos;t have an analyst account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="text-[#22D3EE] font-medium hover:underline"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-[#22D3EE] font-medium hover:underline"
                >
                  Return to sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

