import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, DollarSign, BarChart3, Settings, LogOut, 
  CheckSquare, ChevronLeft, ChevronRight, UserPlus, List, FileText, CalendarDays, Zap, Building2, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// Map action types to navigation targets
const ACTION_NAV = {
  employee_submitted_update: '/approvals/updates',
  employee_submitted_registration: '/approvals/registrations',
  admin_approved_update: '/approvals/updates',
  admin_rejected_update: '/approvals/updates',
  admin_approved_registration: '/approvals/registrations',
  admin_rejected_registration: '/approvals/registrations',
  admin_edited_employee: '/employees',
  admin_added_employee: '/employees',
  admin_assigned_leave_credits: '/leaves/assign',
  admin_toggled_employee_status: '/employees',
};

// Map action types to title text colors
const ACTION_TITLE_COLORS = {
  employee_submitted_update: 'text-amber-600',
  employee_submitted_registration: 'text-blue-600',
  admin_approved_update: 'text-green-600',
  admin_rejected_update: 'text-red-600',
  admin_approved_registration: 'text-green-600',
  admin_rejected_registration: 'text-red-600',
  admin_edited_employee: 'text-purple-600',
  admin_added_employee: 'text-blue-600',
  admin_assigned_leave_credits: 'text-purple-600',
  admin_toggled_employee_status: 'text-slate-600',
};

// Helper to make action keys human-readable
function formatActionTitle(action) {
  const titles = {
    employee_submitted_update: "Profile Update Request",
    employee_submitted_registration: "New Registration",
    admin_approved_update: "Update Approved",
    admin_rejected_update: "Update Rejected",
    admin_approved_registration: "Registration Approved",
    admin_rejected_registration: "Registration Rejected",
    admin_edited_employee: "Employee Record Edited",
    admin_added_employee: "New Employee Added",
    admin_assigned_leave_credits: "Leave Credits Updated",
    admin_toggled_employee_status: "Employee Status Changed",
  };
  return titles[action] || action;
}

const navItems = [
  { label: "Home", icon: Zap, path: "/" },
  { label: "Reports & Analytics", icon: BarChart3, path: "/reports" },
  { label: "University Chart", icon: Building2, path: "/company" },
  { 
    label: "Pending Approvals", 
    icon: CheckSquare, 
    path: "/approvals",
    children: [
      { label: "Profile Updates", icon: FileText, path: "/approvals/updates" },
      { label: "New Registrations", icon: UserPlus, path: "/approvals/registrations" },
      { label: "Leave Applications", icon: CalendarDays, path: "/approvals/leaves" },
    ]
  },
  { 
    label: "Employees", 
    icon: Users, 
    path: "/employees",
    children: [
      { label: "View Masterlist", icon: List, path: "/employees" },
      { label: "Onboarding", icon: UserPlus, path: "/employees/add" },
    ]
  },
  {
    label: "Leaves",
    icon: CalendarDays,
    path: "/leaves",
    children: [
      { label: "Manage Leave Credits", icon: List, path: "/leaves/assign" },
    ]
  },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState(["Employees", "Pending Approvals"]);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasBootstrappedNotifications = useRef(false);
  const seenNotificationIds = useRef(new Set());

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching notifications", error);
        return;
      }

      const notifs = (data || []).map(entry => ({
        id: entry.id,
        title: formatActionTitle(entry.action),
        message: entry.description,
        type: entry.action,
        time: new Date(entry.created_at),
        isRead: entry.is_read,
        action: () => navigate(ACTION_NAV[entry.action] || '/')
      }));

      if (hasBootstrappedNotifications.current) {
        const newNotifs = notifs.filter(n => !seenNotificationIds.current.has(n.id));
        newNotifs.forEach(notif => {
          toast(notif.title, {
            description: notif.message,
            duration: 6000,
          });
        });
      } else {
        hasBootstrappedNotifications.current = true;
      }

      seenNotificationIds.current = new Set(notifs.map(n => n.id));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);

    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const activitySub = supabase.channel('sidebar_activity_log')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_activity_log' }, fetchNotifications)
      .subscribe();

    return () => {
      activitySub.unsubscribe();
    };
  }, []);

  const handlePopoverOpen = async (open) => {
    if (open && unreadCount > 0) {
      setUnreadCount(0);
      await supabase
        .from('admin_activity_log')
        .update({ is_read: true })
        .eq('is_read', false);
    }
  };

  const toggleExpand = (label) => {
    setExpandedItems(prev => 
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  return (
    <aside 
      className={cn(
        "hidden md:flex h-screen bg-[#0C005F] text-white flex-col transition-all duration-300 sticky top-0 z-50",
        collapsed ? "w-17" : "w-64"
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

      <div className="p-3 border-t border-white/10 mt-auto space-y-1">
         <Popover onOpenChange={handlePopoverOpen}>
           <PopoverTrigger asChild>
             <button
               className={cn(
                 "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                 unreadCount > 0 ? "text-white bg-white/5" : "text-white/70 hover:text-white hover:bg-white/10",
                 collapsed && "justify-center px-0"
               )}
               title={collapsed ? "Notifications" : ""}
             >
               <div className="relative">
                 <Bell className="w-4.5 h-4.5 shrink-0" />
                 {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border border-[#0C005F] animate-in zoom-in duration-300">
                     {unreadCount}
                   </span>
                 )}
               </div>
               {!collapsed && <span className="truncate">Notifications</span>}
             </button>
           </PopoverTrigger>
           <PopoverContent 
             className="w-80 p-0 overflow-hidden rounded-xl border-slate-200 shadow-2xl ml-2 animate-in slide-in-from-left-2 duration-300" 
             side="right" 
             align="end"
             sideOffset={10}
           >
             <div className="bg-[#0C005F] p-4 text-white">
               <h3 className="text-sm font-bold flex items-center gap-2">
                 <Bell className="w-4 h-4" /> Notifications
               </h3>
               <p className="text-xs text-blue-200/60 mt-0.5">{notifications.length} recent items</p>
             </div>
             <ScrollArea className="h-[350px]">
               {notifications.length > 0 ? (
                 <div className="divide-y divide-slate-100">
                   {notifications.map((n) => {
                     const colorClass = ACTION_TITLE_COLORS[n.type] || 'text-primary';
                     return (
                       <div key={n.id} onClick={n.action} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group/item">
                         <div className="flex justify-between items-start mb-1">
                           <p className={`text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
                             {n.title}
                           </p>
                           <span className="text-[9px] text-muted-foreground shrink-0 ml-2">
                             {format(n.time, "MMM d")}
                           </span>
                         </div>
                         <p className="text-xs text-slate-700 leading-snug line-clamp-2">{n.message}</p>
                         <p className="text-[9px] text-slate-400 mt-1.5 flex items-center justify-between">
                           <span>{formatDistanceToNow(n.time, { addSuffix: true })}</span>
                           {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                         </p>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="p-8 text-center text-muted-foreground">
                   <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                   <p className="text-xs font-medium">All caught up!</p>
                 </div>
               )}
             </ScrollArea>
           </PopoverContent>
         </Popover>

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