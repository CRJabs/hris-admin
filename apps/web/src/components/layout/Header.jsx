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
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
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
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card animate-in zoom-in duration-300">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0 border-border shadow-xl" align="end">
            <div className="p-4 border-b border-border bg-card">
              <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{notifications.length} recent items</p>
            </div>
            <div className="max-h-80 overflow-y-auto bg-card">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} onClick={n.action} className="px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer text-foreground">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ACTION_COLORS[n.type] || "bg-primary"}`} />
                      <div>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(n.time, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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