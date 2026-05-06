import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState } from "react";
import { 
  LayoutDashboard, FileText, UserPlus, Users, 
  DollarSign, BarChart3, Settings, CalendarDays, Zap,
  Building2, List, CheckSquare
} from "lucide-react";


export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet context={{ globalSearch }} />
        </main>
      </div>
    </div>
  );
}