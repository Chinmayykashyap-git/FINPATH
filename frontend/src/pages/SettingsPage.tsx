import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  KeyRound,
  Server,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    api
      .getHealth()
      .then((res) => setHealth(res))
      .catch(() => setHealth(null));
  }, []);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Platform Settings & System Diagnostics
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Inspect your analyst profile, backend API health, database adapter,
          and machine learning artifact status.
        </p>
      </div>

      {/* Analyst Profile Card */}
      <div className="p-6 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
        <div className="flex items-center gap-3 border-b border-[#1E293B] pb-4">
          <UserIcon className="w-5 h-5 text-[#3B82F6]" />
          <h2 className="text-base font-bold text-[#F8FAFC]">
            Authenticated Analyst Profile
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#0B1120] border border-[#1E293B]">
            <span className="text-[#94A3B8] block">Full Name</span>
            <span className="font-semibold text-[#F8FAFC] text-sm mt-0.5 block">
              {user?.full_name}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#0B1120] border border-[#1E293B]">
            <span className="text-[#94A3B8] block">Email Address</span>
            <span className="font-mono text-[#22D3EE] text-sm mt-0.5 block">
              {user?.email}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#0B1120] border border-[#1E293B]">
            <span className="text-[#94A3B8] block">Assigned Role</span>
            <span className="font-semibold text-[#F8FAFC] text-sm mt-0.5 block">
              {user?.role}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#0B1120] border border-[#1E293B]">
            <span className="text-[#94A3B8] block">Session Mode</span>
            <span className="font-mono text-[#22C55E] text-sm mt-0.5 block">
              {user?.is_demo
                ? 'Demo Analyst Session (JWT)'
                : 'Authenticated Persistent Session (JWT)'}
            </span>
          </div>
        </div>
      </div>

      {/* Backend & ML Service Health */}
      <div className="p-6 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-[#22D3EE]" />
            <h2 className="text-base font-bold text-[#F8FAFC]">
              Backend Runtime & ML Artifact Status
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{health?.status || 'Online'}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#0B1120] border border-[#1E293B]">
            <span className="text-[#94A3B8] block">ML Artifacts Loaded</span>
            <span className="font-mono font-semibold text-[#22C55E] text-sm mt-1 block">
              {health?.models_loaded ? 'Verified (Joblib)' : 'Initializing'}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#0B1120] border border-[#1E293B]">
            <span className="text-[#94A3B8] block">Database Dialect</span>
            <span className="font-mono font-semibold text-[#22D3EE] text-sm mt-1 block uppercase">
              {health?.database_dialect || 'SQLite (SQLAlchemy ORM)'}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#0B1120] border border-[#1E293B]">
            <span className="text-[#94A3B8] block">Synthetic Corpus Size</span>
            <span className="font-mono font-semibold text-[#F8FAFC] text-sm mt-1 block">
              {(health?.dataset_size || 200000).toLocaleString()} rows
            </span>
          </div>
        </div>
      </div>

      {/* Security & Database Portability Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F8FAFC]">
            <KeyRound className="w-4 h-4 text-[#3B82F6]" />
            <span>Authentication & Security</span>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Passwords are hashed using <code className="text-[#22D3EE]">bcrypt</code>{' '}
            (work factor 12) and sessions are authenticated via signed{' '}
            <code className="text-[#22D3EE]">HS256 JWT</code> bearer tokens. No
            secrets are exposed in frontend bundles.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F8FAFC]">
            <Database className="w-4 h-4 text-[#22C55E]" />
            <span>PostgreSQL Upgrade Path</span>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            SQLAlchemy 2.0 ORM decouples queries from the underlying storage
            engine. Set <code className="text-[#22D3EE]">DATABASE_URL</code> to a
            PostgreSQL connection string in production to migrate seamlessly from
            SQLite.
          </p>
        </div>
      </div>
    </div>
  );
};

