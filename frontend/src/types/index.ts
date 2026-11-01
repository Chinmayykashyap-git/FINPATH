export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_demo: boolean;
  created_at?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface DashboardKPIs {
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  success_rate: number;
  failure_rate: number;
  avg_user_latency: number;
  avg_server_latency: number;
  avg_bank_latency: number;
  avg_system_load: number;
  comparisons: {
    off_peak_success_rate: number;
    peak_window_success_rate: number;
    failed_vs_success_server_latency_delta: number;
    failed_vs_success_bank_latency_delta: number;
    failed_vs_success_user_latency_delta: number;
  };
}

export interface DashboardSummaryResponse {
  kpis: DashboardKPIs;
  most_problematic_component: string;
  peak_failure_hour: number;
  disclaimer: string;
}

export interface HourlyStat {
  hour: number;
  hour_label: string;
  total: number;
  successful: number;
  failed: number;
  failure_rate: number;
  success_rate: number;
  avg_user_latency: number;
  avg_server_latency: number;
  avg_bank_latency: number;
  avg_load: number;
  user_failures: number;
  server_failures: number;
  bank_failures: number;
}

export interface ComponentDistItem {
  component: string;
  failures: number;
  percentage: number;
  share_of_all_tx?: number;
  'avg_latency_ overall'?: number;
  avg_latency_on_failure?: number;
  p95_latency?: number;
}

export interface LatencyComparisonItem {
  component: string;
  overall_mean: number;
  success_mean: number;
  failure_mean: number;
  p50: number;
  p90: number;
  p95: number;
  threshold: number;
}

export interface LoadBucketItem {
  bucket: string;
  min_load: number;
  max_load: number;
  total: number;
  successful: number;
  failed: number;
  failure_rate: number;
}

export interface DashboardChartsResponse {
  time_filter: { start_hour: number; end_hour: number };
  success_vs_failure: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  hourly_volume: HourlyStat[];
  failure_by_component: ComponentDistItem[];
  latency_analysis: LatencyComparisonItem[];
  system_load_analysis: LoadBucketItem[];
}

export interface TransactionRecord {
  id: number;
  finpath_id: string;
  time: number;
  user_latency: number;
  server_latency: number;
  bank_latency: number;
  load: number;
  success: number;
  failed_node: string;
  predicted_success: number;
  success_probability: number;
  failure_probability: number;
  predicted_failed_node: string;
}

export interface PaginatedTransactions {
  items: TransactionRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ParameterBreakdownItem {
  feature: string;
  label: string;
  unit: string;
  input_value: number;
  training_mean: number;
  training_std: number;
  training_p50: number;
  training_p90: number;
  training_p95: number;
  z_score: number;
  status: string;
  is_elevated: boolean;
  explanation: string;
}

export interface FullAnalysisResult {
  inputs: {
    time: number;
    user_latency: number;
    server_latency: number;
    bank_latency: number;
    load: number;
  };
  model1_prediction: {
    predicted_class: number;
    predicted_outcome: string;
    success_probability: number;
    failure_probability: number;
    ensemble_agreement: number;
    confidence_note: string;
  };
  model2_triggered: boolean;
  predicted_failure_component: string;
  model2_prediction: {
    predicted_failure_component: string;
    class_probabilities: Record<string, number>;
    attribution_note: string;
  };
  parameter_breakdown: ParameterBreakdownItem[];
  elevated_parameters: string[];
  summary: string;
}

export interface TransactionDetailResponse {
  transaction: TransactionRecord;
  live_analysis: FullAnalysisResult;
}

export interface OperationalInsight {
  id: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  detail: string;
}

export interface OperationalRecommendation {
  id: string;
  target: string;
  priority: string;
  action: string;
  rationale: string;
}

export interface FailureIntelligenceResponse {
  most_problematic_component: string;
  peak_failure_hour: number;
  total_failures: number;
  failure_percentage: number;
  component_distribution: ComponentDistItem[];
  hourly_failures: HourlyStat[];
  latency_comparison: LatencyComparisonItem[];
  load_analysis: LoadBucketItem[];
  insights: OperationalInsight[];
  recommendations: OperationalRecommendation[];
  disclaimer: string;
}

export interface FeatureImportanceItem {
  feature: string;
  label: string;
  importance: number;
  description: string;
}

export interface ClassificationReportRow {
  class_name: string;
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface ModelEvaluationBlock {
  model_name: string;
  algorithm: string;
  task_type: string;
  train_samples: number;
  test_samples: number;
  accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  precision_weighted: number;
  recall_weighted: number;
  f1_weighted: number;
  confusion_matrix: {
    labels: string[];
    matrix: number[][];
  };
  classification_report: ClassificationReportRow[];
  feature_importance: FeatureImportanceItem[];
  hyperparameters: Record<string, string | number>;
  labeling_methodology_note?: string;
}

export interface ModelMetricsResponse {
  random_state: number;
  dataset_size: number;
  test_split_ratio: number;
  stratified_split: boolean;
  class_imbalance_explanation: string;
  model1: ModelEvaluationBlock;
  model2: ModelEvaluationBlock;
}

export interface SimulatorPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  inputs: {
    time: number;
    user_latency: number;
    server_latency: number;
    bank_latency: number;
    load: number;
  };
}

