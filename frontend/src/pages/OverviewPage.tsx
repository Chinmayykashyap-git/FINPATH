import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FlaskConical,
  Landmark,
  Percent,
  Server,
  User as UserIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import { DashboardChartsResponse, DashboardSummaryResponse } from '../types';
import { InfoTooltip } from '../components/InfoTooltip';

const TIME_WINDOWS = [
  { label: 'All Hours (00:00–23:00)', start: 0, end: 23 },
  { label: 'Business Hours (08:00–17:00)', start: 8, end: 17 },
  { label: 'Peak Evening (18:00–22:00)', start: 18, end: 22 },
  { label: 'Overnight (00:00–07:00)', start: 0, end: 7 },
];

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [charts, setCharts] = useState<DashboardChartsResponse | null>(null);
  const [windowIdx, setWindowIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const win = TIME_WINDOWS[windowIdx];
    setLoading(true);
    Promise.all([
      api.getDashboardSummary(),
      api.getDashboardCharts(win.start, win.end),
    ])
      .then(([sumRes, chartRes]) => {
        if (!active) return;
        setSummary(sumRes);
        setCharts(chartRes);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to load dashboard telemetry.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [windowIdx]);

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-[#151F30] border border-[#EF4444]/40 text-sm text-[#EF4444]">
        Error loading dashboard: {error}
      </div>
    );
  }

  const kpis = summary?.kpis;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Transaction Intelligence
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Monitor transaction performance, identify operational bottlenecks,
            and understand transaction failure patterns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter */}
          <div className="flex items-center gap-2 bg-[#151F30] border border-[#1E293B] rounded-lg px-3 py-1.5">
            <Clock className="w-4 h-4 text-[#22D3EE]" />
            <select
              value={windowIdx}
              onChange={(e) => setWindowIdx(Number(e.target.value))}
              className="bg-transparent text-xs text-[#F8FAFC] focus:outline-none"
            >
              {TIME_WINDOWS.map((w, idx) => (
                <option key={w.label} value={idx} className="bg-[#101827]">
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigate('/simulator')}
            className="px-3.5 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-xs font-semibold text-white flex items-center gap-2 transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Open Transaction Simulator</span>
          </button>
        </div>
      </div>

      {/* 7 Key Performance Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {/* 1. Total Transactions */}
        <div
          onClick={() => navigate('/transactions')}
          className="cursor-pointer p-4 rounded-xl bg-[#151F30] border border-[#1E293B] hover:border-[#3B82F6]/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94A3B8]">
              Total Transactions
            </span>
            <Activity className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-[#F8FAFC]">
              {kpis ? kpis.total_transactions.toLocaleString() : '—'}
            </div>
            <div className="text-[11px] text-[#22D3EE] flex items-center gap-1 mt-1">
              <span>24h Synthetic Corpus</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-snug">
            Total simulated payment volume analyzed across all 24 hours.
          </p>
        </div>

        {/* 2. Successful Transactions */}
        <div
          onClick={() => navigate('/transactions?status=success')}
          className="cursor-pointer p-4 rounded-xl bg-[#151F30] border border-[#1E293B] hover:border-[#22C55E]/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94A3B8]">
              Successful Tx
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-[#22C55E]">
              {kpis ? kpis.successful_transactions.toLocaleString() : '—'}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">
              Click to filter successful
            </div>
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-snug">
            Transactions settled without timeout or gateway rejection.
          </p>
        </div>

        {/* 3. Failed Transactions */}
        <div
          onClick={() => navigate('/transactions?status=failed')}
          className="cursor-pointer p-4 rounded-xl bg-[#151F30] border border-[#1E293B] hover:border-[#EF4444]/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94A3B8]">
              Failed Transactions
            </span>
            <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-[#EF4444]">
              {kpis ? kpis.failed_transactions.toLocaleString() : '—'}
            </div>
            <div className="text-[11px] text-[#EF4444] flex items-center gap-1 mt-1">
              <span>{kpis ? `${kpis.failure_rate}% failure rate` : ''}</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-snug">
            Click to inspect failed transactions in Transaction Monitor.
          </p>
        </div>

        {/* 4. Transaction Success Rate */}
        <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94A3B8]">
              Success Rate
            </span>
            <Percent className="w-4 h-4 text-[#22D3EE]" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-[#F8FAFC]">
              {kpis ? `${kpis.success_rate}%` : '—'}
            </div>
            {kpis && (
              <div className="text-[11px] text-[#F59E0B] mt-1">
                Peak hrs: {kpis.comparisons.peak_window_success_rate}% vs{' '}
                {kpis.comparisons.off_peak_success_rate}% off-peak
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-snug">
            Percentage of transactions completed successfully out of all
            analyzed transactions.
          </p>
        </div>

        {/* 5. Average User Latency */}
        <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94A3B8]">
              Avg User Latency
            </span>
            <UserIcon className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-[#F8FAFC]">
              {kpis ? `${kpis.avg_user_latency} ms` : '—'}
            </div>
            {kpis && (
              <div className="text-[11px] text-[#94A3B8] mt-1">
                +{kpis.comparisons.failed_vs_success_user_latency_delta} ms on
                failures
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-snug">
            Client-to-edge network latency (~50ms baseline).
          </p>
        </div>

        {/* 6. Average Server Latency */}
        <div
          onClick={() => navigate('/failure-intelligence')}
          className="cursor-pointer p-4 rounded-xl bg-[#151F30] border border-[#1E293B] hover:border-[#F59E0B]/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94A3B8]">
              Avg Server Latency
            </span>
            <Server className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-[#F8FAFC]">
              {kpis ? `${kpis.avg_server_latency} ms` : '—'}
            </div>
            {kpis && (
              <div className="text-[11px] text-[#EF4444] mt-1">
                +{kpis.comparisons.failed_vs_success_server_latency_delta} ms on
                failures
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-snug">
            Measures server processing time. Above 90ms indicates contention.
          </p>
        </div>

        {/* 7. Average Bank Latency */}
        <div
          onClick={() => navigate('/bank-insights')}
          className="cursor-pointer p-4 rounded-xl bg-[#151F30] border border-[#1E293B] hover:border-[#22D3EE]/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94A3B8]">
              Avg Bank Latency
            </span>
            <Landmark className="w-4 h-4 text-[#22D3EE]" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-[#F8FAFC]">
              {kpis ? `${kpis.avg_bank_latency} ms` : '—'}
            </div>
            {kpis && (
              <div className="text-[11px] text-[#F59E0B] mt-1">
                +{kpis.comparisons.failed_vs_success_bank_latency_delta} ms on
                failures
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-snug">
            Upstream bank settlement response time (~60ms baseline).
          </p>
        </div>
      </div>

      {loading && !charts ? (
        <div className="p-12 rounded-xl bg-[#151F30] border border-[#1E293B] text-center text-sm text-[#94A3B8] animate-pulse">
          Loading transaction intelligence charts...
        </div>
      ) : (
        charts && (
          <div className="space-y-6">
            {/* Row 1: Chart B (Hourly Volume) + Chart A (Success vs Failure) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart B: Transaction Volume Over Time */}
              <div className="lg:col-span-2 p-5 rounded-xl bg-[#151F30] border border-[#1E293B] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h2 className="text-base font-semibold text-[#F8FAFC]">
                        B. Transaction Volume & Outcomes Over Time
                      </h2>
                      <p className="text-xs text-[#94A3B8]">
                        Hourly distribution of successful and failed
                        transactions ({TIME_WINDOWS[windowIdx].label})
                      </p>
                    </div>
                    <InfoTooltip
                      title="Transaction Volume Over Time"
                      whatItRepresents="Hourly count of successful and failed transactions across the 24-hour cycle."
                      howToInterpret="Compare the red failure band against the green success band. Notice the failure surge during evening peak hours (18:00–22:00)."
                      whyItMatters="Helps infrastructure teams schedule auto-scaling and avoid running heavy batch jobs during peak failure hours."
                    />
                  </div>

                  <div className="h-72 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={charts.hourly_volume}>
                        <defs>
                          <linearGradient
                            id="succGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#22C55E"
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="95%"
                              stopColor="#22C55E"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                          <linearGradient
                            id="failGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#EF4444"
                              stopOpacity={0.5}
                            />
                            <stop
                              offset="95%"
                              stopColor="#EF4444"
                              stopOpacity={0.05}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1E293B"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="hour_label"
                          stroke="#94A3B8"
                          fontSize={11}
                        />
                        <YAxis stroke="#94A3B8" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area
                          type="monotone"
                          dataKey="successful"
                          name="Successful Tx"
                          stroke="#22C55E"
                          fill="url(#succGrad)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="failed"
                          name="Failed Tx"
                          stroke="#EF4444"
                          fill="url(#failGrad)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#1E293B] text-xs text-[#94A3B8]">
                  <strong className="text-[#F8FAFC]">Operational Note:</strong>{' '}
                  Evening concurrency between 18:00 and 22:00 UTC elevates the
                  hourly failure rate from ~10.8% to ~14.7%.
                </div>
              </div>

              {/* Chart A: Transaction Success vs Failure */}
              <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h2 className="text-base font-semibold text-[#F8FAFC]">
                        A. Transaction Success vs Failure
                      </h2>
                      <p className="text-xs text-[#94A3B8]">
                        Outcome split for selected time window
                      </p>
                    </div>
                    <InfoTooltip
                      title="Transaction Success vs Failure"
                      whatItRepresents="Proportion and absolute count of successful vs failed transactions."
                      howToInterpret="Green indicates completed transactions; Red indicates failed transactions."
                      whyItMatters="Provides an immediate health baseline of overall payment reliability."
                    />
                  </div>

                  <div className="h-56 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.success_vs_failure}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {charts.success_vs_failure.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {charts.success_vs_failure.map((item) => (
                      <div
                        key={item.name}
                        className="p-2.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-center"
                      >
                        <div className="text-xs text-[#94A3B8]">{item.name}</div>
                        <div
                          className="text-sm font-bold font-mono mt-0.5"
                          style={{ color: item.color }}
                        >
                          {item.count.toLocaleString()} ({item.percentage}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#1E293B] text-xs text-[#94A3B8]">
                  <strong className="text-[#F8FAFC]">Why it matters:</strong>{' '}
                  Even a 1% increase in failure rate represents thousands of
                  disrupted customer payments.
                </div>
              </div>
            </div>

            {/* Row 2: Chart C (Failure by Component), Chart D (Latency Analysis), Chart E (System Load) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart C: Failure Distribution by Component */}
              <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h2 className="text-base font-semibold text-[#F8FAFC]">
                        C. Failure Distribution by Component
                      </h2>
                      <p className="text-xs text-[#94A3B8]">
                        Highest-latency node on failed transactions
                      </p>
                    </div>
                    <InfoTooltip
                      title="Failure Distribution by Component"
                      whatItRepresents="Breakdown of failed transactions by the infrastructure node (Server, Bank, or User) with highest latency."
                      howToInterpret="Taller bars indicate the component most frequently associated with transaction failures."
                      whyItMatters="Directs engineering remediation toward the primary bottleneck layer."
                    />
                  </div>

                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.failure_by_component}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1E293B"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="component"
                          stroke="#94A3B8"
                          fontSize={12}
                        />
                        <YAxis stroke="#94A3B8" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="failures"
                          name="Failed Transactions"
                          radius={[6, 6, 0, 0]}
                        >
                          {charts.failure_by_component.map((entry) => (
                            <Cell
                              key={entry.component}
                              fill={
                                entry.component === 'Server'
                                  ? '#F59E0B'
                                  : entry.component === 'Bank'
                                  ? '#3B82F6'
                                  : '#22D3EE'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#1E293B] text-xs text-[#94A3B8]">
                  <strong className="text-[#F8FAFC]">Interpretation:</strong>{' '}
                  Server latency accounts for ~62.5% of synthetic failure node
                  attributions, followed by Bank (~28.8%) and User (~8.8%).
                </div>
              </div>

              {/* Chart D: Latency Analysis */}
              <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h2 className="text-base font-semibold text-[#F8FAFC]">
                        D. Component Latency Analysis (ms)
                      </h2>
                      <p className="text-xs text-[#94A3B8]">
                        Successful vs Failed mean latency & P95
                      </p>
                    </div>
                    <InfoTooltip
                      title="Component Latency Analysis"
                      whatItRepresents="Compares average latency (in milliseconds) for User, Server, and Bank across successful vs failed transactions."
                      howToInterpret="Compare the red bar (Failed Mean) against the green bar (Success Mean) and cyan bar (95th Percentile)."
                      whyItMatters="Quantifies how latency spikes in Server (>90ms) and Bank (>80ms) drive transaction failures."
                    />
                  </div>

                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.latency_analysis}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1E293B"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="component"
                          stroke="#94A3B8"
                          fontSize={12}
                        />
                        <YAxis stroke="#94A3B8" fontSize={11} unit="ms" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar
                          dataKey="success_mean"
                          name="Success Mean (ms)"
                          fill="#22C55E"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="failure_mean"
                          name="Failed Mean (ms)"
                          fill="#EF4444"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="p95"
                          name="P95 Tail (ms)"
                          fill="#22D3EE"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#1E293B] text-xs text-[#94A3B8]">
                  <strong className="text-[#F8FAFC]">Why it matters:</strong>{' '}
                  Failed transactions exhibit +14.8ms higher server latency and
                  +11.6ms higher bank latency on average.
                </div>
              </div>

              {/* Chart E: System Load Analysis */}
              <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h2 className="text-base font-semibold text-[#F8FAFC]">
                        E. System Load vs Failure Rate (%)
                      </h2>
                      <p className="text-xs text-[#94A3B8]">
                        Transaction instability across concurrency tiers
                      </p>
                    </div>
                    <InfoTooltip
                      title="System Load Analysis"
                      whatItRepresents="Transaction failure rate (%) across six concurrent system load tiers from 10,000 to 25,000 req/s."
                      howToInterpret="Notice the sharp inflection point once system load crosses 20,000 req/s."
                      whyItMatters="Establishes safe concurrency capacity limits for load balancers and rate limiters."
                    />
                  </div>

                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.system_load_analysis}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1E293B"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="bucket"
                          stroke="#94A3B8"
                          fontSize={10}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={45}
                        />
                        <YAxis stroke="#94A3B8" fontSize={11} unit="%" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="failure_rate"
                          name="Failure Rate (%)"
                          radius={[6, 6, 0, 0]}
                        >
                          {charts.system_load_analysis.map((entry) => (
                            <Cell
                              key={entry.bucket}
                              fill={
                                entry.failure_rate > 15
                                  ? '#EF4444'
                                  : entry.failure_rate > 9
                                  ? '#F59E0B'
                                  : '#3B82F6'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#1E293B] text-xs text-[#94A3B8]">
                  <strong className="text-[#F8FAFC]">Capacity Threshold:</strong>{' '}
                  Failure rates remain ~7.4% below 19k req/s but surge to 24.4%
                  at 23k–25k req/s.
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

