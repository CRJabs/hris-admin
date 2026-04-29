import { useState, useEffect } from "react";
import { Check, X, CalendarDays, Search, Filter, Clock, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LeaveApplicationViewModal from "@/components/employees/LeaveApplicationViewModal";

export default function LeaveApplications() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("leave_applications")
        .select(`*, employees ( id, first_name, last_name, employee_id, department, position, photo_url )`)
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
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, ID, department, or leave type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white border-slate-200 focus-visible:ring-[#0C005F]/20"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white border-slate-200">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <SelectValue placeholder="Filter by status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Statuses ({statusCounts.all})
            </SelectItem>
            <SelectItem value="pending">
              Pending ({statusCounts.pending})
            </SelectItem>
            <SelectItem value="approved">
              Approved ({statusCounts.approved})
            </SelectItem>
            <SelectItem value="rejected">
              Rejected ({statusCounts.rejected})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">
          Loading leave applications...
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <CalendarDays className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium text-lg">
              {applications.length === 0
                ? "No leave applications found"
                : "No matching applications"}
            </p>
            <p className="text-sm">
              {applications.length === 0
                ? "No employees have filed for leave yet."
                : "Try adjusting your search or filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((app) => (
            <Card
              key={app.id}
              className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
              onClick={() => handleViewApplication(app)}
            >
              <CardHeader className="bg-muted/30 group-hover:bg-primary/5 transition-colors pb-3 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Employee Photo */}
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                    {app.employees?.photo_url ? (
                      <img
                        src={app.employees.photo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">
                        {app.employees?.first_name?.[0]}
                        {app.employees?.last_name?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      {app.employees?.first_name} {app.employees?.last_name}
                      {app.status === "pending" && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                        >
                          Pending
                        </Badge>
                      )}
                      {app.status === "approved" && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Approved
                        </Badge>
                      )}
                      {app.status === "rejected" && (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200"
                        >
                          Rejected
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {app.employees?.employee_id} •{" "}
                      {app.employees?.department}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  Filed on{" "}
                  {format(
                    new Date(app.created_at),
                    "MMM d, yyyy h:mm a"
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-4">
                <div className="flex flex-col md:flex-row gap-6">
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
                        {app.leave_type} Leave (
                        {app.is_commutable ? "Comm." : "Non-Comm."})
                      </Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(app.start_date + "T00:00:00"), "MMM d, yyyy")} →{" "}
                        {format(new Date(app.end_date + "T00:00:00"), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="p-3 border rounded-md bg-slate-50/30">
                      <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">
                        Purpose
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {app.purpose}
                      </p>
                    </div>
                  </div>
                  {app.status === "pending" && (
                    <div
                      className="flex flex-row md:flex-col gap-2 shrink-0 justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        onClick={() => handleQuickAction(app, "approved")}
                        className="gap-1.5 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAction(app, "rejected")}
                        className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" /> Reject
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
