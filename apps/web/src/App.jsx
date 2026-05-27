import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './pages/core/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/pages/auth/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { lazy, Suspense, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Lazy load pages for performance
const Home = lazy(() => import('@/pages/core/Home'));
const Dashboard = lazy(() => import('@/pages/core/Dashboard'));

const Employees = lazy(() => import('@/pages/employees/Employees'));
const Reports = lazy(() => import('@/pages/core/Reports'));
const Approvals = lazy(() => import('@/pages/Approvals'));
const EmployeeProfile = lazy(() => import('@/pages/employees/EmployeeProfile'));
const Login = lazy(() => import('@/pages/auth/Login'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const EmployeeRegistration = lazy(() => import('@/pages/employees/EmployeeRegistration'));
const Register = lazy(() => import('@/pages/auth/Register'));
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'));
const AddEmployee = lazy(() => import('@/pages/employees/AddEmployee'));
const ProfileUpdates = lazy(() => import('@/pages/approvals/ProfileUpdates'));
const NewRegistrations = lazy(() => import('@/pages/approvals/NewRegistrations'));
const AssignLeaveCredits = lazy(() => import('@/pages/leaves/AssignLeaveCredits'));
const LeaveApplications = lazy(() => import('@/pages/leaves/LeaveApplications'));
const Company = lazy(() => import('@/pages/Company'));
const Settings = lazy(() => import('@/pages/Settings'));


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

          <Route path="/approvals" element={<Approvals />}>
            <Route index element={<Navigate to="updates" replace />} />
            <Route path="updates" element={<ProfileUpdates />} />
            <Route path="registrations" element={<NewRegistrations />} />
            <Route path="leaves" element={<LeaveApplications />} />
          </Route>
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/add" element={<AddEmployee />} />
          <Route path="/leaves/assign" element={<AssignLeaveCredits />} />
          <Route path="/company" element={<Company />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/activity" element={<ActivityHistory />} />
          <Route path="/activity/bin" element={<BinPage />} />
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

import { Toaster as SonnerToaster, toast } from "sonner";
const ActivityHistory = lazy(() => import('@/pages/core/ActivityHistory'));
const BinPage = lazy(() => import('@/pages/core/BinPage'));

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
        <SonnerToaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            action: {
              label: "Dismiss all",
              onClick: () => toast.dismiss(),
            },
          }}
        />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App