import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FlaskConical,
  Info,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { FullAnalysisResult, SimulatorPreset } from '../types';

export const AIPredictionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [presets, setPresets] = useState<SimulatorPreset[]>([]);
  const [featureMeta, setFeatureMeta] = useState<Record<string, any>>({});
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    'server-contention'
  );
  const [analysis, setAnalysis] = useState<FullAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSimulatorPresets()
      .then((res) => {
        setPresets(res.presets);
        setFeatureMeta(res.feature_metadata);
        const initial =
          res.presets.find((p) => p.id === 'server-contention') ||
          res.presets[0];
        if (initial) {
          return api.analyzeTransaction(initial.inputs);
        }
        return null;
      })
      .then((res) => {
        if (res) setAnalysis(res);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelectScenario = async (preset: SimulatorPreset) => {
    setSelectedPresetId(preset.id);
    setLoading(true);
    try {
      const res = await api.analyzeTransaction(preset.inputs);
      setAnalysis(res);
    } finally {
      setLoading(false);
    }
  };

  const m1 = analysis?.model1_prediction;
  const m2 = analysis?.model2_prediction;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            AI Predictions & Dual-Model Pipeline
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Inspect how FinPath AI&apos;s two-stage Random Forest pipeline
            evaluates transaction conditions and attributes potential failure
            nodes.
          </p>
        </div>

        <button
          onClick={() => navigate('/simulator')}
          className="px-4 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-xs font-semibold text-white flex items-center gap-2 transition-colors self-start"
        >
          <FlaskConical className="w-4 h-4" />
          <span>Launch Full Custom Simulator</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Scenario Selector Bar */}
      <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-[#94A3B8]">
            Select Live Inspection Scenario (Runs FastAPI Inference)
          </span>
          <span className="text-[#22D3EE] font-mono">
            POST /api/predict/analyze
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectScenario(preset)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedPresetId === preset.id
                  ? 'bg-[#3B82F6]/15 border-[#3B82F6] text-[#F8FAFC]'
                  : 'bg-[#0B1120] border-[#1E293B] text-[#94A3B8] hover:text-white'
              }`}
            >
              <div className="text-xs font-semibold text-[#F8FAFC]">
                {preset.name}
              </div>
              <div className="text-[11px] text-[#22D3EE] mt-0.5">
                {preset.badge}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MODEL 1 — TRANSACTION SUCCESS PREDICTOR */}
        <div className="p-6 rounded-xl bg-[#151F30] border border-[#1E293B] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[#1E293B] pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
                  Stage 1 Classifier
                </span>
                <h2 className="text-lg font-bold text-[#F8FAFC] mt-2">
                  MODEL 1 — TRANSACTION SUCCESS PREDICTOR
                </h2>
                <p className="text-xs text-[#94A3B8] mt-1">
                  This model evaluates transaction conditions and estimates the
                  probability of successful transaction completion.
                </p>
              </div>
              <Cpu className="w-6 h-6 text-[#3B82F6] shrink-0" />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B]">
                <span className="text-[#94A3B8] block">Model Type</span>
                <span className="font-semibold text-[#F8FAFC] font-mono">
                  Random Forest Classifier
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B]">
                <span className="text-[#94A3B8] block">Input Features (5)</span>
                <span className="font-semibold text-[#22D3EE] font-mono">
                  time, user/server/bank lat, load
                </span>
              </div>
            </div>

            {/* Live Prediction Output */}
            {loading || !m1 ? (
              <div className="p-8 text-center text-xs text-[#94A3B8] animate-pulse">
                Evaluating Model 1...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#94A3B8]">
                      Predicted Outcome
                    </div>
                    <div
                      className={`text-xl font-bold mt-0.5 flex items-center gap-2 ${
                        m1.predicted_class === 1
                          ? 'text-[#22C55E]'
                          : 'text-[#EF4444]'
                      }`}
                    >
                      {m1.predicted_class === 1 ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                      <span>{m1.predicted_outcome}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#94A3B8]">
                      Ensemble Vote Agreement
                    </div>
                    <div className="text-lg font-mono font-bold text-[#F8FAFC]">
                      {(m1.ensemble_agreement * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Probability Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#22C55E] font-medium">
                        Success Probability
                      </span>
                      <span className="font-mono font-semibold text-[#22C55E]">
                        {(m1.success_probability * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#0B1120] overflow-hidden">
                      <div
                        className="h-full bg-[#22C55E] transition-all duration-300"
                        style={{ width: `${m1.success_probability * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#EF4444] font-medium">
                        Failure Probability
                      </span>
                      <span className="font-mono font-semibold text-[#EF4444]">
                        {(m1.failure_probability * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#0B1120] overflow-hidden">
                      <div
                        className="h-full bg-[#EF4444] transition-all duration-300"
                        style={{ width: `${m1.failure_probability * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Epistemic Humility / Confidence Disclaimer */}
          <div className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B] flex items-start gap-2.5 text-xs text-[#94A3B8]">
            <Info className="w-4 h-4 text-[#22D3EE] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#F8FAFC]">
                Note on Model Confidence:
              </strong>{' '}
              Ensemble probabilities represent the fraction of decision trees
              voting for each outcome based on synthetic training patterns. They
              are statistical estimates and do not guarantee certainty.
            </span>
          </div>
        </div>

        {/* MODEL 2 — FAILURE NODE ANALYZER */}
        <div className="p-6 rounded-xl bg-[#151F30] border border-[#1E293B] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[#1E293B] pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
                  Stage 2 Diagnostic Classifier
                </span>
                <h2 className="text-lg font-bold text-[#F8FAFC] mt-2">
                  MODEL 2 — FAILURE NODE ANALYZER
                </h2>
                <p className="text-xs text-[#94A3B8] mt-1">
                  When a transaction is predicted to fail, this model estimates
                  which component is most likely responsible.
                </p>
              </div>
              <Layers className="w-6 h-6 text-[#22D3EE] shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B]">
                <span className="text-[#94A3B8] block">Candidate Nodes</span>
                <span className="font-semibold text-[#F8FAFC] font-mono">
                  User | Server | Bank
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B]">
                <span className="text-[#94A3B8] block">Pipeline Trigger</span>
                <span
                  className={`font-semibold font-mono ${
                    analysis?.model2_triggered
                      ? 'text-[#EF4444]'
                      : 'text-[#22C55E]'
                  }`}
                >
                  {analysis?.model2_triggered
                    ? 'Triggered (Failure Predicted)'
                    : 'Standby (Success Predicted)'}
                </span>
              </div>
            </div>

            {loading || !m2 ? (
              <div className="p-8 text-center text-xs text-[#94A3B8] animate-pulse">
                Evaluating Model 2...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#94A3B8]">
                      Predicted Failure Component
                    </div>
                    <div className="text-xl font-bold text-[#22D3EE] mt-0.5 font-mono">
                      {analysis?.model2_triggered
                        ? m2.predicted_failure_component
                        : `None (Diagnostic: ${m2.predicted_failure_component})`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#94A3B8]">
                      Top Class Probability
                    </div>
                    <div className="text-lg font-mono font-bold text-[#F8FAFC]">
                      {(
                        (m2.class_probabilities[
                          m2.predicted_failure_component
                        ] || 0) * 100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>

                {/* Class Probabilities for User, Server, Bank */}
                <div className="space-y-3">
                  {(['Server', 'Bank', 'User'] as const).map((comp) => {
                    const prob = m2.class_probabilities[comp] || 0;
                    const color =
                      comp === 'Server'
                        ? '#F59E0B'
                        : comp === 'Bank'
                        ? '#3B82F6'
                        : '#22D3EE';
                    return (
                      <div key={comp}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#F8FAFC] font-medium">
                            {comp} Component Probability
                          </span>
                          <span className="font-mono text-[#94A3B8]">
                            {(prob * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-[#0B1120] overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${prob * 100}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B] flex items-start gap-2.5 text-xs text-[#94A3B8]">
            <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#F8FAFC]">
                Synthetic Labeling Rule:
              </strong>{' '}
              Model 2 is trained on failed transactions where the label is
              assigned to whichever component (User, Server, or Bank) recorded
              the highest latency. This is a heuristic indicator, not verified
              root-cause attribution.
            </span>
          </div>
        </div>
      </div>

      {/* Model Feature Explanation Panel */}
      <div className="p-6 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#F8FAFC]">
            Model Input Feature Glossary & Training Baseline
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Plain-language explanation of every feature used by Model 1 and
            Model 2, alongside actual training set statistics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.values(featureMeta).map((meta: any) => (
            <div
              key={meta.feature}
              className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-[#22D3EE]">
                  {meta.feature}
                </div>
                <div className="text-sm font-semibold text-[#F8FAFC]">
                  {meta.label}
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {meta.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1E293B] text-[11px] font-mono text-[#94A3B8] space-y-1">
                <div className="flex justify-between">
                  <span>Training Mean:</span>
                  <span className="text-[#F8FAFC]">
                    {meta.mean} {meta.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>95th Percentile:</span>
                  <span className="text-[#F59E0B]">
                    {meta.p95} {meta.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

