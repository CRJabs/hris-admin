import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";
import { 
  LayoutDashboard, FileText, UserPlus, Users, 
  DollarSign, BarChart3, Settings, CalendarDays, Zap,
  Building2, List, CheckSquare
} from "lucide-react";


export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const location = useLocation();

  let title = "Dashboard";
  let subtitle = "";
  let icon = null;

  const path = location.pathname;

  if (path === '/') {
    title = "Home";
    subtitle = "Welcome to the UB HR Information System.";
    icon = Zap;
  } else if (path === '/reports') {
    title = "Reports & Analytics";
    subtitle = "Generate and view institutional HR analytics.";
    icon = BarChart3;
  } else if (path === '/company') {
    title = "Company Structure";
    subtitle = "View organization hierarchy and department alignment.";
    icon = Building2;
  } else if (path === '/approvals/updates') {
    title = "Profile Update Requests";
    subtitle = "Review and approve changes submitted by employees.";
    icon = FileText;
  } else if (path === '/approvals/registrations') {
    title = "New Registration Requests";
    subtitle = "Review digital 201 form submissions for new employees.";
    icon = UserPlus;
  } else if (path === '/approvals/leaves') {
    title = "Leave Applications";
    subtitle = "Review and process employee leave requests.";
    icon = CalendarDays;
  } else if (path.startsWith('/approvals')) {
    title = "Pending Approvals";
    subtitle = "Review pending HR requests.";
    icon = CheckSquare;
  } else if (path === '/employees/add') {
    title = "Onboard New Employee";
    subtitle = "Register a new employee into the system.";
    icon = UserPlus;
  } else if (path.startsWith('/employees')) {
    title = "Employee Masterlist";
    subtitle = "Manage your organization's employee records.";
    icon = Users;
  } else if (path === '/leaves/assign') {
    title = "Manage Leave Credits";
    subtitle = "Adjust and manage employee leave allocations.";
    icon = List;
  } else if (path.startsWith('/payroll')) {
    title = "Payroll & Bonuses";
    subtitle = "Manage employee compensation.";
    icon = DollarSign;
  } else if (path.startsWith('/settings')) {
    title = "System Settings";
    subtitle = "Configure system preferences and global parameters.";
    icon = Settings;
  }


  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header collapsed={collapsed} setCollapsed={setCollapsed} onSearch={setGlobalSearch} title={title} subtitle={subtitle} icon={icon} />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet context={{ globalSearch }} />
        </main>
      </div>
    </div>
  );
}