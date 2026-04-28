import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { lazy, Suspense, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Lazy load pages for performance
const Home = lazy(() => import('@/pages/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));

const Employees = lazy(() => import('@/pages/Employees'));
const Payroll = lazy(() => import('@/pages/Payroll'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const Approvals = lazy(() => import('@/pages/Approvals'));
const EmployeeProfile = lazy(() => import('@/pages/EmployeeProfile'));
const Login = lazy(() => import('@/pages/Login'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const EmployeeRegistration = lazy(() => import('@/pages/EmployeeRegistration'));
const Register = lazy(() => import('@/pages/Register'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const AddEmployee = lazy(() => import('@/pages/AddEmployee'));
const ProfileUpdates = lazy(() => import('@/pages/approvals/ProfileUpdates'));
const NewRegistrations = lazy(() => import('@/pages/approvals/NewRegistrations'));
const AssignLeaveCredits = lazy(() => import('@/pages/AssignLeaveCredits'));
const LeaveApplications = lazy(() => import('@/pages/LeaveApplications'));


// Loading component
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm z-50">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

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
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/approvals" element={<Navigate to="/approvals/updates" replace />} />
          <Route path="/approvals/updates" element={<ProfileUpdates />} />
          <Route path="/approvals/registrations" element={<NewRegistrations />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/add" element={<AddEmployee />} />
          <Route path="/leaves/assign" element={<AssignLeaveCredits />} />
          <Route path="/leaves/applications" element={<LeaveApplications />} />
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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/registration" element={<EmployeeRegistration />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App