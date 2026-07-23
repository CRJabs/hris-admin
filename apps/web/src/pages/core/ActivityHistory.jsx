import { useState, useEffect } from "react";
import { History, CheckCheck, Trash2, Clock, AlertCircle, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import ActivityTabs from "@/components/layout/ActivityTabs";
import { cn } from "@/lib/utils";
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
  employee_submitted_update: "text-[#0C005F] bg-[#0C005F]/5 border-[#0C005F]/10",
  employee_submitted_registration: "text-[#0C005F] bg-[#0C005F]/5 border-[#0C005F]/10",
  admin_approved_update: "text-blue-700 bg-blue-50/80 border-blue-200",
  admin_rejected_update: "text-blue-800 bg-blue-100/40 border-blue-200",
  admin_approved_registration: "text-blue-700 bg-blue-50/80 border-blue-200",
  admin_rejected_registration: "text-blue-800 bg-blue-100/40 border-blue-200",
  admin_edited_employee: "text-[#0C005F] bg-[#0C005F]/10 border-[#0C005F]/20",
  admin_added_employee: "text-blue-700 bg-blue-50/80 border-blue-200",
  admin_assigned_leave_credits: "text-[#0C005F] bg-[#0C005F]/10 border-[#0C005F]/20",
  admin_toggled_employee_status: "text-[#0C005F] bg-blue-50/50 border-blue-100",
  admin_approved_leave: "text-blue-700 bg-blue-50/80 border-blue-200",
  admin_rejected_leave: "text-blue-800 bg-blue-100/40 border-blue-200",
  benefit_eligible_employee: "text-[#0C005F] bg-[#0C005F]/10 border-[#0C005F]/20",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [removeAllOpen, setRemoveAllOpen] = useState(false);
  const [binCount, setBinCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_activity_log")
        .select("*, employees(photo_url, first_name, last_name)")
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

  const filteredNotifications = notifications.filter((notif) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const desc = (notif.description || "").toLowerCase();
    const actor = (notif.actor_name || "").toLowerCase();
    const action = (notif.action || "").toLowerCase();
    const title = (ACTION_TITLES[notif.action] || "").toLowerCase();
    return desc.includes(q) || actor.includes(q) || action.includes(q) || title.includes(q);
  });

  return (
    <div className="p-4 w-full h-full flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Top Island Card for Tabs & Quick Actions */}
      <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-2.5 px-4 shrink-0 flex items-center justify-between gap-4 flex-wrap">
        <ActivityTabs
          active="activity"
          binCount={binCount}
          activityCount={notifications.length}
          unreadCount={unreadCount}
        />

        {/* Search Field */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search activity logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-[#0C005F]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold rounded-lg shadow-none gap-1.5 border-slate-200 hover:bg-[#0C005F] hover:text-white transition-all"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark All as Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold rounded-lg shadow-none gap-1.5 border-red-200 text-red-600 hover:bg-red-50 transition-all"
            onClick={() => setRemoveAllOpen(true)}
            disabled={notifications.length === 0}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove All
          </Button>
        </div>
      </Card>

      {/* Notifications List */}
      {isLoading ? (
        <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-16 text-center text-slate-400">
          <History className="w-10 h-10 mx-auto mb-3 opacity-20 animate-pulse text-[#0C005F]" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading notifications...</p>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-16 text-center flex flex-col items-center justify-center space-y-2">
          <History className="w-12 h-12 text-slate-300 stroke-[1.5]" />
          <p className="font-black text-sm uppercase tracking-wider text-slate-800">No notifications found</p>
          <p className="text-xs text-slate-500 font-medium">Try adjusting your search query.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredNotifications.map((notif) => {
            const colorClass =
              ACTION_TITLE_COLORS[notif.action] ||
              "text-slate-600 bg-slate-50 border-slate-200";
            const title = ACTION_TITLES[notif.action] || notif.action;
            const navTarget = ACTION_NAV[notif.action];

            const isAdmin = notif.actor_type === 'admin' || notif.actor_name?.toLowerCase().includes('admin') || notif.actor_name?.includes('@');
            const displayName = isAdmin ? 'Administrator' : (notif.actor_name || 'System');
            const empPhoto = Array.isArray(notif.employees) ? notif.employees[0]?.photo_url : notif.employees?.photo_url;
            const photoUrl = isAdmin ? '/assets/ub.png' : (empPhoto || null);
            const initials = displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={notif.id}
                onClick={() => navTarget && navigate(navTarget)}
                className={`relative rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 flex items-center justify-between gap-4 ${
                  navTarget ? "cursor-pointer" : ""
                } ${!notif.is_read ? "border-l-4 border-l-[#0C005F]" : ""}`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Profile Avatar */}
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={displayName}
                      className={cn(
                        "w-10 h-10 rounded-full object-cover shrink-0",
                        isAdmin ? "border border-[#0C005F]/20 bg-white p-0.5" : "border border-slate-100"
                      )}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      {initials}
                    </div>
                  )}

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-2xs font-bold uppercase tracking-wider border px-2 py-0.5 ${colorClass}`}
                      >
                        {title}
                      </Badge>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {displayName}
                      </span>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                      {notif.description}
                    </p>
                    <p className="text-2xs text-slate-400 font-medium mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-slate-400 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {format(new Date(notif.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Remove All Confirm Dialog */}
      <AlertDialog open={removeAllOpen} onOpenChange={setRemoveAllOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 text-base font-bold">
              <AlertCircle className="w-5 h-5" />
              Remove All Notifications
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600">
              This will permanently delete all{" "}
              <strong>{notifications.length}</strong> notification records from
              the activity log. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-8 text-xs font-bold rounded-lg border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAll}
              className="h-8 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white"
            >
              Remove All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
