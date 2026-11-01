import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  FlaskConical,
  Landmark,
  Play,
  RotateCcw,
  Server,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import { FullAnalysisResult, SimulatorPreset } from '../types';

const DEFAULT_INPUTS = {
  time: 14,
  user_latency: 50,
  server_latency: 70,
  bank_latency: 60,
  load: 17500,
};

export const TransactionSimulatorPage: React.FC = () => {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [presets, setPresets] = useState<SimulatorPreset[]>([]);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSimulatorPresets()
      .then((res) => {
        setPresets(res.presets);
      })
      .catch(() => {});

    // Run initial baseline analysis on page load
    runAnalysis(DEFAULT_INPUTS);
  }, []);

  const runAnalysis = async (payload = inputs) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzeTransaction(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Simulation request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: SimulatorPreset) => {
    setInputs(preset.inputs);
    runAnalysis(preset.inputs);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    runAnalysis(DEFAULT_INPUTS);
  };

  const m1 = result?.model1_prediction;
  const m2 = result?.model2_prediction;
  const isFailure = m1?.predicted_class === 0;

  const comparisonChartData =
    result?.parameter_breakdown
      .filter((p) => p.feature !== 'time' && p.feature !== 'load')
      .map((p) => ({
        name: p.label.replace(' Latency', ''),
        Input: p.input_value,
        'Training Mean': p.training_mean,
        'Training P95': p.training_p95,
      })) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#22D3EE] mb-1">
            <FlaskConical className="w-4 h-4" />
            <span>Interactive ML Playground</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Interactive Transaction Simulator
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Experiment with transaction conditions to understand how latency and
            system load influence the model&apos;s predictions.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-2 rounded-lg bg-[#151F30] border border-[#1E293B] hover:border-[#334155] text-xs font-medium text-[#94A3B8] hover:text-white flex items-center gap-2 self-start"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Baseline</span>
        </button>
      </div>

      {/* Example Scenarios Strip */}
      <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
            Load Preset Operational Scenario
          </span>
          <span className="text-[#94A3B8]">
            Click any preset to populate inputs and run FastAPI inference
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetClick(p)}
              className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B] hover:border-[#3B82F6] text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#22D3EE]">
                  {p.name}
                </span>
              </div>
              <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#151F30] text-[#22D3EE]">
                {p.badge}
              </span>
              <p className="text-[11px] text-[#94A3B8] mt-1.5 line-clamp-2">
                {p.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Controls (Sliders + Numeric Inputs) | Right Live Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Controls (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-[#1E293B] pb-3">
              <h2 className="text-base font-bold text-[#F8FAFC]">
                Transaction Condition Parameters
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Adjust sliders or enter exact numeric values, then click Analyze
                Transaction.
              </p>
            </div>

            {/* 1. Transaction Hour (0-23) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-[#F8FAFC] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Transaction Hour (0–23 UTC)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={inputs.time}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        time: Math.min(23, Math.max(0, Number(e.target.value))),
                      })
                    }
                    className="w-16 px-2 py-1 rounded bg-[#0B1120] border border-[#1E293B] text-right font-mono text-xs text-[#22D3EE]"
                  />
                  <span className="text-[#94A3B8] font-mono">:00</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={23}
                step={1}
                value={inputs.time}
                onChange={(e) =>
                  setInputs({ ...inputs, time: Number(e.target.value) })
                }
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94A3B8]">
                <span>00:00 (Midnight)</span>
                <span>12:00 (Noon)</span>
                <span className="text-[#F59E0B]">18:00–22:00 (Peak)</span>
                <span>23:00</span>
              </div>
            </div>

            {/* 2. User Latency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-[#F8FAFC] flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>User Network Latency (ms)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={5}
                    max={200}
                    step={0.5}
                    value={inputs.user_latency}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        user_latency: Math.min(
                          200,
                          Math.max(5, Number(e.target.value))
                        ),
                      })
                    }
                    className="w-20 px-2 py-1 rounded bg-[#0B1120] border border-[#1E293B] text-right font-mono text-xs text-[#22D3EE]"
                  />
                  <span className="text-[#94A3B8] font-mono">ms</span>
                </div>
              </div>
              <input
                type="range"
                min={10}
                max={140}
                step={0.5}
                value={inputs.user_latency}
                onChange={(e) =>
                  setInputs({
                    ...inputs,
                    user_latency: Number(e.target.value),
                  })
                }
                className="w-full accent-[#22D3EE] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94A3B8]">
                <span>10 ms</span>
                <span>Mean: 50 ms</span>
                <span className="text-[#F59E0B]">Threshold: &gt;70 ms</span>
                <span>140 ms</span>
              </div>
            </div>

            {/* 3. Server Latency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-[#F8FAFC] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Server Processing Latency (ms)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={10}
                    max={250}
                    step={0.5}
                    value={inputs.server_latency}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        server_latency: Math.min(
                          250,
                          Math.max(10, Number(e.target.value))
                        ),
                      })
                    }
                    className="w-20 px-2 py-1 rounded bg-[#0B1120] border border-[#1E293B] text-right font-mono text-xs text-[#F59E0B]"
                  />
                  <span className="text-[#94A3B8] font-mono">ms</span>
                </div>
              </div>
              <input
                type="range"
                min={20}
                max={160}
                step={0.5}
                value={inputs.server_latency}
                onChange={(e) =>
                  setInputs({
                    ...inputs,
                    server_latency: Number(e.target.value),
                  })
                }
                className="w-full accent-[#F59E0B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94A3B8]">
                <span>20 ms</span>
                <span>Mean: 70 ms</span>
                <span className="text-[#EF4444]">Threshold: &gt;90 ms</span>
                <span>160 ms</span>
              </div>
            </div>

            {/* 4. Bank Latency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-[#F8FAFC] flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>Bank Gateway Latency (ms)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={10}
                    max={250}
                    step={0.5}
                    value={inputs.bank_latency}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        bank_latency: Math.min(
                          250,
                          Math.max(10, Number(e.target.value))
                        ),
                      })
                    }
                    className="w-20 px-2 py-1 rounded bg-[#0B1120] border border-[#1E293B] text-right font-mono text-xs text-[#EF4444]"
                  />
                  <span className="text-[#94A3B8] font-mono">ms</span>
                </div>
              </div>
              <input
                type="range"
                min={15}
                max={150}
                step={0.5}
                value={inputs.bank_latency}
                onChange={(e) =>
                  setInputs({
                    ...inputs,
                    bank_latency: Number(e.target.value),
                  })
                }
                className="w-full accent-[#EF4444] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94A3B8]">
                <span>15 ms</span>
                <span>Mean: 60 ms</span>
                <span className="text-[#EF4444]">Threshold: &gt;80 ms</span>
                <span>150 ms</span>
              </div>
            </div>

            {/* 5. System Load */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-[#F8FAFC] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Concurrent System Load (req/s)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={5000}
                    max={35000}
                    step={100}
                    value={inputs.load}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        load: Math.min(
                          35000,
                          Math.max(5000, Number(e.target.value))
                        ),
                      })
                    }
                    className="w-24 px-2 py-1 rounded bg-[#0B1120] border border-[#1E293B] text-right font-mono text-xs text-[#3B82F6]"
                  />
                  <span className="text-[#94A3B8] font-mono">req/s</span>
                </div>
              </div>
              <input
                type="range"
                min={10000}
                max={25000}
                step={100}
                value={inputs.load}
                onChange={(e) =>
                  setInputs({ ...inputs, load: Number(e.target.value) })
                }
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94A3B8]">
                <span>10,000 req/s</span>
                <span>Mean: 17,500</span>
                <span className="text-[#EF4444]">High: &gt;20,000</span>
                <span>25,000</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          {/* Analyze Transaction Button */}
          <button
            type="button"
            onClick={() => runAnalysis(inputs)}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {loading ? 'Running ML Inference...' : 'Analyze Transaction'}
            </span>
          </button>
        </div>

        {/* Right Column: Professional Results Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!result || !m1 || !m2 ? (
            <div className="p-12 rounded-xl bg-[#151F30] border border-[#1E293B] text-center text-sm text-[#94A3B8]">
              Configure parameters and click &quot;Analyze Transaction&quot; to
              view live Model 1 & Model 2 predictions.
            </div>
          ) : (
            <>
              {/* Top Prediction Verdict Banner */}
              <div
                className={`p-6 rounded-xl border ${
                  isFailure
                    ? 'bg-[#EF4444]/10 border-[#EF4444]/40'
                    : 'bg-[#22C55E]/10 border-[#22C55E]/40'
                } space-y-4`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {isFailure ? (
                      <div className="w-12 h-12 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444]">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#22C55E]/20 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E]">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                        Model 1 Prediction Result
                      </div>
                      <h2
                        className={`text-2xl font-bold ${
                          isFailure ? 'text-[#EF4444]' : 'text-[#22C55E]'
                        }`}
                      >
                        {isFailure
                          ? 'Predicted Outcome: Transaction Failure'
                          : 'Predicted Outcome: Transaction Success'}
                      </h2>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs text-[#94A3B8]">
                      Predicted Failure Node
                    </div>
                    <div className="text-xl font-mono font-bold text-[#22D3EE]">
                      {result.predicted_failure_component}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#F8FAFC] leading-relaxed bg-[#0B1120]/70 p-3 rounded-lg border border-[#1E293B]">
                  {result.summary}
                </p>

                {/* Success & Failure Probability Split Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#22C55E]">
                      Success Probability:{' '}
                      {(m1.success_probability * 100).toFixed(1)}%
                    </span>
                    <span className="text-[#EF4444]">
                      Failure Probability:{' '}
                      {(m1.failure_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#0B1120] overflow-hidden flex">
                    <div
                      className="bg-[#22C55E] h-full transition-all duration-300"
                      style={{ width: `${m1.success_probability * 100}%` }}
                    />
                    <div
                      className="bg-[#EF4444] h-full transition-all duration-300"
                      style={{ width: `${m1.failure_probability * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Model 2 Failure Node Breakdown & Visual Latency Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Model 2 Failure Node Analyzer Card */}
                <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#22D3EE]" />
                        <span>Model 2: Failure Node Analyzer</span>
                      </h3>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">
                        {isFailure
                          ? 'Active: Identifying primary bottleneck component'
                          : 'Diagnostic Standby: Component risk distribution'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(['Server', 'Bank', 'User'] as const).map((comp) => {
                      const prob = m2.class_probabilities[comp] || 0;
                      const isTop = m2.predicted_failure_component === comp;
                      return (
                        <div
                          key={comp}
                          className={`p-3 rounded-lg border ${
                            isTop && isFailure
                              ? 'bg-[#EF4444]/10 border-[#EF4444]/40'
                              : 'bg-[#0B1120] border-[#1E293B]'
                          } space-y-1.5`}
                        >
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-[#F8FAFC]">
                              {comp} Node
                            </span>
                            <span className="font-mono text-[#22D3EE]">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#151F30] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${prob * 100}%`,
                                backgroundColor:
                                  comp === 'Server'
                                    ? '#F59E0B'
                                    : comp === 'Bank'
                                    ? '#3B82F6'
                                    : '#22D3EE',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Visual Breakdown of Input Latencies vs Training Baseline */}
                <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC]">
                      Input Latency vs Training Baseline
                    </h3>
                    <p className="text-[11px] text-[#94A3B8]">
                      Compares your simulated latencies against the 200k
                      training mean and P95
                    </p>
                  </div>

                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1E293B"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="#94A3B8"
                          fontSize={11}
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
                          dataKey="Input"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        >
                          {comparisonChartData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={
                                entry.Input >= entry['Training P95']
                                  ? '#EF4444'
                                  : '#3B82F6'
                              }
                            />
                          ))}
                        </Bar>
                        <Bar
                          dataKey="Training Mean"
                          fill="#22C55E"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="Training P95"
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Parameter Elevation Breakdown Table */}
              <div className="p-5 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC]">
                      Parameter Diagnostic Breakdown Against Training Data
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      Identifies which input parameters are elevated compared
                      with the 160,000-row training distribution.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {result.parameter_breakdown.map((p) => (
                    <div
                      key={p.feature}
                      className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#F8FAFC]">
                            {p.label}
                          </span>
                          <span className="font-mono text-[#22D3EE]">
                            ({p.input_value} {p.unit})
                          </span>
                        </div>
                        <p className="text-[#94A3B8]">{p.explanation}</p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 self-start sm:self-center ${
                          p.is_elevated
                            ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                            : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

