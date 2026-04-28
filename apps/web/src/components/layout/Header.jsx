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

export default function Header({ onSearch, title, subtitle, icon: Icon }) {
  const [searchValue, setSearchValue] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const hasBootstrappedNotifications = useRef(false);
  const seenNotificationIds = useRef(new Set());
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data: updateData, error: updateError } = await supabase
        .from('employee_update_requests')
        .select(`*, employees ( first_name, last_name )`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const { data: regData, error: regError } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'Pending');

      let notifs = [];
      if (!updateError && updateData) {
        notifs = [...notifs, ...updateData.map(req => ({
          id: `req_${req.id}`,
          title: "Profile Update Request",
          message: `${req.employees?.first_name} ${req.employees?.last_name} requested to update their profile information.`,
          type: "warning",
          time: new Date(req.created_at || new Date()),
          action: () => navigate('/approvals', { state: { requestId: req.id, type: 'update' } })
        }))];
      }

      if (!regError && regData) {
        notifs = [...notifs, ...regData.map(emp => ({
          id: `reg_${emp.id}`,
          title: "New Registration",
          message: `${emp.first_name} ${emp.last_name} submitted a registration`,
          type: "info",
          time: new Date(emp.created_at || new Date()),
          action: () => navigate('/approvals')
        }))];
      }

      notifs.sort((a, b) => b.time - a.time);

      const currentIds = notifs.map((notif) => notif.id);
      if (hasBootstrappedNotifications.current) {
        const newNotifications = notifs.filter(
          (notif) => !seenNotificationIds.current.has(notif.id)
        );

        newNotifications.forEach((notif) => {
          popupToast({
            title: notif.title,
            description: notif.message,
            duration: 10000,
          });
        });
      } else {
        hasBootstrappedNotifications.current = true;
      }

      seenNotificationIds.current = new Set(currentIds);

      // If we have more notifications than before, mark as unread
      setNotifications(prev => {
        if (notifs.length > prev.length) {
          setHasUnread(true);
        }
        return notifs;
      });

    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const reqSub = supabase.channel('requests_changes_header')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_update_requests' }, fetchNotifications)
      .subscribe();

    const empSub = supabase.channel('employees_changes_header')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchNotifications)
      .subscribe();

    // Fallback refresh for reliability across long-lived admin sessions.
    const intervalId = setInterval(fetchNotifications, 10000);
    const handleWindowFocus = () => fetchNotifications();
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleWindowFocus);

    return () => {
      reqSub.unsubscribe();
      empSub.unsubscribe();
      clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleWindowFocus);
    };
  }, []);

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
        <Popover onOpenChange={(open) => { if (open) setHasUnread(false); }}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && hasUnread && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card animate-in zoom-in duration-300">
                  {notifications.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0 border-border shadow-xl" align="end">
            <div className="p-4 border-b border-border bg-card">
              <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{notifications.length} pending items</p>
            </div>
            <div className="max-h-80 overflow-y-auto bg-card">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No pending notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} onClick={n.action} className="px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer text-foreground">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === "warning" ? "bg-amber-500" : n.type === "info" ? "bg-blue-500" : "bg-primary"
                        }`} />
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