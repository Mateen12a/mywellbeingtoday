import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import useKeepAlive from "./hooks/useKeepAlive";
import { setupGlobalAxiosInterceptor } from "./utils/api";
import AuthInitializer from "./components/AuthInitializer";
import App from "./App";

setupGlobalAxiosInterceptor();
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import PrivateRoute from "./utils/PrivateRoute";
import RoleGuard from "./utils/RoleGuard";
import ProfileSettings from "./pages/ProfileSettings";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import DashboardRouter from "./pages/dashboard/DashboardRouter";
import TaskOwnerDashboard from "./pages/dashboard/TaskOwnerDashboard";
import SolutionProviderDashboard from "./pages/dashboard/SolutionProviderDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminOnboarding from "./pages/admin/AdminOnboarding";
import AdminMessaging from "./pages/admin/AdminMessaging";
import TaskCreate from "./pages/tasks/TaskCreate";
import TaskDetails from "./pages/tasks/TaskDetails";
import BrowseTasks from "./pages/tasks/BrowseTasks";
import MyApplications from "./pages/sp/MyApplications";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminProposals from "./pages/admin/AdminProposals";
import MessagesPage from "./pages/messages/MessagesPage";
import PublicProfile from "./pages/PublicProfile";
import About from "./pages/static/About";
import Contact from "./pages/static/Contact";
import Privacy from "./pages/static/Privacy";
import Terms from "./pages/static/Terms";
import Notifications from "./pages/Notifications";

import "./index.css";

function KeepAliveWrapper({ children }) {
  useKeepAlive();
  return children;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <KeepAliveWrapper>
      <BrowserRouter>
      <AuthInitializer>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<DashboardRouter />} />
        
        <Route path="/dashboard/to" element={
          <RoleGuard allowedRoles={["taskOwner"]}>
            <TaskOwnerDashboard />
          </RoleGuard>
        } />
        
        <Route path="/dashboard/sp" element={
          <RoleGuard allowedRoles={["solutionProvider"]}>
            <SolutionProviderDashboard />
          </RoleGuard>
        } />
        
        <Route path="/dashboard/admin" element={
          <RoleGuard allowedRoles={["admin"]}>
            <AdminDashboard />
          </RoleGuard>
        } />
        
        <Route path="/admin/onboarding" element={
          <RoleGuard allowedRoles={["admin"]}>
            <AdminOnboarding />
          </RoleGuard>
        } />
        
        <Route path="/admin/messaging" element={
          <RoleGuard allowedRoles={["admin"]}>
            <AdminMessaging />
          </RoleGuard>
        } />
        
        <Route path="/admin/users" element={
          <RoleGuard allowedRoles={["admin"]}>
            <AdminUsers />
          </RoleGuard>
        } />
        
        <Route path="/admin/tasks" element={
          <RoleGuard allowedRoles={["admin"]}>
            <AdminTasks />
          </RoleGuard>
        } />
        
        <Route path="/admin/proposals" element={
          <RoleGuard allowedRoles={["admin"]}>
            <AdminProposals />
          </RoleGuard>
        } />
        
        <Route path="/tasks/create" element={
          <RoleGuard allowedRoles={["taskOwner", "admin"]}>
            <TaskCreate />
          </RoleGuard>
        } />
        
        <Route path="/tasks/:id" element={<PrivateRoute><TaskDetails /></PrivateRoute>} />
        <Route path="/browse-tasks" element={<PrivateRoute><BrowseTasks /></PrivateRoute>} />
        
        <Route path="/my-applications" element={
          <RoleGuard allowedRoles={["solutionProvider"]}>
            <MyApplications />
          </RoleGuard>
        } />
        
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/messages/:conversationId" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/inbox" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/chat/:conversationId" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/profile/:id" element={<PublicProfile />} />
        <Route path="/review/:id" element={<PublicProfile />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
      </AuthInitializer>
      </BrowserRouter>
    </KeepAliveWrapper>
  </ThemeProvider>
);
