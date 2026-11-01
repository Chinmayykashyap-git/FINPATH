import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { TransactionMonitorPage } from './pages/TransactionMonitorPage';
import { AIPredictionsPage } from './pages/AIPredictionsPage';
import { FailureIntelligencePage } from './pages/FailureIntelligencePage';
import { BankInsightsPage } from './pages/BankInsightsPage';
import { TransactionSimulatorPage } from './pages/TransactionSimulatorPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] flex items-center justify-center text-sm text-[#94A3B8]">
        Verifying FinPath AI session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<OverviewPage />} />
            <Route path="transactions" element={<TransactionMonitorPage />} />
            <Route path="predictions" element={<AIPredictionsPage />} />
            <Route
              path="failure-intelligence"
              element={<FailureIntelligencePage />}
            />
            <Route path="bank-insights" element={<BankInsightsPage />} />
            <Route path="simulator" element={<TransactionSimulatorPage />} />
            <Route
              path="model-performance"
              element={<ModelPerformancePage />}
            />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

