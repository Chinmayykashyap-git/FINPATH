import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lightbulb,
  Server,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import { FailureIntelligenceResponse } from '../types';
import { InfoTooltip } from '../components/InfoTooltip';

export const FailureIntelligencePage: React.FC = () => {
  const [data, setData] = useState<FailureIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getFailureIntelligence()
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 rounded-xl bg-[#151F30] border border-[#1E293B] text-center text-sm text-[#94A3B8] animate-pulse">
        Loading failure intelligence & root-cause analytics...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Failure Intelligence & Diagnostic Patterns
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Investigate why transactions fail across User, Server, and Bank layers
          and review data-driven operational recommendations.
        </p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Most Problematic Component</span>
            <Server className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#EF4444]">
            {data.most_problematic_component}
          </div>
          <p className="text-xs text-[#94A3B8]">
            Accounts for {data.component_distribution[0]?.percentage}% of all
            failed transaction attributions.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Total Failed Transactions</span>
            <AlertOctagon className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F8FAFC]">
            {data.total_failures.toLocaleString()}
          </div>
          <p className="text-xs text-[#94A3B8]">
            Out of 200,000 simulated transactions analyzed.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Overall Failure Percentage</span>
            <TrendingUp className="w-4 h-4 text-[#22D3EE]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F59E0B]">
            {data.failure_percentage}%
          </div>
          <p className="text-xs text-[#94A3B8]">
            Includes baseline stochastic failures and threshold stress events.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Peak Failure Hour</span>
            <Clock className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#22D3EE]">
            {String(data.peak_failure_hour).padStart(2, '0')}:00 UTC
          </div>
          <p className="text-xs text-[#94A3B8]">
            Highest concentration of transaction instability during evening load.
          </p>
        </div>
      </div>

      {/* Charts Row: Component Distribution & Hourly Failure Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failure Distribution by Component */}
        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F8FAFC]">
                Failure Distribution by Component
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Number and share of failed transactions attributed to each node
              </p>
            </div>
            <InfoTooltip
              title="Failure Distribution by Component"
              whatItRepresents="Count of failed transactions grouped by highest-latency component."
              howToInterpret="Server (62.5%) and Bank (28.8%) dominate failure attributions compared with User (8.8%)."
              whyItMatters="Pinpoints whether engineering efforts should focus on internal server scaling or external bank gateway timeouts."
            />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.component_distribution} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E293B"
                  horizontal={false}
                />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="component"
                  stroke="#F8FAFC"
                  fontSize={12}
                  width={70}
                />
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
                  radius={[0, 6, 6, 0]}
                >
                  {data.component_distribution.map((entry) => (
                    <Cell
                      key={entry.component}
                      fill={
                        entry.component === 'Server'
                          ? '#EF4444'
                          : entry.component === 'Bank'
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

        {/* Failure Frequency by Hour */}
        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F8FAFC]">
                Failure Frequency by Hour (00:00–23:00 UTC)
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Hourly failed transaction count across the 24-hour cycle
              </p>
            </div>
            <InfoTooltip
              title="Failure Frequency by Hour"
              whatItRepresents="Total failed transactions occurring during each hour of the day."
              howToInterpret="Observe the plateau between 00:00–17:00 (~900 failures/hr) and the spike between 18:00–22:00 (~1,200+ failures/hr)."
              whyItMatters="Reveals temporal vulnerability windows where automated capacity scaling should be scheduled."
            />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.hourly_failures}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E293B"
                  vertical={false}
                />
                <XAxis dataKey="hour_label" stroke="#94A3B8" fontSize={11} />
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
                <Line
                  type="monotone"
                  dataKey="failed"
                  name="Total Failures"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="server_failures"
                  name="Server Failures"
                  stroke="#F59E0B"
                  strokeWidth={1.8}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bank_failures"
                  name="Bank Failures"
                  stroke="#3B82F6"
                  strokeWidth={1.8}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latency Distribution & High-Load Failure Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F8FAFC]">
                Latency Shift: Successful vs Failed Transactions
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Mean latency (ms) and instability threshold per component
              </p>
            </div>
            <InfoTooltip
              title="Latency Distribution Comparison"
              whatItRepresents="Comparison of component latency between transactions that succeeded and transactions that failed."
              howToInterpret="Failed transactions consistently show elevated Server and Bank latencies near or above their instability thresholds (90ms and 80ms)."
              whyItMatters="Confirms that tail latency spikes strongly correlate with transaction drop-offs."
            />
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.latency_comparison}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E293B"
                  vertical={false}
                />
                <XAxis dataKey="component" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={11} unit="ms" />
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
                  dataKey="success_mean"
                  name="Successful Mean (ms)"
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
                  dataKey="threshold"
                  name="Alert Threshold (ms)"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F8FAFC]">
                High-Load Failure Patterns
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Failed transaction volume and failure rate across load tiers
              </p>
            </div>
            <InfoTooltip
              title="High-Load Failure Patterns"
              whatItRepresents="Shows how transaction failures escalate when concurrent system load exceeds 20,000 req/s."
              howToInterpret="Failure rate more than triples from Low load (7.35%) to Critical load (24.35%)."
              whyItMatters="Guides queue backpressure and rate-limiting policies during high-concurrency events."
            />
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.load_analysis}>
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
                  dataKey="failed"
                  name="Failed Transactions"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data-Driven Intelligent Insights & Actionable Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intelligent Insights */}
        <div className="p-6 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#22D3EE]" />
            <h2 className="text-base font-bold text-[#F8FAFC]">
              Data-Driven Operational Insights
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Generated dynamically from statistical aggregations of the 200,000
            transaction dataset.
          </p>

          <div className="space-y-3">
            {data.insights.map((ins) => (
              <div
                key={ins.id}
                className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#22D3EE]">
                    {ins.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      ins.severity === 'high'
                        ? 'bg-[#EF4444]/15 text-[#EF4444]'
                        : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                    }`}
                  >
                    {ins.severity} priority
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  {ins.title}
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {ins.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Recommendations Panel */}
        <div className="p-6 rounded-xl bg-[#151F30] border border-[#1E293B] flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
              <h2 className="text-base font-bold text-[#F8FAFC]">
                Recommended Operational Mitigations
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Suggested engineering and routing actions based on observed
              latency and load patterns.
            </p>

            <div className="space-y-3">
              {data.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#3B82F6]">
                      {rec.target}
                    </span>
                    <span className="text-[11px] font-semibold text-[#22C55E]">
                      Priority: {rec.priority}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">
                    {rec.action}
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {rec.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Causal & Synthetic Attribution Disclaimer */}
          <div className="p-4 rounded-xl bg-[#0B1120] border border-[#F59E0B]/40 flex items-start gap-3 text-xs text-[#94A3B8]">
            <ShieldAlert className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#F8FAFC] block mb-0.5">
                Methodological & Causation Disclaimer
              </strong>
              {data.disclaimer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

