import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import Payroll from '@/pages/Payroll';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Approvals from '@/pages/Approvals';
import EmployeeProfile from '@/pages/EmployeeProfile';
import Login from '@/pages/Login';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError || !user) {
    if (authError?.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else {
      // Redirect to login
      return <Navigate to="/login" replace />;
    }
  }

  // Admin Routes
  if (user.role === 'admin') {
    return (
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  }

  // Employee Routes
  return (
    <Routes>
      <Route element={<EmployeeLayout />}>
        <Route path="/" element={<Navigate to="/my-profile" replace />} />
        <Route path="/my-profile" element={<EmployeeProfile />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App