import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import InsightsPage from './pages/InsightsPage';
import BudgetsPage from './pages/BudgetsPage';
import SettingsPage from './pages/SettingsPage';
import AdvancedAnalyticsPage from './pages/AdvancedAnalyticsPage';
import PredictionsPage from './pages/PredictionsPage';
import HeatmapPage from './pages/HeatmapPage';
import SmartBudgetingPage from './pages/SmartBudgetingPage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import CollaborativePage from './pages/CollaborativePage';
import InvestmentsPage from './pages/InvestmentsPage';
import GoalsPage from './pages/GoalsPage';
import FeedPage from './pages/FeedPage';
import DashboardLayout from './layouts/DashboardLayout';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={!loading && isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={!loading && isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} />

      {/* Dashboard pages */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/advanced-analytics" element={<AdvancedAnalyticsPage />} />
        <Route path="/predictions" element={<PredictionsPage />} />
        <Route path="/heatmaps" element={<HeatmapPage />} />
        <Route path="/smart-budgets" element={<SmartBudgetingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/collaborative" element={<CollaborativePage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/feed" element={<FeedPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
