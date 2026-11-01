import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  BarChart3,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FlaskConical,
  Gauge,
  Info,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transaction Monitor', path: '/transactions', icon: Activity },
  { name: 'AI Predictions', path: '/predictions', icon: Cpu },
  {
    name: 'Failure Intelligence',
    path: '/failure-intelligence',
    icon: AlertOctagon,
  },
  { name: 'Bank Insights', path: '/bank-insights', icon: Landmark },
  { name: 'Transaction Simulator', path: '/simulator', icon: FlaskConical },
  { name: 'Model Performance', path: '/model-performance', icon: Gauge },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/transactions');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#101827] border-r border-[#1E293B] transition-all duration-200 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#1E293B]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/40 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-[#22D3EE]" />
            </div>
            {!collapsed && (
              <div>
                <div className="font-bold tracking-tight text-sm text-[#F8FAFC] flex items-center gap-1.5">
                  <span>FINPATH</span>
                  <span className="text-[#22D3EE]">AI</span>
                </div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">
                  Transaction Ops
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex p-1.5 rounded-md text-[#94A3B8] hover:text-white hover:bg-[#151F30]"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-[#94A3B8] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#3B82F6]/15 text-[#22D3EE] border border-[#3B82F6]/30'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#151F30]'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Model Status Footer */}
        <div className="p-3 border-t border-[#1E293B]">
          {!collapsed ? (
            <div className="p-3 rounded-lg bg-[#151F30] border border-[#1E293B] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                  ML Engine
                </span>
                <span className="text-[11px] font-mono text-[#22C55E]">
                  Active
                </span>
              </div>
              <div className="text-[11px] text-[#94A3B8]">
                Model 1 & Model 2 loaded (200k synthetic corpus)
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <ShieldCheck
                className="w-5 h-5 text-[#22C55E]"
                title="ML Engine Active"
              />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-[#101827]/90 backdrop-blur-md border-b border-[#1E293B] px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#151F30] text-[#94A3B8] hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <form onSubmit={handleGlobalSearch} className="relative w-full">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transaction ID (e.g. FP-00000042)..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#151F30] border border-[#1E293B] text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            {/* Current Date */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151F30] border border-[#1E293B] text-xs text-[#94A3B8]">
              <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>{formattedDate}</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 rounded-lg bg-[#151F30] border border-[#1E293B] text-[#94A3B8] hover:text-white transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#22D3EE]" />
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#151F30] border border-[#1E293B] shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                    <span className="text-xs font-semibold text-[#F8FAFC]">
                      Operational Telemetry Alerts
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3B82F6]/20 text-[#22D3EE]">
                      3 Active
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#0B1120] border border-[#1E293B]">
                      <div className="font-medium text-[#EF4444]">
                        Peak Hour Failure Concentration
                      </div>
                      <div className="text-[#94A3B8] mt-0.5">
                        Hour 20:00 UTC exhibits elevated failure rate (14.7%) in
                        synthetic telemetry.
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0B1120] border border-[#1E293B]">
                      <div className="font-medium text-[#F59E0B]">
                        Server Latency Threshold Alert
                      </div>
                      <div className="text-[#94A3B8] mt-0.5">
                        Server component accounts for 62.5% of highest-latency
                        failure attributions.
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0B1120] border border-[#1E293B]">
                      <div className="font-medium text-[#22C55E]">
                        Random Forest Artifacts Verified
                      </div>
                      <div className="text-[#94A3B8] mt-0.5">
                        Model 1 & Model 2 loaded with fixed random_state=42.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#1E293B]">
              <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-xs font-bold text-[#22D3EE]">
                {user?.full_name
                  ? user.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'FP'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-[#F8FAFC] leading-none">
                  {user?.full_name || 'Analyst'}
                </div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5">
                  {user?.is_demo ? 'Demo Session' : user?.role || 'Risk Ops'}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-[#151F30] border border-[#1E293B] text-[#94A3B8] hover:text-[#EF4444] hover:border-[#EF4444]/40 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Synthetic Telemetry Disclosure Banner */}
        <div className="bg-[#151F30]/80 border-b border-[#1E293B] px-4 lg:px-8 py-2 flex items-center justify-between gap-2 text-xs text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
            <span>
              <strong className="text-[#F8FAFC]">Simulation Notice:</strong> All
              200,000 initial transactions are synthetically generated for
              demonstration and machine learning evaluation purposes.
            </span>
          </div>
          <span className="hidden md:inline font-mono text-[11px] text-[#22D3EE]">
            Seed: 42 | Models: RandomForestClassifier
          </span>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

