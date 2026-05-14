import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import { useState } from "react";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile-only top header bar */}
        <header className="md:hidden flex items-center justify-center px-4 h-14 bg-[#0C005F] shrink-0 shadow-md z-40">
          <img
            src="/assets/ub-hris-logo-white.png"
            alt="UB HRIS"
            className="h-7 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile floating bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}