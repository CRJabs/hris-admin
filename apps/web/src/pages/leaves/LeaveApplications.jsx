import { useState, useEffect } from "react";
import { Check, X, CalendarDays, Search, Filter, Clock, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LeaveApplicationViewModal from "@/components/employees/LeaveApplicationViewModal";
import { useOutletContext } from "react-router-dom";
import ApprovalsTabs from "@/components/approvals/ApprovalsTabs";

export default function LeaveApplications() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [orgUnits, setOrgUnits] = useState([]);
  const { counts, searchQuery, statusFilter } = useOutletContext();

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("leave_applications")
        .select(`*, employees ( id, first_name, last_name, employee_id, department, position, photo_url, org_unit_id )`)
        .neq("status", "pending_dept_head")
        .order("created_at", { ascending: false });

      if (!error) setApplications(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    const fetchOrgUnits = async () => {
      const { data } = await supabase.from("org_units").select("id, name, parent_id");
      if (data) setOrgUnits(data);
    };
    fetchOrgUnits();

    const sub = supabase
      .channel("leave_applications_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_applications" },
        () => fetchApplications()
      )
      .subscribe();

    return () => sub.unsubscribe();
  }, []);

  const isInstitutionalUnit = (unitId) => {
    if (!unitId || !orgUnits.length) return false;
    let current = orgUnits.find(u => u.id === unitId);
    while (current) {
      if (current.name?.toLowerCase().includes("departments")) {
        return true;
      }
      if (current.parent_id) {
        current = orgUnits.find(u => u.id === current.parent_id);
      } else {
        break;
      }
    }
    return false;
  };

  const handleViewApplication = (app) => {
    setSelectedApp(app);
    setModalOpen(true);
  };

  const handleQuickAction = async (app, action) => {
    try {
      const updatePayload = {
        status: action,
        reviewed_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("leave_applications")
        .update(updatePayload)
        .eq("id", app.id);

      if (updateError) throw updateError;

      // If approved, deduct 1 credit and log transaction
      if (action === "approved" && app.leave_credit_id) {
        const { data: creditData, error: creditFetchError } = await supabase
          .from("leave_credits")
          .select("used_credits")
          .eq("id", app.leave_credit_id)
          .single();

        if (creditFetchError) throw creditFetchError;

        const newUsed = parseFloat(creditData.used_credits) + 1;

        const { error: creditError } = await supabase
          .from("leave_credits")
          .update({
            used_credits: newUsed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", app.leave_credit_id);

        if (creditError) throw creditError;

        // Audit trail
        await supabase.from("leave_transactions").insert({
          employee_id: app.employee_id,
          leave_credit_id: app.leave_credit_id,
          amount: 1,
          description: `Approved ${app.leave_type} Leave (${app.start_date} to ${app.end_date})`,
        });
      }

      // Notify employee
      const empName = `${app.employees?.first_name} ${app.employees?.last_name}`;
      await supabase.from("notifications").insert({
        employee_id: app.employee_id,
        type: action === "approved" ? "approved" : "rejected",
        title: `Leave ${action === "approved" ? "Approved" : "Rejected"}`,
        message:
          action === "approved"
            ? `Your ${app.leave_type} Leave from ${app.start_date} to ${app.end_date} has been approved.`
            : `Your ${app.leave_type} Leave request was rejected.`,
      });

      // Log to admin activity
      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: "Administrator",
        action:
          action === "approved"
            ? "admin_approved_leave"
            : "admin_rejected_leave",
        description: `${action === "approved" ? "Approved" : "Rejected"} ${app.leave_type} Leave for ${empName} (${app.start_date} to ${app.end_date})`,
        employee_id: app.employee_id,
        metadata: { leave_application_id: app.id },
      });

      toast.success(`Leave application ${action} successfully.`);
      fetchApplications();
    } catch (err) {
      toast.error(`Failed to ${action} leave: ${err.message}`);
    }
  };

  const handleDelete = async (app) => {
    try {
      const empName = `${app.employees?.first_name || ''} ${app.employees?.last_name || ''}`;
      const label = `${empName.trim() || 'Unknown Employee'} - Leave Application`;

      // 1. Snapshot leave application to bin
      const { error: binError } = await supabase
        .from('bin')
        .insert({
          record_type: 'leave_application',
          record_id: app.id,
          record_data: app,
          label: label
        });

      if (binError) throw binError;

      // 2. Delete leave application from source table
      const { error: deleteError } = await supabase
        .from('leave_applications')
        .delete()
        .eq('id', app.id);

      if (deleteError) throw deleteError;

      // 3. Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: 'admin_rejected_leave', // fallback action
        description: `Moved Leave Application for ${empName} to Bin`,
        employee_id: app.employee_id
      });

      toast.success("Leave application moved to Bin.");
      fetchApplications();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to delete leave application: ${err.message}`);
    }
  };

  // Filter and search
  const filteredApplications = applications.filter((app) => {
    const matchesStatus =
      statusFilter === "all" || app.status === statusFilter;
    const fullName =
      `${app.employees?.first_name || ""} ${app.employees?.last_name || ""}`.toLowerCase();
    const empId = (app.employees?.employee_id || "").toLowerCase();
    const dept = (app.employees?.department || "").toLowerCase();
    const leaveType = (app.leave_type || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      fullName.includes(query) ||
      empId.includes(query) ||
      dept.includes(query) ||
      leaveType.includes(query);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-4 w-full">
      {/* Search & Filter Bar is now rendered at layout level */}

      {isLoading ? (
        <div className="text-center p-8 text-slate-400 text-xs font-semibold">
          Loading leave applications...
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none bg-slate-50/50 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <CalendarDays className="w-12 h-12 mb-3 opacity-20 text-[#0C005F]" />
            <p className="font-bold text-base text-slate-600">
              {applications.length === 0
                ? "No leave applications found"
                : "No matching applications"}
            </p>
            <p className="text-xs">
              {applications.length === 0
                ? "No employees have filed for leave yet."
                : "Try adjusting your search or filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredApplications.map((app) => (
            <Card
              key={app.id}
              className="overflow-hidden cursor-pointer hover:border-[#0C005F] transition-all shadow-none rounded-xl border border-slate-200 bg-white group"
              onClick={() => handleViewApplication(app)}
            >
              <CardHeader className="bg-slate-50/50 group-hover:bg-blue-50/20 transition-colors pb-3 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                    {app.employees?.photo_url ? (
                      <img src={app.employees.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-600">
                        {app.employees?.first_name?.[0]}{app.employees?.last_name?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2 flex-wrap">
                      {app.employees?.first_name} {app.employees?.last_name}
                      {app.status === "pending" && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 text-2xs font-bold uppercase tracking-wider"
                        >
                          Pending
                        </Badge>
                      )}
                      {app.status === "approved" && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-2xs font-bold uppercase tracking-wider"
                        >
                          Approved
                        </Badge>
                      )}
                      {app.status === "rejected" && (
                        <Badge
                          variant="outline"
                          className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 text-2xs font-bold uppercase tracking-wider"
                        >
                          Rejected
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-xs text-slate-500 font-medium">
                      {app.employees?.employee_id} • {app.employees?.department}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Filed on {format(new Date(app.created_at || new Date()), "MMM d, yyyy h:mm a")}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3.5">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-xs font-semibold text-slate-700">
                        Leave Application: <span className="text-[#0C005F] font-bold">{app.leave_type} Leave ({app.is_commutable ? "Commutable" : "Non-Commutable"})</span>
                      </p>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        {format(new Date(app.start_date + "T00:00:00"), "MMM d, yyyy")} → {format(new Date(app.end_date + "T00:00:00"), "MMM d, yyyy")}
                      </span>
                      {app.approved_by_dept_head === true && isInstitutionalUnit(app.employees?.org_unit_id) && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 text-2xs font-bold"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Approved by Department Head
                        </Badge>
                      )}
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                      <p className="text-2xs font-bold text-[#0C005F] uppercase tracking-wider mb-1">
                        PURPOSE
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {app.purpose || "No specific purpose provided."}
                      </p>
                    </div>
                  </div>
                  {app.status === "pending" ? (
                    <div
                      className="flex flex-row md:flex-col gap-2 shrink-0 justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        onClick={() => handleQuickAction(app, "approved")}
                        className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-none"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAction(app, "rejected")}
                        className="h-8 text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 rounded-lg font-bold shadow-none"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(app)}
                        className="h-8 text-xs gap-1.5 text-rose-600 border-rose-200 hover:text-white hover:bg-rose-600 rounded-lg font-bold shadow-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-row md:flex-col gap-2 shrink-0 justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(app)}
                        className="h-8 text-xs gap-1.5 text-rose-600 border-rose-200 hover:text-white hover:bg-rose-600 rounded-lg font-bold shadow-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LeaveApplicationViewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        application={selectedApp}
        onActionComplete={fetchApplications}
      />
    </div>
  );
}
