import { useState, useEffect } from "react";
import { History, CheckCheck, Trash2, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import ActivityTabs from "@/components/activity/ActivityTabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ACTION_TITLE_COLORS = {
  employee_submitted_update: "text-amber-600 bg-amber-50 border-amber-200",
  employee_submitted_registration: "text-blue-600 bg-blue-50 border-blue-200",
  admin_approved_update: "text-green-600 bg-green-50 border-green-200",
  admin_rejected_update: "text-red-600 bg-red-50 border-red-200",
  admin_approved_registration: "text-green-600 bg-green-50 border-green-200",
  admin_rejected_registration: "text-red-600 bg-red-50 border-red-200",
  admin_edited_employee: "text-purple-600 bg-purple-50 border-purple-200",
  admin_added_employee: "text-blue-600 bg-blue-50 border-blue-200",
  admin_assigned_leave_credits: "text-purple-600 bg-purple-50 border-purple-200",
  admin_toggled_employee_status: "text-slate-600 bg-slate-50 border-slate-200",
  admin_approved_leave: "text-green-600 bg-green-50 border-green-200",
  admin_rejected_leave: "text-red-600 bg-red-50 border-red-200",
  benefit_eligible_employee: "text-pink-600 bg-pink-50 border-pink-200",
};

const ACTION_TITLES = {
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
  admin_approved_leave: "Leave Approved",
  admin_rejected_leave: "Leave Rejected",
  benefit_eligible_employee: "Benefit Eligible Employee",
};

const ACTION_NAV = {
  employee_submitted_update: "/approvals/updates",
  employee_submitted_registration: "/approvals/registrations",
  admin_approved_update: "/approvals/updates",
  admin_rejected_update: "/approvals/updates",
  admin_approved_registration: "/approvals/registrations",
  admin_rejected_registration: "/approvals/registrations",
  admin_edited_employee: "/employees",
  admin_added_employee: "/employees",
  admin_assigned_leave_credits: "/leaves/assign",
  admin_toggled_employee_status: "/employees",
  admin_approved_leave: "/approvals/leaves",
  admin_rejected_leave: "/approvals/leaves",
};

export default function ActivityHistory() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removeAllOpen, setRemoveAllOpen] = useState(false);
  const [binCount, setBinCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_activity_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBinCount = async () => {
    try {
      const { count, error } = await supabase
        .from("bin")
        .select("*", { count: "exact", head: true });
      if (!error) {
        setBinCount(count || 0);
      }
    } catch (err) {
      console.error("Error fetching bin count:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchBinCount();

    const notifSub = supabase
      .channel("activity_history_log")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_activity_log" },
        fetchNotifications
      )
      .subscribe();

    const binSub = supabase
      .channel("activity_history_bin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bin" },
        fetchBinCount
      )
      .subscribe();

    return () => {
      notifSub.unsubscribe();
      binSub.unsubscribe();
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const { error } = await supabase
        .from("admin_activity_log")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) throw error;
      toast.success("All notifications marked as read.");
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to mark as read.");
    }
  };

  const handleRemoveAll = async () => {
    try {
      const { error } = await supabase
        .from("admin_activity_log")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows

      if (error) throw error;
      toast.success("All notifications removed.");
      setNotifications([]);
    } catch (err) {
      toast.error("Failed to remove notifications.");
    }
    setRemoveAllOpen(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-4 md:p-6 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0C005F] flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Activity History</h1>
            <p className="text-sm text-muted-foreground">
              {notifications.length} total &bull;{" "}
              <span className="text-red-500 font-semibold">{unreadCount} unread</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#0C005F]/20 text-[#0C005F] hover:bg-[#0C005F] hover:text-white transition-all"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all"
            onClick={() => setRemoveAllOpen(true)}
            disabled={notifications.length === 0}
          >
            <Trash2 className="w-4 h-4" />
            Remove All
          </Button>
        </div>
      </div>

      {/* Shared Navigation Tab Bar */}
      <ActivityTabs active="activity" binCount={binCount} />

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          <History className="w-10 h-10 mx-auto mb-3 opacity-20 animate-pulse" />
          <p className="text-sm font-medium">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <History className="w-14 h-14 mb-4 opacity-15" />
          <p className="font-semibold text-lg text-slate-700">No notifications yet</p>
          <p className="text-sm mt-1">Activity log is empty. Actions will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {notifications.map((notif) => {
            const colorClass =
              ACTION_TITLE_COLORS[notif.action] ||
              "text-slate-600 bg-slate-50 border-slate-200";
            const title = ACTION_TITLES[notif.action] || notif.action;
            const navTarget = ACTION_NAV[notif.action];

            return (
              <div
                key={notif.id}
                onClick={() => navTarget && navigate(navTarget)}
                className={`relative rounded-xl border bg-white p-5 transition-all hover:shadow-md hover:border-slate-200 group ${
                  navTarget ? "cursor-pointer" : ""
                } ${!notif.is_read ? "border-l-4 border-l-[#0C005F]" : ""}`}
              >
                {/* Unread dot */}
                {!notif.is_read && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500" />
                )}

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}
                        >
                          {title}
                        </Badge>
                        <span className="text-[11px] font-semibold text-slate-700">
                          {notif.actor_name || "System"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mt-1">
                        {notif.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {format(new Date(notif.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  {formatDistanceToNow(new Date(notif.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Remove All Confirm Dialog */}
      <AlertDialog open={removeAllOpen} onOpenChange={setRemoveAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Remove All Notifications
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all{" "}
              <strong>{notifications.length}</strong> notification records from
              the activity log. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAll}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
