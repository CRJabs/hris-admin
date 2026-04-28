import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, DollarSign, BarChart3, Settings, LogOut, 
  CheckSquare, ChevronLeft, ChevronRight, UserPlus, List, FileText, CalendarDays, Zap 
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { label: "Home", icon: Zap, path: "/" },
  { label: "Analytics", icon: LayoutDashboard, path: "/dashboard" },
  { 
    label: "Pending Approvals", 
    icon: CheckSquare, 
    path: "/approvals",
    children: [
      { label: "Profile Updates", icon: FileText, path: "/approvals/updates" },
      { label: "New Registrations", icon: UserPlus, path: "/approvals/registrations" },
    ]
  },
  { 
    label: "Employees", 
    icon: Users, 
    path: "/employees",
    children: [
      { label: "View Masterlist", icon: List, path: "/employees" },
      { label: "Add New Employee", icon: UserPlus, path: "/employees/add" },
    ]
  },
  {
    label: "Leaves",
    icon: CalendarDays,
    path: "/leaves",
    children: [
      { label: "Assign Leave Credits", icon: List, path: "/leaves/assign" },
      { label: "Leave Applications", icon: FileText, path: "/leaves/applications" },
    ]
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState(["Employees", "Pending Approvals"]);

  const toggleExpand = (label) => {
    setExpandedItems(prev => 
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-[#0C005F] text-white flex flex-col transition-all duration-300 sticky top-0 z-50",
        collapsed ? "w-17" : "w-64 absolute md:relative"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[28px] bg-white text-[#0C005F] border border-slate-200 rounded-md p-0.5 shadow-md hover:bg-slate-50 z-50 transition-all"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="p-4 flex items-center justify-center border-b border-white/10 h-20 overflow-hidden">
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

      <nav className="flex-1 py-3 px-2 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const { label, icon: Icon, path, children } = item;
          const isActive = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
          const isExpanded = expandedItems.includes(label);

          if (children && !collapsed) {
            return (
              <div key={label} className="space-y-1">
                <button
                  onClick={() => toggleExpand(label)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </div>
                  {isExpanded ? <ChevronLeft className="w-3.5 h-3.5 -rotate-90 transition-transform" /> : <ChevronLeft className="w-3.5 h-3.5 transition-transform" />}
                </button>
                {isExpanded && (
                  <div className="ml-4 pl-3 border-l border-white/10 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {children.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                            isChildActive
                              ? "bg-white/20 text-white shadow-sm"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
              title={collapsed ? label : ""}
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