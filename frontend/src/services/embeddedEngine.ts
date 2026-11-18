import analyticsSummaryData from '../data/analytics_summary.json';
import evaluationMetricsData from '../data/evaluation_metrics.json';
import featureMetadataData from '../data/feature_metadata.json';
import transactionsSeedData from '../data/transactions_seed.json';
import forestModelsData from '../data/forest_models.json';
import {
  AuthTokenResponse,
  DashboardChartsResponse,
  DashboardSummaryResponse,
  FailureIntelligenceResponse,
  FullAnalysisResult,
  ModelMetricsResponse,
  PaginatedTransactions,
  ParameterBreakdownItem,
  SimulatorPreset,
  TransactionDetailResponse,
  TransactionRecord,
  User,
} from '../types';

const USERS_STORAGE_KEY = 'finpath_registered_users';
const CURRENT_USER_KEY = 'finpath_active_user';

const DEMO_USER: User = {
  id: 1,
  full_name: 'Alex Rivera (Demo Analyst)',
  email: 'demo@finpath.ai',
  role: 'Principal Transaction Intelligence Analyst',
  is_active: true,
  is_demo: true,
  created_at: new Date().toISOString(),
};

const PRESETS: SimulatorPreset[] = [
  {
    id: 'baseline-healthy',
    name: 'Healthy Baseline Traffic',
    badge: 'Nominal',
    description:
      'Mid-day transaction with typical client, server, and bank gateway latencies.',
    inputs: {
      time: 11,
      user_latency: 48.0,
      server_latency: 66.0,
      bank_latency: 57.0,
      load: 14200,
    },
  },
  {
    id: 'server-contention',
    name: 'Server Microservice Contention',
    badge: 'Server Bottleneck',
    description:
      'High server processing latency (114ms) combined with heavy evening concurrency.',
    inputs: {
      time: 20,
      user_latency: 52.0,
      server_latency: 114.0,
      bank_latency: 64.0,
      load: 22400,
    },
  },
  {
    id: 'bank-gateway-degradation',
    name: 'Acquiring Bank Gateway Spike',
    badge: 'Bank Bottleneck',
    description:
      'Upstream bank gateway latency spike (108ms) under elevated queue load.',
    inputs: {
      time: 19,
      user_latency: 49.0,
      server_latency: 74.0,
      bank_latency: 108.0,
      load: 21800,
    },
  },
  {
    id: 'client-edge-degradation',
    name: 'Mobile Edge Network Congestion',
    badge: 'User Bottleneck',
    description:
      'Severe client-side packet delay (105ms) paired with elevated system load.',
    inputs: {
      time: 18,
      user_latency: 105.0,
      server_latency: 72.0,
      bank_latency: 61.0,
      load: 21500,
    },
  },
  {
    id: 'cascading-peak-overload',
    name: 'Peak Hour Cascading Overload',
    badge: 'Multi-Node Stress',
    description:
      'Simultaneous server (106ms) and bank (96ms) congestion at maximum system load (24,500 req/s).',
    inputs: {
      time: 21,
      user_latency: 68.0,
      server_latency: 106.0,
      bank_latency: 96.0,
      load: 24500,
    },
  },
];

interface CompactTree {
  f: number[];
  t: number[];
  l: number[];
  r: number[];
  p: number[][];
}

function traverseTree(tree: CompactTree, x: number[]): number[] {
  let node = 0;
  while (tree.l[node] !== -1) {
    const featIdx = tree.f[node];
    const thresh = tree.t[node];
    if (x[featIdx] <= thresh) {
      node = tree.l[node];
    } else {
      node = tree.r[node];
    }
  }
  return tree.p[node];
}

function evaluateForest(trees: CompactTree[], x: number[], numClasses: number): number[] {
  const avg = new Array(numClasses).fill(0);
  for (const tree of trees) {
    const probs = traverseTree(tree, x);
    for (let i = 0; i < numClasses; i++) {
      avg[i] += probs[i] ?? 0;
    }
  }
  return avg.map((v) => v / Math.max(1, trees.length));
}

function getStoredUsers(): Array<User & { password?: string }> {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: Array<User & { password?: string }>) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export const embeddedEngine = {
  login(email: string, password: string): AuthTokenResponse {
    const normalized = email.trim().toLowerCase();
    const users = getStoredUsers();
    const found = users.find((u) => u.email.toLowerCase() === normalized);

    if (found && (!found.password || found.password === password)) {
      const { password: _, ...cleanUser } = found;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cleanUser));
      return {
        access_token: `fp-embedded-jwt-${cleanUser.id}-${Date.now()}`,
        token_type: 'bearer',
        expires_in: 86400,
        user: cleanUser,
      };
    }

    // Allow instant analyst sign-in on static demo deployments if not yet registered
    const autoUser: User = {
      id: Date.now(),
      full_name: normalized.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: normalized,
      role: 'Transaction Risk Analyst',
      is_active: true,
      is_demo: false,
      created_at: new Date().toISOString(),
    };
    users.push({ ...autoUser, password });
    saveStoredUsers(users);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(autoUser));
    return {
      access_token: `fp-embedded-jwt-${autoUser.id}-${Date.now()}`,
      token_type: 'bearer',
      expires_in: 86400,
      user: autoUser,
    };
  },

  register(fullName: string, email: string, password: string): AuthTokenResponse {
    const normalized = email.trim().toLowerCase();
    const users = getStoredUsers();
    const newUser: User = {
      id: Date.now(),
      full_name: fullName.trim(),
      email: normalized,
      role: 'Transaction Risk Analyst',
      is_active: true,
      is_demo: false,
      created_at: new Date().toISOString(),
    };
    const filtered = users.filter((u) => u.email.toLowerCase() !== normalized);
    filtered.push({ ...newUser, password });
    saveStoredUsers(filtered);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return {
      access_token: `fp-embedded-jwt-${newUser.id}-${Date.now()}`,
      token_type: 'bearer',
      expires_in: 86400,
      user: newUser,
    };
  },

  demoLogin(): AuthTokenResponse {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(DEMO_USER));
    return {
      access_token: `fp-demo-jwt-${Date.now()}`,
      token_type: 'bearer',
      expires_in: 7200,
      user: DEMO_USER,
    };
  },

  getMe(): User {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return DEMO_USER;
  },

  getDashboardSummary(): DashboardSummaryResponse {
    const s = analyticsSummaryData as any;
    return {
      kpis: s.kpis,
      most_problematic_component: s.most_problematic_component,
      peak_failure_hour: s.peak_failure_hour,
      disclaimer: s.disclaimer,
    };
  },

  getDashboardCharts(startHour = 0, endHour = 23): DashboardChartsResponse {
    const s = analyticsSummaryData as any;
    const hourlyAll = s.hourly_distribution as any[];
    const hourlyFiltered =
      startHour <= endHour
        ? hourlyAll.filter((h) => h.hour >= startHour && h.hour <= endHour)
        : hourlyAll.filter((h) => h.hour >= startHour || h.hour <= endHour);

    const filteredSucc = hourlyFiltered.reduce((acc, h) => acc + h.successful, 0);
    const filteredFail = hourlyFiltered.reduce((acc, h) => acc + h.failed, 0);
    const filteredTotal = filteredSucc + filteredFail;

    const compTotals: Record<string, number> = {
      User: hourlyFiltered.reduce((acc, h) => acc + h.user_failures, 0),
      Server: hourlyFiltered.reduce((acc, h) => acc + h.server_failures, 0),
      Bank: hourlyFiltered.reduce((acc, h) => acc + h.bank_failures, 0),
    };

    const filteredComponents = ['Server', 'Bank', 'User']
      .map((comp) => ({
        component: comp,
        failures: compTotals[comp],
        percentage:
          filteredFail > 0
            ? Number(((compTotals[comp] / filteredFail) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.failures - a.failures);

    return {
      time_filter: { start_hour: startHour, end_hour: endHour },
      success_vs_failure: [
        {
          name: 'Successful',
          count: filteredSucc,
          percentage:
            filteredTotal > 0
              ? Number(((filteredSucc / filteredTotal) * 100).toFixed(2))
              : 0,
          color: '#22C55E',
        },
        {
          name: 'Failed',
          count: filteredFail,
          percentage:
            filteredTotal > 0
              ? Number(((filteredFail / filteredTotal) * 100).toFixed(2))
              : 0,
          color: '#EF4444',
        },
      ],
      hourly_volume: hourlyFiltered,
      failure_by_component: filteredComponents,
      latency_analysis: s.latency_comparison,
      system_load_analysis: s.load_analysis,
    };
  },

  filterTransactions(params: {
    search?: string;
    status_filter?: string;
    predicted_filter?: string;
    failed_node?: string;
    hour?: number | '';
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): TransactionRecord[] {
    let rows = [...(transactionsSeedData as TransactionRecord[])];

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      rows = rows.filter((r) => r.finpath_id.toLowerCase().includes(q));
    }
    if (params.status_filter === 'success' || params.status_filter === '1') {
      rows = rows.filter((r) => r.success === 1);
    } else if (
      params.status_filter === 'failed' ||
      params.status_filter === 'failure' ||
      params.status_filter === '0'
    ) {
      rows = rows.filter((r) => r.success === 0);
    }

    if (params.predicted_filter === 'success' || params.predicted_filter === '1') {
      rows = rows.filter((r) => r.predicted_success === 1);
    } else if (
      params.predicted_filter === 'failed' ||
      params.predicted_filter === 'failure' ||
      params.predicted_filter === '0'
    ) {
      rows = rows.filter((r) => r.predicted_success === 0);
    }

    if (params.failed_node && params.failed_node !== 'all' && params.failed_node !== 'All') {
      rows = rows.filter((r) => r.failed_node === params.failed_node);
    }

    if (params.hour !== undefined && params.hour !== '') {
      rows = rows.filter((r) => r.time === Number(params.hour));
    }

    const sortBy = (params.sort_by || 'finpath_id') as keyof TransactionRecord;
    const dir = params.sort_order === 'desc' ? -1 : 1;
    rows.sort((a, b) => {
      const va = a[sortBy];
      const vb = b[sortBy];
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    return rows;
  },

  getTransactions(params: {
    page?: number;
    page_size?: number;
    search?: string;
    status_filter?: string;
    predicted_filter?: string;
    failed_node?: string;
    hour?: number | '';
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): PaginatedTransactions {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(5, params.page_size || 20);
    const filtered = this.filterTransactions(params);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    };
  },

  getTransactionDetail(txId: string): TransactionDetailResponse {
    const rows = transactionsSeedData as TransactionRecord[];
    const tx =
      rows.find((r) => r.finpath_id === txId || String(r.id) === txId) || rows[0];
    const live_analysis = this.analyzeTransaction({
      time: tx.time,
      user_latency: tx.user_latency,
      server_latency: tx.server_latency,
      bank_latency: tx.bank_latency,
      load: tx.load,
    });
    return {
      transaction: tx,
      live_analysis,
    };
  },

  exportTransactionsCsv(params: {
    search?: string;
    status_filter?: string;
    predicted_filter?: string;
    failed_node?: string;
    hour?: number | '';
  }): void {
    const rows = this.filterTransactions(params);
    const headers = [
      'Transaction ID',
      'Hour (UTC)',
      'User Latency (ms)',
      'Server Latency (ms)',
      'Bank Latency (ms)',
      'System Load (req/s)',
      'Actual Status',
      'Predicted Status',
      'Success Probability',
      'Failure Probability',
      'Actual Failure Component',
      'Predicted Failure Component',
    ];
    const lines = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.finpath_id,
          `${String(r.time).padStart(2, '0')}:00`,
          r.user_latency,
          r.server_latency,
          r.bank_latency,
          r.load,
          r.success === 1 ? 'Success' : 'Failed',
          r.predicted_success === 1 ? 'Success' : 'Failed',
          r.success_probability,
          r.failure_probability,
          r.failed_node,
          r.predicted_failed_node,
        ].join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finpath_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  analyzeTransaction(inputs: {
    time: number;
    user_latency: number;
    server_latency: number;
    bank_latency: number;
    load: number;
  }): FullAnalysisResult {
    const x = [
      Number(inputs.time),
      Number(inputs.user_latency),
      Number(inputs.server_latency),
      Number(inputs.bank_latency),
      Number(inputs.load),
    ];

    const fm = forestModelsData as any;
    const m1Probs = evaluateForest(
      fm.model1.trees as CompactTree[],
      x,
      fm.model1.classes.length
    );

    const failIdx = fm.model1.classes.indexOf(0);
    const succIdx = fm.model1.classes.indexOf(1);
    const failProb = Number((m1Probs[failIdx >= 0 ? failIdx : 0] ?? 0).toFixed(4));
    const succProb = Number((m1Probs[succIdx >= 0 ? succIdx : 1] ?? 1 - failProb).toFixed(4));
    const threshold = Number(fm.model1.decision_threshold ?? 0.5);
    const predictedClass = failProb >= threshold ? 0 : 1;
    const predictedOutcome = predictedClass === 1 ? 'Success' : 'Failure';
    const ensembleAgreement = Number(Math.max(succProb, failProb).toFixed(4));

    const m2Probs = evaluateForest(
      fm.model2.trees as CompactTree[],
      x,
      fm.model2.classes.length
    );
    const classProbs: Record<string, number> = {};
    let topNode = 'Server';
    let topNodeProb = -1;
    (fm.model2.classes as string[]).forEach((clsName, idx) => {
      const p = Number((m2Probs[idx] ?? 0).toFixed(4));
      classProbs[clsName] = p;
      if (p > topNodeProb) {
        topNodeProb = p;
        topNode = clsName;
      }
    });

    const metaAll = featureMetadataData as Record<string, any>;
    const featureOrder = ['time', 'user_latency', 'server_latency', 'bank_latency', 'load'];
    const thresholds: Record<string, number> = {
      user_latency: 70,
      server_latency: 90,
      bank_latency: 80,
      load: 20000,
    };

    const parameterBreakdown: ParameterBreakdownItem[] = featureOrder.map((feat) => {
      const val = Number((inputs as any)[feat]);
      const meta = metaAll[feat] || {};
      const mean = Number(meta.mean ?? val);
      const std = Number(meta.std ?? 1) || 1;
      const p50 = Number(meta.p50 ?? mean);
      const p75 = Number(meta.p75 ?? mean);
      const p90 = Number(meta.p90 ?? mean);
      const p95 = Number(meta.p95 ?? mean);
      const zScore = Number(((val - mean) / std).toFixed(2));

      let status = 'Normal (< P75)';
      let explanation = '';

      if (feat === 'time') {
        const isPeak = val >= 18 && val <= 22;
        status = isPeak ? 'Elevated (Peak Window)' : 'Normal';
        explanation = isPeak
          ? `Hour ${String(val).padStart(2, '0')}:00 falls within the evening peak concurrency window (18:00–22:00).`
          : `Hour ${String(val).padStart(2, '0')}:00 is within standard operating hours.`;
      } else {
        const thresh = thresholds[feat];
        if (val >= p95 || (thresh && val > thresh * 1.12)) {
          status = 'Critically Elevated (>= P95)';
        } else if ((thresh && val > thresh) || val >= p90) {
          status = 'Elevated (> Threshold / P90)';
        } else if (val >= p75) {
          status = 'Moderately High (P75–P90)';
        }
        const diffPct = mean ? Number((((val - mean) / mean) * 100).toFixed(1)) : 0;
        const sign = diffPct >= 0 ? '+' : '';
        explanation = `Input ${val} ${meta.unit || ''} is ${sign}${diffPct}% vs training mean (${mean} ${meta.unit || ''}, P90=${p90}, P95=${p95}, z=${zScore >= 0 ? '+' : ''}${zScore}).`;
      }

      return {
        feature: feat,
        label: meta.label || feat,
        unit: meta.unit || '',
        input_value: val,
        training_mean: mean,
        training_std: std,
        training_p50: p50,
        training_p90: p90,
        training_p95: p95,
        z_score: zScore,
        status,
        is_elevated: status.startsWith('Elevated') || status.startsWith('Critically'),
        explanation,
      };
    });

    const isFailure = predictedClass === 0;
    const elevatedParams = parameterBreakdown
      .filter((p) => p.is_elevated)
      .map((p) => p.label);

    const summary = isFailure
      ? `Model 1 predicts TRANSACTION FAILURE (${(failProb * 100).toFixed(1)}% failure probability). Model 2 identifies '${topNode}' as the primary bottleneck component (${((classProbs[topNode] || 0) * 100).toFixed(1)}% class probability).`
      : `Model 1 predicts TRANSACTION SUCCESS (${(succProb * 100).toFixed(1)}% success probability). ${
          elevatedParams.length > 0
            ? `Note: ${elevatedParams.join(', ')} showed elevated values relative to the training baseline.`
            : 'All operational parameters are within healthy training baselines.'
        }`;

    return {
      inputs,
      model1_prediction: {
        predicted_class: predictedClass,
        predicted_outcome: predictedOutcome,
        success_probability: succProb,
        failure_probability: failProb,
        ensemble_agreement: ensembleAgreement,
        confidence_note:
          'Probabilities reflect the proportion of decision trees in the Random Forest ensemble voting for each class on synthetic training data; they do not represent guaranteed certainty.',
      },
      model2_triggered: isFailure,
      predicted_failure_component: isFailure ? topNode : 'None',
      model2_prediction: {
        predicted_failure_component: topNode,
        class_probabilities: classProbs,
        attribution_note:
          "Model 2 estimates which component ('User', 'Server', or 'Bank') is most likely associated with a failure based on synthetic highest-latency training labels.",
      },
      parameter_breakdown: parameterBreakdown,
      elevated_parameters: elevatedParams,
      summary,
    };
  },

  getSimulatorPresets() {
    return {
      presets: PRESETS,
      feature_metadata: featureMetadataData as Record<string, any>,
    };
  },

  getFailureIntelligence(): FailureIntelligenceResponse {
    const s = analyticsSummaryData as any;
    return {
      most_problematic_component: s.most_problematic_component,
      peak_failure_hour: s.peak_failure_hour,
      total_failures: s.kpis.failed_transactions,
      failure_percentage: s.kpis.failure_rate,
      component_distribution: s.component_distribution,
      hourly_failures: s.hourly_distribution,
      latency_comparison: s.latency_comparison,
      load_analysis: s.load_analysis,
      insights: s.insights,
      recommendations: s.recommendations,
      disclaimer: s.disclaimer,
    };
  },

  getHourlyInsights() {
    const s = analyticsSummaryData as any;
    const hourly = s.hourly_distribution as any[];
    const maxCell = Math.max(
      ...hourly.map((h) =>
        Math.max(h.user_failures, h.server_failures, h.bank_failures)
      ),
      1
    );
    return {
      peak_failure_hour: s.peak_failure_hour,
      hourly_distribution: hourly,
      max_component_hourly_failures: maxCell,
      disclaimer: s.disclaimer,
    };
  },

  getComponentInsights() {
    const s = analyticsSummaryData as any;
    return {
      most_problematic_component: s.most_problematic_component,
      component_distribution: s.component_distribution,
      latency_comparison: s.latency_comparison,
      load_analysis: s.load_analysis,
      disclaimer: s.disclaimer,
    };
  },

  getModelMetrics(): ModelMetricsResponse {
    return evaluationMetricsData as ModelMetricsResponse;
  },

  getFeatureImportance() {
    const m = evaluationMetricsData as any;
    return {
      model1_feature_importance: m.model1.feature_importance,
      model2_feature_importance: m.model2.feature_importance,
      feature_metadata: featureMetadataData as Record<string, any>,
    };
  },

  getHealth() {
    return {
      status: 'healthy',
      service: 'FinPath AI — Transaction Intelligence Platform',
      version: '1.0.0',
      environment: 'github-pages-embedded-ml',
      models_loaded: true,
      dataset_size: 200000,
      database_dialect: 'embedded-artifacts + sqlite-compatible',
    };
  },
};
