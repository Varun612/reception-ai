import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';

// Public Layout Components
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';

// Public Pages
import { LandingPage } from './pages/public/LandingPage.js';
import { FeaturesPage } from './pages/public/FeaturesPage.js';
import { IndustriesPage } from './pages/public/IndustriesPage.js';
import { PricingPage } from './pages/public/PricingPage.js';
import { DemoPage } from './pages/public/DemoPage.js';
import { DocsPage } from './pages/public/DocsPage.js';
import { TermsPage } from './pages/public/TermsPage.js';
import { PrivacyPage } from './pages/public/PrivacyPage.js';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';

// Onboarding
import { OnboardingWizard } from './pages/onboarding/OnboardingWizard.js';

// Dashboard Shell & Pages
import { DashboardLayout } from './components/DashboardLayout.js';
import { OverviewPage } from './pages/dashboard/OverviewPage.js';
import { AppointmentsPage } from './pages/dashboard/AppointmentsPage.js';
import { AgentSettingsPage } from './pages/dashboard/AgentSettingsPage.js';
import { ServicesStaffPage } from './pages/dashboard/ServicesStaffPage.js';
import { BusinessSettingsPage } from './pages/dashboard/BusinessSettingsPage.js';
import { WidgetManagerPage } from './pages/dashboard/WidgetManagerPage.js';
import { BillingPage } from './pages/dashboard/BillingPage.js';
import { TeamPage } from './pages/dashboard/TeamPage.js';

// Admin Shell & Pages
import { AdminLayout } from './components/AdminLayout.js';
import { AdminMetricsPage } from './pages/admin/AdminMetricsPage.js';
import { AdminTenantsPage } from './pages/admin/AdminTenantsPage.js';
import { AdminPlansPage } from './pages/admin/AdminPlansPage.js';
import { AdminLogsPage } from './pages/admin/AdminLogsPage.js';

// Standalone Embed View
import { EmbedWidgetPage } from './pages/embed/EmbedWidgetPage.js';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
        Authenticating...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
        Authenticating...
      </div>
    );
  }
  if (!user || !user.isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Standalone Embeddable Widget (no navbar/footer) */}
      <Route path="/embed/:tenantSlug" element={<EmbedWidgetPage />} />

      {/* Auth Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Onboarding Wizard */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingWizard />
          </ProtectedRoute>
        }
      />

      {/* Client Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="agent" element={<AgentSettingsPage />} />
        <Route path="services" element={<ServicesStaffPage />} />
        <Route path="settings" element={<BusinessSettingsPage />} />
        <Route path="widget" element={<WidgetManagerPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="team" element={<TeamPage />} />
      </Route>

      {/* Super-Admin Platform Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminMetricsPage />} />
        <Route path="tenants" element={<AdminTenantsPage />} />
        <Route path="plans" element={<AdminPlansPage />} />
        <Route path="logs" element={<AdminLogsPage />} />
      </Route>

      {/* Public Marketing Site Routes (with Navbar & Footer) */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/industries" element={<IndustriesPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
};
