import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, DollarSign, BarChart3, Settings, LogOut, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Pending Approvals", icon: CheckSquare, path: "/approvals" },
  { label: "Employee Masterlist", icon: Users, path: "/employees" },
  { label: "Payroll & Bonuses", icon: DollarSign, path: "/payroll" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const { logout } = useAuth();

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 sticky top-0 z-50",
        collapsed ? "w-17" : "w-60 absolute md:relative"
      )}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <span className="text-sidebar-primary-foreground font-bold text-sm">HR</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-semibold text-sm text-white truncate">PeopleCore HRIS</h1>
            <p className="text-[11px] text-sidebar-foreground/60 truncate">Human Resources System</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(`${path}/`);
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border mt-auto">
         <button
           onClick={logout}
           className={cn(
             "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-red-400 hover:bg-sidebar-accent transition-all duration-200",
             collapsed && "justify-center px-0"
           )}
           title="Sign out"
         >
           <LogOut className="w-4.5 h-4.5 shrink-0" />
           {!collapsed && <span className="truncate">Sign out</span>}
         </button>
      </div>
    </aside>
  );
}