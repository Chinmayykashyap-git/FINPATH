import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Clock,
  Activity,
  Server,
  Landmark,
  User as UserIcon,
} from 'lucide-react';
import { api } from '../services/api';
import { TransactionDetailResponse, TransactionRecord } from '../types';

interface TransactionDrawerProps {
  transaction: TransactionRecord | null;
  onClose: () => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({
  transaction,
  onClose,
}) => {
  const [detail, setDetail] = useState<TransactionDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!transaction) {
      setDetail(null);
      return;
    }
    setLoading(true);
    api
      .getTransactionDetail(transaction.finpath_id)
      .then((res) => setDetail(res))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [transaction]);

  if (!transaction) return null;

  const actualSuccess = transaction.success === 1;
  const predSuccess = transaction.predicted_success === 1;
  const outcomesMatch = actualSuccess === predSuccess;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#101827] border-l border-[#1E293B] h-full overflow-y-auto p-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#1E293B] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#3B82F6]/15 text-[#22D3EE] border border-[#3B82F6]/30">
                  Transaction Inspection
                </span>
                <span className="text-xs text-[#94A3B8]">
                  Simulated Record
                </span>
              </div>
              <h3 className="text-xl font-bold font-mono text-[#F8FAFC] mt-1">
                {transaction.finpath_id}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#151F30] text-[#94A3B8] hover:text-white border border-[#1E293B]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Side-by-Side Comparison: Actual Simulated vs ML Predicted */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-3">
              Actual Simulated Outcome vs. ML Model Prediction
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Actual Simulated Outcome */}
              <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B]">
                <div className="text-xs text-[#94A3B8] mb-1">
                  Actual Simulated Status
                </div>
                <div className="flex items-center gap-2">
                  {actualSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                  )}
                  <span
                    className={`text-base font-bold ${
                      actualSuccess ? 'text-[#22C55E]' : 'text-[#EF4444]'
                    }`}
                  >
                    {actualSuccess ? 'Succeeded' : 'Failed'}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-[#1E293B] text-xs text-[#94A3B8] flex justify-between">
                  <span>Actual Failure Node:</span>
                  <span className="font-mono font-semibold text-[#F8FAFC]">
                    {transaction.failed_node}
                  </span>
                </div>
              </div>

              {/* ML Predicted Outcome */}
              <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B]">
                <div className="text-xs text-[#94A3B8] mb-1">
                  Model 1 Predicted Status
                </div>
                <div className="flex items-center gap-2">
                  {predSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                  )}
                  <span
                    className={`text-base font-bold ${
                      predSuccess ? 'text-[#22C55E]' : 'text-[#EF4444]'
                    }`}
                  >
                    {predSuccess ? 'Predicted Success' : 'Predicted Failure'}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-[#1E293B] text-xs text-[#94A3B8] flex justify-between">
                  <span>Model 2 Node:</span>
                  <span className="font-mono font-semibold text-[#22D3EE]">
                    {transaction.predicted_failed_node}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2.5 px-3 py-2 rounded-lg bg-[#0B1120] border border-[#1E293B] flex items-center justify-between text-xs">
              <span className="text-[#94A3B8]">Prediction Alignment:</span>
              <span
                className={`font-medium ${
                  outcomesMatch ? 'text-[#22C55E]' : 'text-[#F59E0B]'
                }`}
              >
                {outcomesMatch
                  ? 'Model prediction matches simulated outcome'
                  : 'Stochastic variance: simulated Bernoulli outcome differed from model expectation'}
              </span>
            </div>
          </div>

          {/* Probability Gauges */}
          <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Model 1 Probability Breakdown
              </span>
              <span className="text-xs font-mono text-[#22D3EE]">
                Random Forest (100 Trees)
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#22C55E] font-medium">
                  Success Probability
                </span>
                <span className="font-mono">
                  {(transaction.success_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0B1120] overflow-hidden flex">
                <div
                  className="bg-[#22C55E] h-full"
                  style={{ width: `${transaction.success_probability * 100}%` }}
                />
                <div
                  className="bg-[#EF4444] h-full"
                  style={{ width: `${transaction.failure_probability * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#EF4444] font-medium">
                  Failure Probability
                </span>
                <span className="font-mono">
                  {(transaction.failure_probability * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Operational Telemetry Attributes */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-3">
              Transaction Telemetry Conditions
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#151F30] border border-[#1E293B] flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#3B82F6]" />
                <div>
                  <div className="text-xs text-[#94A3B8]">Transaction Time</div>
                  <div className="text-sm font-mono font-semibold">
                    {String(transaction.time).padStart(2, '0')}:00 UTC
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#151F30] border border-[#1E293B] flex items-center gap-3">
                <Activity className="w-4 h-4 text-[#22D3EE]" />
                <div>
                  <div className="text-xs text-[#94A3B8]">System Load</div>
                  <div className="text-sm font-mono font-semibold">
                    {transaction.load.toLocaleString()} req/s
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#151F30] border border-[#1E293B] flex items-center gap-3">
                <UserIcon className="w-4 h-4 text-[#3B82F6]" />
                <div>
                  <div className="text-xs text-[#94A3B8]">User Latency</div>
                  <div className="text-sm font-mono font-semibold">
                    {transaction.user_latency.toFixed(2)} ms
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#151F30] border border-[#1E293B] flex items-center gap-3">
                <Server className="w-4 h-4 text-[#F59E0B]" />
                <div>
                  <div className="text-xs text-[#94A3B8]">Server Latency</div>
                  <div className="text-sm font-mono font-semibold">
                    {transaction.server_latency.toFixed(2)} ms
                  </div>
                </div>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-[#151F30] border border-[#1E293B] flex items-center gap-3">
                <Landmark className="w-4 h-4 text-[#EF4444]" />
                <div>
                  <div className="text-xs text-[#94A3B8]">Bank Gateway Latency</div>
                  <div className="text-sm font-mono font-semibold">
                    {transaction.bank_latency.toFixed(2)} ms
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Model 2 Class Probabilities & Training Baseline Comparison */}
          {loading ? (
            <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] text-xs text-[#94A3B8] animate-pulse">
              Running live Model 1 & Model 2 diagnostic inspection...
            </div>
          ) : (
            detail && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    <Cpu className="w-4 h-4 text-[#22D3EE]" />
                    <span>Model 2 Failure Node Class Probabilities</span>
                  </div>
                  {Object.entries(
                    detail.live_analysis.model2_prediction.class_probabilities
                  ).map(([node, prob]) => (
                    <div key={node} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#F8FAFC]">{node} Component</span>
                        <span className="font-mono text-[#94A3B8]">
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#0B1120]">
                        <div
                          className="h-full rounded-full bg-[#3B82F6]"
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] space-y-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Comparison Against Training Baseline
                  </div>
                  {detail.live_analysis.parameter_breakdown.map((item) => (
                    <div
                      key={item.feature}
                      className="text-xs p-2.5 rounded-lg bg-[#0B1120] border border-[#1E293B] space-y-1"
                    >
                      <div className="flex justify-between font-medium">
                        <span className="text-[#F8FAFC]">{item.label}</span>
                        <span
                          className={
                            item.is_elevated
                              ? 'text-[#EF4444]'
                              : 'text-[#22C55E]'
                          }
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[#94A3B8]">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        <div className="pt-4 mt-6 border-t border-[#1E293B] text-[11px] text-[#94A3B8]">
          Note: Actual status reflects the simulated Bernoulli outcome from the
          synthetic dataset, while Predicted status reflects the Random Forest
          model estimation.
        </div>
      </div>
    </div>
  );
};

