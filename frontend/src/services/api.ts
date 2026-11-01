import {
  AuthTokenResponse,
  DashboardChartsResponse,
  DashboardSummaryResponse,
  FailureIntelligenceResponse,
  FullAnalysisResult,
  ModelMetricsResponse,
  PaginatedTransactions,
  SimulatorPreset,
  TransactionDetailResponse,
  User,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'finpath_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string, remember = true): void {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail =
          typeof errJson.detail === 'string'
            ? errJson.detail
            : JSON.stringify(errJson.detail);
      }
    } catch {
      // fallback to status text
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Authentication
  login: (email: string, password: string, remember_me = true) =>
    request<AuthTokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember_me }),
    }),

  register: (full_name: string, email: string, password: string) =>
    request<AuthTokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password }),
    }),

  demoLogin: () =>
    request<AuthTokenResponse>('/api/auth/demo', {
      method: 'POST',
    }),

  getMe: () => request<User>('/api/auth/me'),

  // Dashboard
  getDashboardSummary: () =>
    request<DashboardSummaryResponse>('/api/dashboard/summary'),

  getDashboardCharts: (startHour = 0, endHour = 23) =>
    request<DashboardChartsResponse>(
      `/api/dashboard/charts?start_hour=${startHour}&end_hour=${endHour}`
    ),

  // Transactions
  getTransactions: (params: {
    page?: number;
    page_size?: number;
    search?: string;
    status_filter?: string;
    predicted_filter?: string;
    failed_node?: string;
    hour?: number | '';
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));
    if (params.search) query.set('search', params.search);
    if (params.status_filter && params.status_filter !== 'all')
      query.set('status_filter', params.status_filter);
    if (params.predicted_filter && params.predicted_filter !== 'all')
      query.set('predicted_filter', params.predicted_filter);
    if (params.failed_node && params.failed_node !== 'all')
      query.set('failed_node', params.failed_node);
    if (params.hour !== undefined && params.hour !== '')
      query.set('hour', String(params.hour));
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);

    return request<PaginatedTransactions>(`/api/transactions?${query.toString()}`);
  },

  getTransactionDetail: (txId: string) =>
    request<TransactionDetailResponse>(`/api/transactions/${encodeURIComponent(txId)}`),

  exportTransactionsCsv: async (params: {
    search?: string;
    status_filter?: string;
    predicted_filter?: string;
    failed_node?: string;
    hour?: number | '';
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status_filter && params.status_filter !== 'all')
      query.set('status_filter', params.status_filter);
    if (params.predicted_filter && params.predicted_filter !== 'all')
      query.set('predicted_filter', params.predicted_filter);
    if (params.failed_node && params.failed_node !== 'all')
      query.set('failed_node', params.failed_node);
    if (params.hour !== undefined && params.hour !== '')
      query.set('hour', String(params.hour));

    const token = getStoredToken();
    const res = await fetch(`${API_BASE}/api/transactions/export?${query.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to export CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finpath_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Predictions & Simulator
  analyzeTransaction: (inputs: {
    time: number;
    user_latency: number;
    server_latency: number;
    bank_latency: number;
    load: number;
  }) =>
    request<FullAnalysisResult>('/api/simulator/analyze', {
      method: 'POST',
      body: JSON.stringify(inputs),
    }),

  getSimulatorPresets: () =>
    request<{
      presets: SimulatorPreset[];
      feature_metadata: Record<string, any>;
    }>('/api/simulator/presets'),

  // Insights
  getFailureIntelligence: () =>
    request<FailureIntelligenceResponse>('/api/insights/failures'),

  getHourlyInsights: () =>
    request<{
      peak_failure_hour: number;
      hourly_distribution: any[];
      max_component_hourly_failures: number;
      disclaimer: string;
    }>('/api/insights/hourly'),

  getComponentInsights: () =>
    request<{
      most_problematic_component: string;
      component_distribution: any[];
      latency_comparison: any[];
      load_analysis: any[];
      disclaimer: string;
    }>('/api/insights/components'),

  // Models
  getModelMetrics: () => request<ModelMetricsResponse>('/api/models/metrics'),

  getFeatureImportance: () =>
    request<{
      model1_feature_importance: any[];
      model2_feature_importance: any[];
      feature_metadata: Record<string, any>;
    }>('/api/models/feature-importance'),

  getHealth: () => request<Record<string, any>>('/health'),
};

