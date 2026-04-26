import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";

export default function AppLayout() {
  const [globalSearch, setGlobalSearch] = useState("");
  const location = useLocation();

  let title = "Dashboard";
  let subtitle = "";

  if (location.pathname.startsWith('/dashboard')) {
    title = "HR Dashboard";
    subtitle = "Welcome back. Here's what's happening today.";
  } else if (location.pathname.startsWith('/approvals')) {
    title = "Pending Approvals";
    subtitle = "Review profile update requests and new employee registrations.";
  } else if (location.pathname.startsWith('/employees')) {
    title = "Employee Masterlist";
    subtitle = "Manage your organization's employee records.";
  } else if (location.pathname.startsWith('/payroll')) {
    title = "Payroll & Bonuses";
    subtitle = "Manage employee compensation and benefits.";
  } else if (location.pathname.startsWith('/reports')) {
    title = "Reports";
    subtitle = "Generate and view HR analytics.";
  } else if (location.pathname.startsWith('/settings')) {
    title = "Settings";
    subtitle = "Configure system preferences.";
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onSearch={setGlobalSearch} title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet context={{ globalSearch }} />
        </main>
      </div>
    </div>
  );
}