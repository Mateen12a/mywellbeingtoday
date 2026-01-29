import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { startHealthCheck, stopHealthCheck } from "@/lib/healthCheck";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Layout from "@/components/layout";
import Landing from "@/pages/landing";
import { Login, Register, Verify, Recovery } from "@/pages/auth";
import ProviderRegister from "@/pages/auth/provider-register";
import AdminLogin from "@/pages/auth/admin-login";
import AdminRegister from "@/pages/auth/admin-register";
import Dashboard from "@/pages/dashboard";
import ActivityLog from "@/pages/activity";
import MoodTracker from "@/pages/mood";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import Messages from "@/pages/messages";
import AIKnowledgeAssistant from "@/pages/ai-assistant";
import Certificates from "@/pages/certificates";
import Directory from "@/pages/directory";
import Subscription from "@/pages/subscription";
import NotFound from "@/pages/not-found";

import PractitionerDashboard from "@/pages/provider-dashboard";
import ProviderSettings from "@/pages/provider-settings";
import ProviderAIAssistant from "@/pages/provider-ai-assistant";

import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminUsersPage from "@/pages/admin/users";
import AdminProvidersPage from "@/pages/admin/providers";
import AdminSettingsPage from "@/pages/admin/settings";
import AdminProfilePage from "@/pages/admin/profile";
import AdminAuditLogsPage from "@/pages/admin/audit-logs";
import AdminActivityPage from "@/pages/admin/activity";
import AdminReportedChatsPage from "@/pages/admin/reported-chats";
import AdminSupportPage from "@/pages/admin/support";
import ManageAdminsPage from "@/pages/admin/manage-admins";
import SystemSettingsPage from "@/pages/admin/system-settings";
import AdminContentPage from "@/pages/admin/content";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Landing} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        
        {/* Auth Routes */}
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/register" component={Register} />
        <Route path="/auth/register-provider" component={ProviderRegister} />
        <Route path="/auth/register-admin" component={AdminRegister} />
        <Route path="/auth/admin-register-secret" component={AdminRegister} />
        <Route path="/auth/verify" component={Verify} />
        <Route path="/auth/recovery" component={Recovery} />
        
        {/* Admin Login Routes */}
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/auth/admin-login" component={AdminLogin} />
        <Route path="/auth/login-admin" component={AdminLogin} />

        {/* Protected Routes - User only */}
        <Route path="/dashboard">
          {() => (
            <ProtectedRoute requiredRole="user" fallbackPath="/provider-dashboard">
              <Dashboard />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/activity">
          {() => (
            <ProtectedRoute requiredRole="user">
              <ActivityLog />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/mood">
          {() => (
            <ProtectedRoute requiredRole="user">
              <MoodTracker />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/history">
          {() => (
            <ProtectedRoute requiredRole="user">
              <History />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/directory">
          {() => (
            <ProtectedRoute requiredRole="user">
              <Directory />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/messages">
          {() => (
            <ProtectedRoute requiredRole="user">
              <Messages />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/certificates">
          {() => (
            <ProtectedRoute requiredRole="user">
              <Certificates />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/settings">
          {() => (
            <ProtectedRoute requiredRole="user">
              <Settings />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/subscription">
          {() => (
            <ProtectedRoute requiredRole="user">
              <Subscription />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/ai-assistant">
          {() => (
            <ProtectedRoute requiredRole="user">
              <AIKnowledgeAssistant />
            </ProtectedRoute>
          )}
        </Route>
        
        {/* Protected Routes - Provider only */}
        <Route path="/provider-dashboard">
          {() => (
            <ProtectedRoute requiredRole="provider" fallbackPath="/dashboard">
              <PractitionerDashboard />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/provider-settings">
          {() => (
            <ProtectedRoute requiredRole="provider" fallbackPath="/dashboard">
              <ProviderSettings />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/provider-ai-assistant">
          {() => (
            <ProtectedRoute requiredRole="provider" fallbackPath="/dashboard">
              <ProviderAIAssistant />
            </ProtectedRoute>
          )}
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard">
          {() => (
            <ProtectedRoute requiredRole={['admin', 'super_admin']} fallbackPath="/dashboard">
              <AdminDashboardPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin/users">
          {() => (
            <ProtectedRoute requiredRole={['admin', 'super_admin']} fallbackPath="/dashboard">
              <AdminUsersPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin/providers">
          {() => (
            <ProtectedRoute requiredRole={['admin', 'super_admin']} fallbackPath="/dashboard">
              <AdminProvidersPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin/content">
          {() => (
            <ProtectedRoute requiredRole={['admin', 'super_admin']} fallbackPath="/dashboard">
              <AdminContentPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin/settings">
          {() => (
            <ProtectedRoute requiredRole={['admin', 'super_admin']} fallbackPath="/dashboard">
              <AdminSettingsPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin/profile">
          {() => (
            <ProtectedRoute requiredRole={['admin', 'super_admin']} fallbackPath="/dashboard">
              <AdminProfilePage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin/audit-logs">
          {() => (
            <ProtectedRoute requiredRole={['admin', 'super_admin']} fallbackPath="/dashboard">
              <AdminAuditLogsPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin/activity">
          {() => (
            <ProtectedRoute requiredRole={['admin', 'super_admin']} fallbackPath="/dashboard">
              <AdminActivityPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin/reported-chats">
          {() => (
            <ProtectedRoute requiredRole={['admin', 'super_admin']} fallbackPath="/dashboard">
              <AdminReportedChatsPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin/support">
          {() => (
            <ProtectedRoute requiredRole={['admin', 'super_admin']} fallbackPath="/dashboard">
              <AdminSupportPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin/manage-admins">
          {() => (
            <ProtectedRoute requiredRole={['admin', 'super_admin']} fallbackPath="/dashboard">
              <ManageAdminsPage />
            </ProtectedRoute>
          )}
        </Route>
        
        {/* Secret System Settings - Super Admin only */}
        <Route path="/admin/system-settings">
          {() => (
            <ProtectedRoute requiredRole="super_admin" fallbackPath="/admin/dashboard">
              <SystemSettingsPage />
            </ProtectedRoute>
          )}
        </Route>
        
        {/* Legacy admin route redirect */}
        <Route path="/admin">
          {() => <Redirect to="/admin/dashboard" />}
        </Route>

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    startHealthCheck();
    return () => stopHealthCheck();
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <Router />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
