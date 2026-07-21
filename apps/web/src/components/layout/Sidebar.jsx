import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, DollarSign, BarChart3, LogOut, 
  CheckSquare, ChevronLeft, ChevronRight, UserPlus, List, FileText, CalendarDays, Zap, Building2, Bell,
  History, Trash2, Shield, RefreshCw, Award, PieChart, TrendingUp, SendHorizontal
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
  dept_head_approved_leave: '/approvals/leaves',
  dept_head_rejected_leave: '/approvals/leaves',
  employee_filed_leave: '/approvals/leaves',
  published_announcement: '/publish',
};

// Map action types to title text colors & badge styles
const ACTION_TITLE_COLORS = {
  employee_submitted_update: 'text-amber-600 bg-amber-50 border-amber-200',
  employee_submitted_registration: 'text-blue-600 bg-blue-50 border-blue-200',
  admin_approved_update: 'text-green-600 bg-green-50 border-green-200',
  admin_rejected_update: 'text-red-600 bg-red-50 border-red-200',
  admin_approved_registration: 'text-green-600 bg-green-50 border-green-200',
  admin_rejected_registration: 'text-red-600 bg-red-50 border-red-200',
  admin_edited_employee: 'text-purple-600 bg-purple-50 border-purple-200',
  admin_added_employee: 'text-blue-600 bg-blue-50 border-blue-200',
  admin_assigned_leave_credits: 'text-purple-600 bg-purple-50 border-purple-200',
  admin_toggled_employee_status: 'text-slate-600 bg-slate-50 border-slate-200',
  dept_head_approved_leave: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  dept_head_rejected_leave: 'text-rose-600 bg-rose-50 border-rose-200',
  employee_filed_leave: 'text-blue-600 bg-blue-50 border-blue-200',
  published_announcement: 'text-indigo-600 bg-indigo-50 border-indigo-200',
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
    dept_head_approved_leave: "Leave Approved by Dept Head",
    dept_head_rejected_leave: "Leave Rejected by Dept Head",
    employee_filed_leave: "New Leave Application",
    published_announcement: "System Announcement Published",
  };
  return titles[action] || action;
}

const navItems = [
  { label: "Home", icon: Zap, path: "/" },
  // { label: "Analytics", icon: TrendingUp, path: "/analytics" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "University Chart", icon: Building2, path: "/company" },
  { 
    label: "Pending Approvals", 
    icon: CheckSquare, 
    path: "/approvals",
    children: [
      { label: "Profile Updates", icon: FileText, path: "/approvals/updates" },
      { label: "New Registrations", icon: UserPlus, path: "/approvals/registrations" },
      { label: "Leave Applications", icon: CalendarDays, path: "/approvals/leaves" },
      { label: "Commutation Requests", icon: RefreshCw, path: "/approvals/commutations" },
      { label: "Resignations", icon: LogOut, path: "/approvals/resignations" },
      { label: "Retirements", icon: Award, path: "/approvals/retirements" },
    ]
  },
  { 
    label: "Personnel", 
    icon: Users, 
    path: "/employees",
    children: [
      { label: "View Masterlist", icon: List, path: "/employees" },
      { label: "Onboarding", icon: UserPlus, path: "/employees/add" },
    ]
  },
  { label: "Leaves",
    icon: CalendarDays,
    path: "/leaves",
    children: [
      { label: "Manage Leave Credits", icon: List, path: "/leaves/assign" },
    ]
  },
  { label: "Publish", icon: SendHorizontal, path: "/publish" },
  {
    label: "Activity History",
    icon: History,
    path: "/activity",
    children: [
      { label: "Activity", icon: Bell, path: "/activity" },
      { label: "Bin", icon: Trash2, path: "/activity/bin" },
    ]
  },
  { 
    label: "Accounts Management", 
    icon: Shield, 
    path: "/accounts",
    children: [
      { label: "Administrator Accounts", icon: Shield, path: "/accounts/admin" },
      { label: "Employee Accounts", icon: Users, path: "/accounts/employee" },
    ]
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState([]);

  // Check if a path is allowed based on user role and privileges
  const isPathAllowed = (path) => {
    if (path === "/") return true;
    if (user?.role === "admin") return true;

    const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
    
    // Explicit match
    if (privileges.includes(path)) return true;
    
    // Parent prefix check
    return privileges.some(priv => path.startsWith(priv + '/'));
  };

  // Filter navigation items dynamically
  const filteredNavItems = navItems
    .map(item => {
      if (item.children) {
        const allowedChildren = item.children.filter(child => isPathAllowed(child.path));
        if (allowedChildren.length > 0) {
          return { ...item, children: allowedChildren };
        }
        if (isPathAllowed(item.path)) {
          return { ...item, children: undefined };
        }
        return null;
      }
      return isPathAllowed(item.path) ? item : null;
    })
    .filter(Boolean);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasBootstrappedNotifications = useRef(false);
  const seenNotificationIds = useRef(new Set());

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*, employees(photo_url, first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching notifications", error);
        return;
      }

      const notifs = (data || []).map(entry => {
        const isAdmin = entry.actor_type === 'admin' || entry.actor_name?.toLowerCase().includes('admin') || entry.actor_name?.includes('@');
        const displayName = isAdmin ? 'Administrator' : (entry.actor_name || 'System');
        const empPhoto = Array.isArray(entry.employees) ? entry.employees[0]?.photo_url : entry.employees?.photo_url;
        const photoUrl = isAdmin ? '/assets/ub.png' : (empPhoto || null);
        const initials = displayName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return {
          id: entry.id,
          title: formatActionTitle(entry.action),
          message: entry.description,
          type: entry.action,
          time: new Date(entry.created_at),
          isRead: entry.is_read,
          displayName,
          photoUrl,
          initials,
          action: () => navigate(ACTION_NAV[entry.action] || '/')
        };
      });

      if (hasBootstrappedNotifications.current) {
        const newNotifs = notifs.filter(n => !seenNotificationIds.current.has(n.id));
        newNotifs.forEach(notif => {
          const type = notif.type.toLowerCase();
          let toastFn = toast.info;
          if (type.includes('approved') || type.includes('added') || type.includes('edited')) {
            toastFn = toast.success;
          } else if (type.includes('rejected')) {
            toastFn = toast.error;
          }
          
          toastFn(notif.title, {
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

  const [pendingCounts, setPendingCounts] = useState({
    '/approvals/updates': 0,
    '/approvals/registrations': 0,
    '/approvals/leaves': 0,
    '/approvals/commutations': 0,
    '/approvals/resignations': 0,
    '/approvals/retirements': 0,
  });

  const fetchPendingCounts = async () => {
    try {
      const [updates, regs, leaves, commutations, resignations, retirements] = await Promise.all([
        supabase.from('employee_update_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'Pending'),
        supabase.from('leave_applications').select('id', { count: 'exact', head: true }).in('status', ['pending', 'pending_dept_head']),
        supabase.from('commutation_requests').select('id', { count: 'exact', head: true }).not('status', 'in', '("approved","rejected")'),
        supabase.from('resignation_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('retirement_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setPendingCounts({
        '/approvals/updates': updates.count || 0,
        '/approvals/registrations': regs.count || 0,
        '/approvals/leaves': leaves.count || 0,
        '/approvals/commutations': commutations.count || 0,
        '/approvals/resignations': resignations.count || 0,
        '/approvals/retirements': retirements.count || 0,
      });
    } catch (err) {
      console.error("Error fetching pending counts in sidebar:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPendingCounts();

    const handleCountsChanged = () => {
      fetchPendingCounts();
    };

    window.addEventListener('pending_counts_changed', handleCountsChanged);

    const activitySub = supabase.channel('sidebar_activity_log')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_activity_log' }, fetchNotifications)
      .subscribe();

    const updatesSub = supabase.channel('sidebar-pending-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_update_requests' }, fetchPendingCounts)
      .subscribe();
    const regsSub = supabase.channel('sidebar-pending-regs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchPendingCounts)
      .subscribe();
    const leavesSub = supabase.channel('sidebar-pending-leaves')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_applications' }, fetchPendingCounts)
      .subscribe();
    const commSub = supabase.channel('sidebar-pending-comm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commutation_requests' }, fetchPendingCounts)
      .subscribe();
    const resigSub = supabase.channel('sidebar-pending-resig')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resignation_requests' }, fetchPendingCounts)
      .subscribe();
    const retSub = supabase.channel('sidebar-pending-ret')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'retirement_requests' }, fetchPendingCounts)
      .subscribe();

    return () => {
      window.removeEventListener('pending_counts_changed', handleCountsChanged);
      activitySub.unsubscribe();
      updatesSub.unsubscribe();
      regsSub.unsubscribe();
      leavesSub.unsubscribe();
      commSub.unsubscribe();
      resigSub.unsubscribe();
      retSub.unsubscribe();
    };
  }, []);

  const totalPendingApprovals = Object.values(pendingCounts).reduce((a, b) => a + b, 0);

  const handleMarkAllRead = async () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const { error } = await supabase
        .from('admin_activity_log')
        .update({ is_read: true })
        .eq('is_read', false);
      if (error) console.error("Error marking activity log read:", error);
    } catch (err) {
      console.error("Failed to update notification read status", err);
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
        className="absolute -right-3 top-[28px] bg-white text-[#0C005F] border border-slate-200 rounded-md p-0.5 shadow-none hover:bg-slate-50 z-50 transition-all"
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

      <nav className="flex-1 py-3 px-2 space-y-1 mt-2 overflow-y-auto no-scrollbar">
        {filteredNavItems.map((item) => {
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
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {label === "Pending Approvals" && totalPendingApprovals > 0 && (
                      <span className="bg-amber-400 text-[#0C005F] font-black text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                        {totalPendingApprovals}
                      </span>
                    )}
                    {isExpanded ? <ChevronLeft className="w-3.5 h-3.5 -rotate-90 transition-transform" /> : <ChevronLeft className="w-3.5 h-3.5 transition-transform" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="ml-4 pl-3 border-l border-white/10 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {children.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      const ChildIcon = child.icon;
                      const childCount = pendingCounts[child.path] || 0;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                            isChildActive
                              ? "bg-white/20 text-white shadow-none font-bold"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{child.label}</span>
                          {childCount > 0 && (
                            <span className="ml-auto bg-amber-400 text-[#0C005F] font-black text-[10px] px-1.5 py-0.5 rounded-full shrink-0 leading-none">
                              {childCount}
                            </span>
                          )}
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
                  ? "bg-white/20 text-white shadow-none font-bold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              title={collapsed ? label : ""}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && path === "/approvals" && totalPendingApprovals > 0 && (
                <span className="ml-auto bg-amber-400 text-[#0C005F] font-black text-[10px] px-1.5 py-0.5 rounded-full shrink-0 leading-none">
                  {totalPendingApprovals}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 mt-auto space-y-1">
        {/* Notifications Button & Popover (Moved above Sign out) */}
        <Popover onOpenChange={(open) => open && handleMarkAllRead()}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                unreadCount > 0 ? "text-white bg-white/10 font-bold" : "text-white/70 hover:text-white hover:bg-white/10",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? "Notifications" : ""}
            >
              <div className="relative">
                <Bell className="w-4.5 h-4.5 shrink-0" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-2xs font-bold text-white border border-[#0C005F] animate-in zoom-in duration-300">
                    {unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && <span className="truncate">Notifications</span>}
              {!collapsed && unreadCount > 0 && (
                <span className="ml-auto bg-amber-400 text-[#0C005F] font-black text-[10px] px-1.5 py-0.5 rounded-full shrink-0 leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[800px] max-w-[90vw] p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl ml-2 bg-white animate-in slide-in-from-left-2 duration-300 z-50"
            side="right"
            align="end"
            sideOffset={12}
          >
            <div className="bg-[#0C005F] p-4 px-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Bell className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="bg-amber-400 text-[#0C005F] font-black text-2xs px-2 py-0.5 rounded-full">
                        {unreadCount} UNREAD
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-blue-200/70">{notifications.length} recent activity items</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors uppercase tracking-wider"
                  >
                    Mark all as read
                  </button>
                )}
                <Link
                  to="/activity"
                  className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  View All Activity
                </Link>
              </div>
            </div>

            <ScrollArea className="h-[480px]">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => {
                    const colorClass = ACTION_TITLE_COLORS[n.type] || 'text-slate-700 bg-slate-50 border-slate-200';
                    return (
                      <div
                        key={n.id}
                        onClick={n.action}
                        className={cn(
                          "p-4 px-6 hover:bg-slate-50/80 transition-all cursor-pointer flex items-start gap-4 group",
                          !n.isRead && "bg-blue-50/30"
                        )}
                      >
                        <div className="relative shrink-0 mt-0.5">
                          {n.photoUrl ? (
                            <img
                              src={n.photoUrl}
                              alt={n.displayName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#0C005F] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                              {n.initials}
                            </div>
                          )}
                          {!n.isRead && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border", colorClass)}>
                                {n.title}
                              </span>
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {n.displayName}
                              </span>
                            </div>
                            <span className="text-2xs font-semibold text-slate-400 shrink-0">
                              {formatDistanceToNow(n.time, { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between text-2xs text-slate-400 mt-2">
                            <span>{format(n.time, "MMM d, yyyy • h:mm a")}</span>
                            <span className="text-[#0C005F] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              View Details &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Bell className="w-12 h-12 mb-3 opacity-20 text-[#0C005F]" />
                  <p className="text-sm font-bold text-slate-700">No notifications</p>
                  <p className="text-xs text-slate-400 mt-1">System activity and requests will appear here.</p>
                </div>
              )}
            </ScrollArea>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <Link
                to="/activity"
                className="block w-full text-center text-xs font-bold text-[#0C005F] hover:bg-slate-200/60 uppercase tracking-widest py-2 rounded-lg transition-all"
              >
                View Full Activity Log & Bin &rarr;
              </Link>
            </div>
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