import { useState, useEffect, useRef } from "react";
import { Search, Bell, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { toast as popupToast } from "@/components/ui/use-toast";

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

// Map action types to dot colors
const ACTION_COLORS = {
  employee_submitted_update: "bg-amber-500",
  employee_submitted_registration: "bg-blue-500",
  admin_approved_update: "bg-emerald-500",
  admin_rejected_update: "bg-red-500",
  admin_approved_registration: "bg-emerald-500",
  admin_rejected_registration: "bg-red-500",
  admin_edited_employee: "bg-purple-500",
  admin_added_employee: "bg-blue-500",
  admin_assigned_leave_credits: "bg-purple-500",
  admin_toggled_employee_status: "bg-slate-500",
};

// Map action types to title text colors (for the notification pane)
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

export default function Header({ onSearch, title, subtitle, icon: Icon }) {
  const [searchValue, setSearchValue] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasBootstrappedNotifications = useRef(false);
  const seenNotificationIds = useRef(new Set());
  const navigate = useNavigate();

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

      // Show toast for truly new entries (not on first load)
      if (hasBootstrappedNotifications.current) {
        const newNotifs = notifs.filter(n => !seenNotificationIds.current.has(n.id));
        newNotifs.forEach(notif => {
          popupToast({
            title: notif.title,
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

    const activitySub = supabase.channel('header_activity_log')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_activity_log' }, fetchNotifications)
      .subscribe();

    return () => {
      activitySub.unsubscribe();
    };
  }, []);

  const handlePopoverOpen = async (open) => {
    if (open && unreadCount > 0) {
      // Mark all as read
      setUnreadCount(0);
      await supabase
        .from('admin_activity_log')
        .update({ is_read: true })
        .eq('is_read', false);
    }
  };

  const handleSearch = (e) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="h-20 bg-card text-foreground border-b border-border flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-6 h-6 text-[#0C005F]" />}
        <div>
          {title && <h1 className="text-xl font-bold text-[#0C005F]">{title}</h1>}
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Popover onOpenChange={handlePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white animate-in zoom-in duration-300">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0 overflow-hidden rounded-xl border-slate-200 shadow-2xl" align="end">
            <div className="bg-[#0C005F] p-4 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4" /> Admin Notifications
              </h3>
              <p className="text-xs text-blue-200/60 mt-0.5">{notifications.length} recent items</p>
            </div>
            <ScrollArea className="h-[350px]">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => {
                    const colorClass = ACTION_TITLE_COLORS[n.type] || 'text-primary';
                    return (
                      <div key={n.id} onClick={n.action} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
                            {n.title}
                          </p>
                          <span className="text-[9px] text-muted-foreground shrink-0 ml-2">
                            {format(n.time, "MMM d")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-snug">{n.message}</p>
                        <p className="text-[9px] text-slate-400 mt-1.5">
                          {formatDistanceToNow(n.time, { addSuffix: true })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-medium">All caught up!</p>
                  <p className="text-[10px] text-slate-400 mt-1">No recent notifications</p>
                </div>
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <div className="p-2 border-t bg-slate-50 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 text-[#0C005F] hover:text-[#0C005F] font-bold"
                  onClick={async () => {
                    await supabase
                      .from('admin_activity_log')
                      .update({ is_read: true })
                      .eq('is_read', false);
                    setUnreadCount(0);
                  }}
                >
                  Mark all as read
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}

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