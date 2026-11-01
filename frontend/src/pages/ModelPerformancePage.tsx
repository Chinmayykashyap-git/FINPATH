import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Gauge,
  Layers,
  Scale,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import { ModelEvaluationBlock, ModelMetricsResponse } from '../types';
import { InfoTooltip } from '../components/InfoTooltip';

export const ModelPerformancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getModelMetrics()
      .then((res) => setMetrics(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !metrics) {
    return (
      <div className="p-12 rounded-xl bg-[#151F30] border border-[#1E293B] text-center text-sm text-[#94A3B8] animate-pulse">
        Loading held-out test set evaluation metrics...
      </div>
    );
  }

  const renderModelSection = (
    model: ModelEvaluationBlock,
    accentColor: string,
    badgeText: string
  ) => (
    <div className="p-6 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#3B82F6]/15 text-[#22D3EE] border border-[#3B82F6]/30">
            {badgeText}
          </span>
          <h2 className="text-xl font-bold text-[#F8FAFC] mt-2">
            {model.model_name}
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {model.algorithm} • {model.task_type} • Train:{' '}
            {model.train_samples.toLocaleString()} rows | Test:{' '}
            {model.test_samples.toLocaleString()} rows (Stratified)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-[#0B1120] px-3 py-2 rounded-lg border border-[#1E293B]">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span>random_state={metrics.random_state}</span>
        </div>
      </div>

      {/* 4 Core Metric Cards: Accuracy, Precision, Recall, F1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B]">
          <div className="text-xs text-[#94A3B8]">Test Set Accuracy</div>
          <div className="text-2xl font-bold font-mono text-[#F8FAFC] mt-1">
            {(model.accuracy * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-1">
            Overall correct predictions
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B]">
          <div className="text-xs text-[#94A3B8]">Precision (Macro / Wtd)</div>
          <div className="text-2xl font-bold font-mono text-[#22D3EE] mt-1">
            {(model.precision_macro * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-1">
            Weighted: {(model.precision_weighted * 100).toFixed(2)}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B]">
          <div className="text-xs text-[#94A3B8]">Recall (Macro / Wtd)</div>
          <div className="text-2xl font-bold font-mono text-[#3B82F6] mt-1">
            {(model.recall_macro * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-1">
            Weighted: {(model.recall_weighted * 100).toFixed(2)}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B]">
          <div className="text-xs text-[#94A3B8]">F1 Score (Macro / Wtd)</div>
          <div className="text-2xl font-bold font-mono text-[#22C55E] mt-1">
            {(model.f1_macro * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-1">
            Weighted: {(model.f1_weighted * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Confusion Matrix + Feature Importance + Classification Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="p-5 rounded-xl bg-[#0B1120] border border-[#1E293B] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Confusion Matrix (Held-Out Test Set)
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Rows = Actual True Class | Columns = Model Predicted Class
              </p>
            </div>
            <InfoTooltip
              title={`${model.model_name} Confusion Matrix`}
              whatItRepresents="Tabulates exact counts of true vs predicted classifications on the 20% held-out test set."
              howToInterpret="Diagonal cells represent accurate predictions; off-diagonal cells represent false positives or false negatives."
              whyItMatters="Reveals exact error modes rather than hiding them behind a single accuracy number."
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-separate border-spacing-2 text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left text-[#94A3B8]">
                    Actual \ Predicted
                  </th>
                  {model.confusion_matrix.labels.map((lbl) => (
                    <th
                      key={lbl}
                      className="p-2 rounded bg-[#151F30] text-[#22D3EE] font-mono"
                    >
                      Pred: {lbl}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.confusion_matrix.matrix.map((row, rIdx) => (
                  <tr key={model.confusion_matrix.labels[rIdx]}>
                    <td className="p-2 text-left font-mono font-semibold text-[#F8FAFC] bg-[#151F30] rounded">
                      True: {model.confusion_matrix.labels[rIdx]}
                    </td>
                    {row.map((cellVal, cIdx) => {
                      const isDiag = rIdx === cIdx;
                      return (
                        <td
                          key={cIdx}
                          className={`p-3 rounded-lg font-mono text-sm font-bold ${
                            isDiag
                              ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40'
                              : 'bg-[#151F30] text-[#94A3B8] border border-[#1E293B]'
                          }`}
                        >
                          {cellVal.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Importance Chart */}
        <div className="p-5 rounded-xl bg-[#0B1120] border border-[#1E293B] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Gini Feature Importance Ranking
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Relative contribution of each input variable to tree splits
              </p>
            </div>
            <InfoTooltip
              title="Feature Importance"
              whatItRepresents="Normalized mean decrease in impurity (Gini importance) across all 100 decision trees."
              howToInterpret="Higher bars indicate features that drive the largest reduction in classification uncertainty."
              whyItMatters="Confirms that Server Latency, Bank Latency, and System Load are the primary drivers of model decisions."
            />
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={model.feature_importance}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E293B"
                  horizontal={false}
                />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="#F8FAFC"
                  fontSize={11}
                  width={150}
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
                  dataKey="importance"
                  name="Relative Importance"
                  radius={[0, 6, 6, 0]}
                >
                  {model.feature_importance.map((entry) => (
                    <Cell key={entry.feature} fill={accentColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Classification Report Table */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-[#F8FAFC]">
          Per-Class Classification Report
        </h3>
        <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0B1120] border-b border-[#1E293B] text-[#94A3B8] uppercase text-[11px]">
                <th className="py-2.5 px-4">Target Class</th>
                <th className="py-2.5 px-4">Precision</th>
                <th className="py-2.5 px-4">Recall</th>
                <th className="py-2.5 px-4">F1-Score</th>
                <th className="py-2.5 px-4">Test Support (Rows)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] bg-[#0B1120]/50">
              {model.classification_report.map((row) => (
                <tr key={row.class_name}>
                  <td className="py-2.5 px-4 font-mono font-semibold text-[#F8FAFC]">
                    {row.class_name}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#22D3EE]">
                    {(row.precision * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#3B82F6]">
                    {(row.recall * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#22C55E] font-semibold">
                    {(row.f1_score * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#94A3B8]">
                    {row.support.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Model Performance & Validation Metrics
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Reproducible test-set evaluation metrics, confusion matrices, and
          feature importance rankings for both Random Forest classifiers.
        </p>
      </div>

      {/* Why Accuracy Alone Can Be Misleading (Class Imbalance Callout) */}
      <div className="p-5 rounded-xl bg-[#151F30] border border-[#3B82F6]/40 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/40 flex items-center justify-center text-[#22D3EE] shrink-0">
          <Scale className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-[#F8FAFC]">
            Why Accuracy Alone Can Be Misleading (Class Imbalance Handling)
          </h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {metrics.class_imbalance_explanation}
          </p>
        </div>
      </div>

      {/* Model 1 Evaluation */}
      {renderModelSection(
        metrics.model1,
        '#3B82F6',
        'Binary Outcome Classifier'
      )}

      {/* Model 2 Evaluation */}
      {renderModelSection(
        metrics.model2,
        '#22D3EE',
        'Multi-Class Component Attribution'
      )}
    </div>
  );
};

