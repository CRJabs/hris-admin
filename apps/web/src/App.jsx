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
import { Toaster as SonnerToaster, toast } from "sonner";

// Lazy load pages for performance
const Home = lazy(() => import('@/pages/core/Home'));
const AccountsManagement = lazy(() => import('@/pages/core/AccountsManagement'));
const Dashboard = lazy(() => import('@/pages/core/Dashboard'));
const ActivityHistory = lazy(() => import('@/pages/core/ActivityHistory'));
const BinPage = lazy(() => import('@/pages/core/BinPage'));

const Employees = lazy(() => import('@/pages/employees/Employees'));
const Reports = lazy(() => import('@/pages/core/Reports'));
const Approvals = lazy(() => import('@/pages/approvals/index'));
const EmployeeProfile = lazy(() => import('@/pages/employees/EmployeeProfile'));
const Login = lazy(() => import('@/pages/auth/Login'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const EmployeeRegistration = lazy(() => import('@/pages/employees/EmployeeRegistration'));
const Register = lazy(() => import('@/pages/auth/Register'));
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'));
const ForcePasswordChange = lazy(() => import('@/pages/auth/ForcePasswordChange'));
const AddEmployee = lazy(() => import('@/pages/employees/AddEmployee'));
const ProfileUpdates = lazy(() => import('@/pages/approvals/ProfileUpdates'));
const NewRegistrations = lazy(() => import('@/pages/approvals/NewRegistrations'));
const AssignLeaveCredits = lazy(() => import('@/pages/leaves/AssignLeaveCredits'));
const LeaveApplications = lazy(() => import('@/pages/leaves/LeaveApplications'));
const Commutations = lazy(() => import('@/pages/approvals/Commutations'));
const Resignations = lazy(() => import('@/pages/approvals/Resignations'));
const Retirements = lazy(() => import('@/pages/approvals/Retirements'));
const Company = lazy(() => import('@/pages/core/Company'));


// Loading component
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm z-50">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// Helper component to guard routes based on role and privileges
const ProtectedRoute = ({ path, element }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return element;
  if (path === '/') return element;
  
  const privileges = Array.isArray(user.privileges) ? user.privileges : [];
  const isAllowed = privileges.includes(path) || privileges.some(priv => path.startsWith(priv + '/'));
  
  if (isAllowed) {
    return element;
  }
  
  return <Navigate to="/" replace />;
};

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

  // Admin / Staff / Custom role Routes (anything other than 'employee')
  if (user.role !== 'employee') {
    return (
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/accounts" element={<ProtectedRoute path="/accounts" element={<AccountsManagement />} />} />
          <Route path="/accounts/admin" element={<ProtectedRoute path="/accounts" element={<AccountsManagement />} />} />
          <Route path="/accounts/employee" element={<ProtectedRoute path="/accounts" element={<AccountsManagement />} />} />
          <Route path="/dashboard" element={<ProtectedRoute path="/dashboard" element={<Dashboard />} />} />

          <Route path="/approvals" element={<ProtectedRoute path="/approvals" element={<Approvals />} />}>
            <Route index element={<Navigate to="updates" replace />} />
            <Route path="updates" element={<ProtectedRoute path="/approvals/updates" element={<ProfileUpdates />} />} />
            <Route path="registrations" element={<ProtectedRoute path="/approvals/registrations" element={<NewRegistrations />} />} />
            <Route path="leaves" element={<ProtectedRoute path="/approvals/leaves" element={<LeaveApplications />} />} />
            <Route path="commutations" element={<ProtectedRoute path="/approvals/commutations" element={<Commutations />} />} />
            <Route path="resignations" element={<ProtectedRoute path="/approvals/resignations" element={<Resignations />} />} />
            <Route path="retirements" element={<ProtectedRoute path="/approvals/retirements" element={<Retirements />} />} />
          </Route>
          
          <Route path="/employees" element={<ProtectedRoute path="/employees" element={<Employees />} />} />
          <Route path="/employees/add" element={<ProtectedRoute path="/employees/add" element={<AddEmployee />} />} />
          <Route path="/leaves/assign" element={<ProtectedRoute path="/leaves/assign" element={<AssignLeaveCredits />} />} />
          <Route path="/company" element={<ProtectedRoute path="/company" element={<Company />} />} />
          <Route path="/reports" element={<ProtectedRoute path="/reports" element={<Reports />} />} />
          <Route path="/activity" element={<ProtectedRoute path="/activity" element={<ActivityHistory />} />} />
          <Route path="/activity/bin" element={<ProtectedRoute path="/activity/bin" element={<BinPage />} />} />
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
              <Route path="/force-password-change" element={<ForcePasswordChange />} />
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