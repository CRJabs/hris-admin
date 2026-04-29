import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";
import { 
  LayoutDashboard, FileText, UserPlus, Users, 
  DollarSign, BarChart3, Settings, CalendarDays, Zap 
} from "lucide-react";


export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const location = useLocation();

  let title = "Dashboard";
  let subtitle = "";
  let icon = null;

  if (location.pathname === '/') {
    title = "";
    subtitle = "";
    icon = null;
  } else if (location.pathname.startsWith('/dashboard')) {
    title = "HR Analytics";
    subtitle = "Deep dive into workforce metrics and trends.";
    icon = LayoutDashboard;
  } else if (location.pathname === '/approvals/updates') {
    title = "Profile Update Requests";
    subtitle = "Review and approve changes submitted by employees.";
    icon = FileText;
  } else if (location.pathname === '/approvals/registrations') {
    title = "New Registration Requests";
    subtitle = "Review digital 201 form submissions for new employees.";
    icon = UserPlus;
  } else if (location.pathname === '/approvals/leaves') {
    title = "Leave Applications";
    subtitle = "Review and process employee leave requests.";
    icon = CalendarDays;
  } else if (location.pathname.startsWith('/approvals')) {
    title = "Pending Approvals";
    subtitle = "Review profile update requests, new registrations, and leave applications.";
    icon = FileText;
  } else if (location.pathname.startsWith('/employees')) {
    title = "Employees";
    subtitle = "Manage your organization's employee records.";
    icon = Users;
  } else if (location.pathname.startsWith('/payroll')) {
    title = "Payroll & Bonuses";
    subtitle = "Manage employee compensation and benefits.";
    icon = DollarSign;
  } else if (location.pathname.startsWith('/reports')) {
    title = "Reports";
    subtitle = "Generate and view HR analytics.";
    icon = BarChart3;
  } else if (location.pathname === '/leaves/assign') {
    title = "Manage Leave Credits";
    subtitle = "Manage and adjust employee leave allocations.";
    icon = CalendarDays;
  } else if (location.pathname.startsWith('/settings')) {
    title = "Settings";
    subtitle = "Configure system preferences.";
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