import React, { useEffect, useState } from 'react';
import {
  Clock,
  Landmark,
  Layers,
  Server,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import { InfoTooltip } from '../components/InfoTooltip';

export const BankInsightsPage: React.FC = () => {
  const [hourlyData, setHourlyData] = useState<any>(null);
  const [compData, setCompData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getHourlyInsights(), api.getComponentInsights()])
      .then(([hRes, cRes]) => {
        setHourlyData(hRes);
        setCompData(cRes);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !hourlyData || !compData) {
    return (
      <div className="p-12 rounded-xl bg-[#151F30] border border-[#1E293B] text-center text-sm text-[#94A3B8] animate-pulse">
        Loading bank & infrastructure operational insights...
      </div>
    );
  }

  const hourly = hourlyData.hourly_distribution || [];
  const maxHeat = hourlyData.max_component_hourly_failures || 800;

  const getHeatColor = (val: number) => {
    const ratio = Math.min(1, val / maxHeat);
    if (ratio > 0.8) return 'bg-[#EF4444] text-white font-semibold';
    if (ratio > 0.6) return 'bg-[#EF4444]/75 text-white';
    if (ratio > 0.4) return 'bg-[#F59E0B]/70 text-white';
    if (ratio > 0.25) return 'bg-[#3B82F6]/50 text-[#F8FAFC]';
    return 'bg-[#1E293B] text-[#94A3B8]';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Bank & Infrastructure Operational Intelligence
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Understand settlement gateway behavior, peak failure hours, and
          component-level performance without requiring deep infrastructure
          expertise.
        </p>
      </div>

      {/* Top Executive Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs text-[#94A3B8]">
              Highest Failure Component
            </span>
            <div className="text-2xl font-bold font-mono text-[#F59E0B]">
              {compData.most_problematic_component}
            </div>
            <p className="text-xs text-[#94A3B8]">
              Primary bottleneck node in {compData.component_distribution[0]?.percentage}%
              of failed transactions.
            </p>
          </div>
          <Server className="w-5 h-5 text-[#F59E0B]" />
        </div>

        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs text-[#94A3B8]">Peak Failure Hour</span>
            <div className="text-2xl font-bold font-mono text-[#EF4444]">
              {String(hourlyData.peak_failure_hour).padStart(2, '0')}:00 UTC
            </div>
            <p className="text-xs text-[#94A3B8]">
              Avoid scheduling high-value batch settlements during 18:00–22:00
              UTC.
            </p>
          </div>
          <Clock className="w-5 h-5 text-[#EF4444]" />
        </div>

        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs text-[#94A3B8]">
              Bank Gateway Failure Share
            </span>
            <div className="text-2xl font-bold font-mono text-[#22D3EE]">
              {
                compData.component_distribution.find(
                  (c: any) => c.component === 'Bank'
                )?.percentage
              }
              %
            </div>
            <p className="text-xs text-[#94A3B8]">
              6,660 failed transactions linked to upstream bank gateway delays
              (&gt;80ms).
            </p>
          </div>
          <Landmark className="w-5 h-5 text-[#22D3EE]" />
        </div>
      </div>

      {/* 24-Hour Transaction Failure Heatmap */}
      <div className="p-6 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#F8FAFC]">
              Hourly Transaction Failure Heatmap (24 Hours × 3 Components)
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Visualizes exact failure counts for Server, Bank, and User across
              every hour of the day (00:00 to 23:00 UTC).
            </p>
          </div>
          <InfoTooltip
            title="Hourly Transaction Failure Heatmap"
            whatItRepresents="A 24-column matrix showing how many failures occurred in each component during every hour of the day."
            howToInterpret="Brighter amber and red cells indicate high concentrations of failures. Look at hours 18:00–22:00 on the Server and Bank rows."
            whyItMatters="Allows non-technical operations managers to immediately spot when and where payment reliability degrades."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-[#94A3B8] font-medium w-28">
                  Component
                </th>
                {hourly.map((h: any) => (
                  <th
                    key={h.hour}
                    className="p-1.5 font-mono text-[10px] text-[#94A3B8]"
                  >
                    {String(h.hour).padStart(2, '0')}h
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Server Node', key: 'server_failures' },
                { label: 'Bank Gateway', key: 'bank_failures' },
                { label: 'User Edge', key: 'user_failures' },
              ].map((row) => (
                <tr key={row.key}>
                  <td className="p-2 text-left font-semibold text-[#F8FAFC] bg-[#0B1120] rounded-md">
                    {row.label}
                  </td>
                  {hourly.map((h: any) => {
                    const val = h[row.key];
                    return (
                      <td
                        key={`${row.key}-${h.hour}`}
                        className={`p-2 rounded-md font-mono text-[11px] transition-transform hover:scale-105 ${getHeatColor(
                          val
                        )}`}
                        title={`${row.label} at ${h.hour_label}: ${val} failures`}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#1E293B] text-xs text-[#94A3B8]">
          <span>
            <strong className="text-[#F8FAFC]">How to read this chart:</strong>{' '}
            Each cell shows the number of failed transactions in that hour. Red
            cells highlight peak evening congestion (18:00–22:00 UTC).
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            <span>Low</span>
            <span className="w-4 h-3 rounded bg-[#1E293B]" />
            <span className="w-4 h-3 rounded bg-[#3B82F6]/50" />
            <span className="w-4 h-3 rounded bg-[#F59E0B]/70" />
            <span className="w-4 h-3 rounded bg-[#EF4444]" />
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Charts Row: Failure Rate by Hour & Load vs Failure Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failure Rate by Hour */}
        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F8FAFC]">
                Failure Rate Percentage by Hour (%)
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Percentage of transactions failing during each hour of the day
              </p>
            </div>
            <InfoTooltip
              title="Failure Rate by Hour"
              whatItRepresents="The percentage of total transactions in each hour that failed to complete."
              howToInterpret="A flat baseline around 10.8% rises sharply to 14.7% at 20:00 UTC."
              whyItMatters="Shows that evening failures are not merely due to higher volume, but higher per-transaction failure probability."
            />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly}>
                <defs>
                  <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E293B"
                  vertical={false}
                />
                <XAxis dataKey="hour_label" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="failure_rate"
                  name="Hourly Failure Rate (%)"
                  stroke="#22D3EE"
                  fill="url(#rateGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-[#94A3B8] pt-2 border-t border-[#1E293B]">
            <strong className="text-[#F8FAFC]">Explanatory Caption:</strong>{' '}
            During hours 18:00–22:00, elevated concurrency increases transaction
            drop-off rate by ~3.8 percentage points.
          </p>
        </div>

        {/* Load vs Failure Volume Comparison */}
        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F8FAFC]">
                System Load vs Transaction Outcomes
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Successful vs failed transaction counts across load tiers
              </p>
            </div>
            <InfoTooltip
              title="Load vs Failure Analysis"
              whatItRepresents="Compares successful and failed transaction volumes across system load ranges."
              howToInterpret="As concurrent load climbs above 20,000 req/s, the red failure bar expands rapidly."
              whyItMatters="Demonstrates how queue saturation degrades end-to-end payment completion."
            />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compData.load_analysis}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E293B"
                  vertical={false}
                />
                <XAxis dataKey="bucket" stroke="#94A3B8" fontSize={10} />
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
                <Bar
                  dataKey="successful"
                  name="Successful Tx"
                  fill="#22C55E"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="failed"
                  name="Failed Tx"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-[#94A3B8] pt-2 border-t border-[#1E293B]">
            <strong className="text-[#F8FAFC]">Explanatory Caption:</strong>{' '}
            Maintaining system load below 20,000 requests/second keeps failure
            rates under 7.5%.
          </p>
        </div>
      </div>

      {/* Component-Level Performance Comparison Table */}
      <div className="p-6 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#F8FAFC]">
              Component-Level Performance Comparison
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Side-by-side latency and failure attribution metrics for Server,
              Bank, and User nodes.
            </p>
          </div>
          <Layers className="w-5 h-5 text-[#3B82F6]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0B1120] text-[#94A3B8] uppercase text-[11px]">
                <th className="py-3 px-4">Component Node</th>
                <th className="py-3 px-4">Attributed Failures</th>
                <th className="py-3 px-4">Share of Failures</th>
                <th className="py-3 px-4">Overall Mean Latency</th>
                <th className="py-3 px-4">Mean Latency on Failure</th>
                <th className="py-3 px-4">95th Percentile (P95)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {compData.component_distribution.map((c: any) => (
                <tr key={c.component} className="hover:bg-[#1E293B]/40">
                  <td className="py-3.5 px-4 font-semibold text-[#F8FAFC]">
                    {c.component} Layer
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#EF4444] font-semibold">
                    {c.failures.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#22D3EE]">
                    {c.percentage}%
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#F8FAFC]">
                    {c['avg_latency_ overall']} ms
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#F59E0B] font-semibold">
                    {c.avg_latency_on_failure} ms
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#94A3B8]">
                    {c.p95_latency} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

