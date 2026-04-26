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
        "h-screen bg-[#0C005F] text-white flex flex-col transition-all duration-300 sticky top-0 z-50",
        collapsed ? "w-17" : "w-64 absolute md:relative"
      )}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <div className="p-4 flex items-center justify-center border-b border-white/10 h-16 overflow-hidden">
        <div className={cn("flex items-center justify-center shrink-0 transition-all duration-300", collapsed ? "w-8 h-8" : "w-auto h-8")}>
          <img 
            src={collapsed ? "/assets/ub.png" : "/assets/ub-hris-logo-white.png"} 
            alt="UB HRIS" 
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement.innerHTML = collapsed ? '<span class="text-xs font-bold text-white">UB</span>' : '<span class="text-lg font-bold text-white tracking-widest">HRIS</span>';
            }}
          />
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 mt-2">
        {navItems.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(`${path}/`);
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/20 text-white shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 mt-auto">
         <button
           onClick={logout}
           className={cn(
             "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-red-400 hover:bg-white/10 transition-all duration-200",
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