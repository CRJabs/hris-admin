import { useState, useEffect } from "react";
import { Check, X, CalendarDays, Clock, Info, User, CheckSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PendingApprovalsTab({ employee, ledUnitIds = [] }) {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = async () => {
    if (!ledUnitIds || ledUnitIds.length === 0) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("leave_applications")
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name,
            employee_id,
            department,
            position,
            photo_url,
            org_unit_id
          )
        `)
        .eq("status", "pending_dept_head")
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("PendingApprovalsTab - Current ledUnitIds:", ledUnitIds);
      console.log("PendingApprovalsTab - Raw fetched leave applications:", data);

      if (data) {
        // Filter applications in memory to match the departments led by this head
        const filtered = data.filter((app) => {
          const isMatch = app.employees && ledUnitIds.includes(app.employees.org_unit_id);
          console.log(`App ID: ${app.id} | Employee: ${app.employees ? `${app.employees.first_name} ${app.employees.last_name}` : "NULL"} | Org Unit ID: ${app.employees?.org_unit_id} | Is Match: ${isMatch}`);
          return isMatch;
        });
        console.log("PendingApprovalsTab - Filtered leave applications:", filtered);
        setApplications(filtered);
      }
    } catch (err) {
      console.error("Error fetching pending department leaves:", err);
      toast.error("Failed to load pending leave applications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    // Subscribe to realtime changes in leave_applications
    const sub = supabase
      .channel("leave_apps_dept_head")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_applications" },
        () => fetchApplications()
      )
      .subscribe();

    return () => sub.unsubscribe();
  }, [JSON.stringify(ledUnitIds)]);

  const handleAction = async (app, action) => {
    try {
      const updatePayload = {
        status: action === "approve" ? "pending" : "rejected",
        approved_by_dept_head: action === "approve" ? true : false,
        reviewed_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("leave_applications")
        .update(updatePayload)
        .eq("id", app.id);

      if (updateError) throw updateError;

      const empName = `${app.employees?.first_name} ${app.employees?.last_name}`;
      const headName = `${employee.first_name} ${employee.last_name}`;

      // Notify the applicant
      await supabase.from("notifications").insert({
        employee_id: app.employee_id,
        type: action === "approve" ? "info" : "rejected",
        title: action === "approve" ? "Leave Approved by Department Head" : "Leave Rejected by Department Head",
        message:
          action === "approve"
            ? `Your ${app.leave_type} Leave from ${app.start_date} to ${app.end_date} has been approved by your Department Head (${headName}) and forwarded to HR for final approval.`
            : `Your ${app.leave_type} Leave request was rejected by your Department Head (${headName}).`,
      });

      // Log to admin activity
      await supabase.from("admin_activity_log").insert({
        actor_type: "employee", // changed to satisfy check constraint
        actor_name: headName,
        action:
          action === "approve"
            ? "dept_head_approved_leave"
            : "dept_head_rejected_leave",
        description: `${action === "approve" ? "Approved" : "Rejected"} ${app.leave_type} Leave for ${empName} (${app.start_date} to ${app.end_date}) by Department Head`,
        employee_id: app.employee_id,
        metadata: { leave_application_id: app.id },
      });

      toast.success(
        action === "approve"
          ? "Leave application approved and forwarded to HR."
          : "Leave application rejected."
      );
      fetchApplications();
    } catch (err) {
      console.error("Action error:", err);
      toast.error(`Failed to ${action} leave application: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C005F] mb-4" />
        <p className="text-sm font-medium">Loading pending leave applications...</p>
      </div>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-[#0C005F] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              Department Leave Approvals
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Review and approve leave applications for employees in your department before final HR processing.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-[#0C005F]/10 text-[#0C005F] font-bold px-3 py-1 text-xs self-start sm:self-center">
            {applications.length} Pending Request{applications.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <CheckSquare className="w-12 h-12 mb-3 opacity-25 text-emerald-500" />
            <p className="font-bold text-base text-slate-700">All caught up!</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              There are currently no leave requests from your department waiting for your approval.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card
                key={app.id}
                className="overflow-hidden border-slate-200/80 hover:border-slate-300 transition-all hover:shadow-md group bg-white"
              >
                <div className="bg-slate-50/40 group-hover:bg-slate-50/70 transition-colors pb-3 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    {/* Employee Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0 shadow-inner">
                      {app.employees?.photo_url ? (
                        <img
                          src={app.employees.photo_url}
                          alt={`${app.employees?.first_name} ${app.employees?.last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-600">
                          {app.employees?.first_name?.[0]}
                          {app.employees?.last_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                        {app.employees?.first_name} {app.employees?.last_name}
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] py-0.5 px-2 font-bold animate-pulse">
                          Pending Dept Approval
                        </Badge>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        ID: {app.employees?.employee_id} • {app.employees?.department} • {app.employees?.position}
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 shrink-0 sm:self-center font-medium bg-slate-100/80 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    Filed {format(new Date(app.created_at), "MMM d, yyyy h:mm a")}
                  </div>
                </div>

                <div className="p-4 bg-white">
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold ${
                            app.is_commutable
                              ? "bg-amber-50 text-amber-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {app.leave_type} Leave ({app.is_commutable ? "Commutable" : "Non-Commurable"})
                        </Badge>
                        <span className="text-xs text-slate-600 font-bold flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-md">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          {format(new Date(app.start_date + "T00:00:00"), "MMM d, yyyy")} →{" "}
                          {format(new Date(app.end_date + "T00:00:00"), "MMM d, yyyy")}
                        </span>
                      </div>
                      
                      <div className="p-3 border border-slate-100 rounded-lg bg-slate-50/30">
                        <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                          Reason for Leave
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {app.purpose}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <Button
                        size="sm"
                        onClick={() => handleAction(app, "approve")}
                        className="flex-1 md:flex-none gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md shadow-emerald-600/10 text-white"
                      >
                        <Check className="w-4 h-4" /> Approve & Forward
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(app, "reject")}
                        className="flex-1 md:flex-none gap-1.5 text-rose-600 border-rose-200 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 font-bold"
                      >
                        <X className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
