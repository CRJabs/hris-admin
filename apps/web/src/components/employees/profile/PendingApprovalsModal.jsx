import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, CalendarDays, Clock, User, CheckSquare, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PendingApprovalsModal({ open, onOpenChange, employee, ledUnitIds = [], onSuccess }) {
  const [activeTab, setActiveTab] = useState("leaves");
  
  // Leaves states
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);

  // Commutations states
  const [commutations, setCommutations] = useState([]);
  const [loadingCommutations, setLoadingCommutations] = useState(true);
  const [expandedCommutationId, setExpandedCommutationId] = useState(null);
  const [resolvedConditions, setResolvedConditions] = useState({});

  const handleToggleExpandCommutation = async (reqId, empId) => {
    if (expandedCommutationId === reqId) {
      setExpandedCommutationId(null);
    } else {
      setExpandedCommutationId(reqId);
      if (!resolvedConditions[reqId]) {
        try {
          const { data, error } = await supabase.rpc('resolve_commutation_approvers', { emp_id: empId });
          if (!error && data) {
            setResolvedConditions(prev => ({ ...prev, [reqId]: data.condition_name }));
          }
        } catch (err) {
          console.error("Error resolving condition on expand:", err);
        }
      }
    }
  };
  
  // Metadata for names resolution
  const [allEmployees, setAllEmployees] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaves = async () => {
    if (!ledUnitIds || ledUnitIds.length === 0) {
      setLeaves([]);
      setLoadingLeaves(false);
      return;
    }
    setLoadingLeaves(true);
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
      if (data) {
        // Filter in memory to match led unit IDs
        const filtered = data.filter((app) => app.employees && ledUnitIds.includes(app.employees.org_unit_id));
        setLeaves(filtered);
      }
    } catch (err) {
      console.error("Error fetching leaves:", err);
      toast.error("Failed to load leave applications.");
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchCommutations = async () => {
    if (!employee?.id) return;
    setLoadingCommutations(true);
    try {
      // Fetch commutation requests that are pending approval at some stage
      const { data, error } = await supabase
        .from("commutation_requests")
        .select(`
          *,
          employees:employees!commutation_requests_employee_id_fkey (
            id,
            first_name,
            last_name,
            employee_id,
            department,
            position,
            photo_url,
            signature_url
          )
        `)
        .in("status", ["pending_ra", "pending_noted", "pending_approved_by"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter in memory to see if this employee is the required approver for the current state
      if (data) {
        const filtered = data.filter((req) => {
          if (req.status === "pending_ra" && req.ra_id === employee.id && !req.ra_approved) {
            return true;
          }
          if (req.status === "pending_noted" && req.noted_by_id === employee.id && !req.noted_approved) {
            return true;
          }
          if (req.status === "pending_approved_by" && req.approved_by_id === employee.id && !req.final_approved) {
            return true;
          }
          return false;
        });
        setCommutations(filtered);
      }
    } catch (err) {
      console.error("Error fetching commutations:", err);
      toast.error("Failed to load commutation requests.");
    } finally {
      setLoadingCommutations(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_id, position, department, signature_url");
      if (!error && data) setAllEmployees(data);

      const { data: units } = await supabase.from("org_units").select("*");
      const { data: sems } = await supabase.from("employee_semesters").select("*");
      if (units) setOrgUnits(units);
      if (sems) setSemesters(sems);
    } catch (err) {
      console.error("Error fetching employees metadata:", err);
    }
  };

  useEffect(() => {
    if (open && employee?.id) {
      fetchLeaves();
      fetchCommutations();
      fetchEmployees();
    }
  }, [open, employee?.id, JSON.stringify(ledUnitIds)]);

  // Handle Realtime Updates
  useEffect(() => {
    if (!open) return;
    const leaveSub = supabase
      .channel("leave_approvals_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_applications" }, () => fetchLeaves())
      .subscribe();

    const commSub = supabase
      .channel("commutation_approvals_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "commutation_requests" }, () => fetchCommutations())
      .subscribe();

    return () => {
      leaveSub.unsubscribe();
      commSub.unsubscribe();
    };
  }, [open, JSON.stringify(ledUnitIds)]);

  // Leave approval action
  const handleLeaveAction = async (app, action) => {
    setIsSubmitting(true);
    try {
      const headName = `${employee.first_name} ${employee.last_name}`;
      const empName = `${app.employees?.first_name} ${app.employees?.last_name}`;

      const { error: updateError } = await supabase
        .from("leave_applications")
        .update({
          status: action === "approve" ? "pending" : "rejected",
          approved_by_dept_head: action === "approve" ? true : false,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", app.id);

      if (updateError) throw updateError;

      // Notify employee
      await supabase.from("notifications").insert({
        employee_id: app.employee_id,
        type: action === "approve" ? "info" : "rejected",
        title: action === "approve" ? "Leave Approved by Department Head" : "Leave Rejected by Department Head",
        message: action === "approve"
          ? `Your ${app.leave_type} Leave from ${app.start_date} to ${app.end_date} has been approved by your Department Head (${headName}) and forwarded to HR for final approval.`
          : `Your ${app.leave_type} Leave request was rejected by your Department Head (${headName}).`
      });

      // Log admin action
      await supabase.from("admin_activity_log").insert({
        actor_type: "employee",
        actor_name: headName,
        action: action === "approve" ? "dept_head_approved_leave" : "dept_head_rejected_leave",
        description: `${action === "approve" ? "Approved" : "Rejected"} ${app.leave_type} Leave for ${empName} (${app.start_date} to ${app.end_date}) by Department Head`,
        employee_id: app.employee_id
      });

      toast.success(action === "approve" ? "Approved & forwarded to HR" : "Rejected successfully.");
      fetchLeaves();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error("Action failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Commutation approval action
  const handleCommutationAction = async (req, action) => {
    setIsSubmitting(true);
    try {
      const signerName = `${employee.first_name} ${employee.last_name}`;
      const empName = `${req.employees?.first_name} ${req.employees?.last_name}`;
      const now = new Date().toISOString();

      let updateFields = {};
      let logAction = "";
      let logDesc = "";
      let notifTitle = "";
      let notifMsg = "";

      if (action === "reject") {
        updateFields = {
          status: "rejected",
          reviewed_at: now
        };
        logAction = "commutation_rejected";
        logDesc = `Rejected Commutation Request for ${empName} by ${signerName}`;
        notifTitle = "Commutation Request Rejected";
        notifMsg = `Your request for Commutation of Leave Credits was rejected by ${signerName}.`;
      } else {
        // Approve
        if (req.status === "pending_ra") {
          updateFields = {
            ra_approved: true,
            ra_approved_at: now,
            status: "pending_hr_forward" // Forwarded to HR
          };
          logAction = "commutation_ra_approved";
          logDesc = `Recommended Approval for Commutation Request for ${empName} by Dean/Office Head ${signerName}`;
          notifTitle = "Commutation Recommended for Approval";
          notifMsg = `Your commutation request has been recommended for approval by your Dean/Office Head (${signerName}) and is now with HR.`;
        } else if (req.status === "pending_noted") {
          updateFields = {
            noted_approved: true,
            noted_approved_at: now,
            status: "pending_approved_by" // Forwarded to Approved By
          };
          logAction = "commutation_noted";
          logDesc = `Noted Commutation Request for ${empName} by ${signerName}`;
          notifTitle = "Commutation Request Noted";
          notifMsg = `Your commutation request has been noted by ${signerName} and is awaiting final approval.`;
        } else if (req.status === "pending_approved_by") {
          updateFields = {
            final_approved: true,
            final_approved_at: now,
            status: "approved", // Fully Approved
            reviewed_at: now
          };
          logAction = "commutation_final_approved";
          logDesc = `Fully Approved Commutation Request for ${empName} by ${signerName}`;
          notifTitle = "Commutation Request Fully Approved";
          notifMsg = `Your request for Commutation of Leave Credits has been fully approved by ${signerName}.`;
        }
      }

      const { error } = await supabase
        .from("commutation_requests")
        .update(updateFields)
        .eq("id", req.id);

      if (error) throw error;


      // Note: leave credit deduction is handled automatically by the
      // Postgres trigger `trg_deduct_commutable_credits` on commutation_requests.


      // Insert notification
      await supabase.from("notifications").insert({
        employee_id: req.employee_id,
        type: action === "reject" ? "rejected" : "info",
        title: notifTitle,
        message: notifMsg
      });

      // Log activity
      await supabase.from("admin_activity_log").insert({
        actor_type: "employee",
        actor_name: signerName,
        action: logAction,
        description: logDesc,
        employee_id: req.employee_id
      });

      toast.success(action === "reject" ? "Request rejected." : "Request approved and signed successfully!");
      setExpandedCommutationId(null);
      fetchCommutations();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error("Action failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getApproverName = (id) => {
    if (!id) return "Pending Assignment";
    const found = allEmployees.find(e => e.id === id);
    return found ? `${found.first_name} ${found.last_name}` : "Pending Assignment";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#0C005F]" />
            Approvals Portal
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Review and action leave applications and commutation of leave credits requests pending your approval.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 border-b border-slate-100 shrink-0">
            <TabsList className="bg-slate-100/50 p-1 mb-2">
              <TabsTrigger value="leaves" className="text-xs font-bold gap-2 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                Leave Applications
                {leaves.length > 0 && (
                  <Badge variant="destructive" className="h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold">
                    {leaves.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="commutations" className="text-xs font-bold gap-2 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                Commutation Requests
                {commutations.length > 0 && (
                  <Badge variant="destructive" className="h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold">
                    {commutations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {/* Leaves Tab Content */}
            <TabsContent value="leaves" className="m-0 focus-visible:outline-none">
              {loadingLeaves ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0C005F]" />
                  <span className="text-xs font-medium">Fetching pending leaves...</span>
                </div>
              ) : leaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <CheckSquare className="w-12 h-12 mb-3 opacity-20 text-emerald-500" />
                  <p className="font-bold text-sm text-slate-700">All caught up!</p>
                  <p className="text-xs mt-0.5">No leave applications awaiting your approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaves.map((app) => (
                    <Card key={app.id} className="overflow-hidden border-slate-200 shadow-sm bg-white">
                      <div className="bg-slate-50/40 p-4 border-b border-slate-100 flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border">
                            {app.employees?.photo_url ? (
                              <img src={app.employees.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500">
                                {app.employees?.first_name?.[0]}{app.employees?.last_name?.[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">
                              {app.employees?.first_name} {app.employees?.last_name}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium">
                              ID: {app.employees?.employee_id} • {app.employees?.department}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium shrink-0">
                          Filed {format(new Date(app.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] px-2 py-0.5 shadow-none">
                              {app.leave_type} Leave
                            </Badge>
                            <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                              {format(new Date(app.start_date + "T00:00:00"), "MMM d")} → {format(new Date(app.end_date + "T00:00:00"), "MMM d, yyyy")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-snug font-medium italic">"{app.purpose}"</p>
                        </div>
                        <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                          <Button size="sm" onClick={() => handleLeaveAction(app, "approve")} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleLeaveAction(app, "reject")} disabled={isSubmitting} className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold text-xs h-8 px-3">
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Commutations Tab Content */}
            <TabsContent value="commutations" className="m-0 focus-visible:outline-none">
              {loadingCommutations ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0C005F]" />
                  <span className="text-xs font-medium">Fetching pending commutations...</span>
                </div>
              ) : commutations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <CheckSquare className="w-12 h-12 mb-3 opacity-20 text-emerald-500" />
                  <p className="font-bold text-sm text-slate-700">All caught up!</p>
                  <p className="text-xs mt-0.5">No commutation requests awaiting your approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commutations.map((req) => {
                    const isExpanded = expandedCommutationId === req.id;
                    const snapshot = req.commutation_snapshot || {};
                    const sick = snapshot.sick || { allocated: 0, nonCommutableDays: 0, commutableDays: 0, used: 0, unused: 0 };
                    const vacation = snapshot.vacation || { allocated: 0, nonCommutableDays: 0, commutableDays: 0, used: 0, unused: 0 };
                    const family = snapshot.family || { allocated: 0, nonCommutableDays: 0, commutableDays: 0, used: 0, unused: 0 };
                    const force = snapshot.force || null;
                    const total = snapshot.total || { allocated: 0, nonCommutableDays: 0, commutableDays: 0, used: 0, unused: 0 };
                    const colSpanCount = force ? 5 : 4;
                    const raSigner = allEmployees.find(e => e.id === req.ra_id);
                    const notedSigner = allEmployees.find(e => e.id === req.noted_by_id);
                    const approvedSigner = allEmployees.find(e => e.id === req.approved_by_id);

                    return (
                      <Card key={req.id} className="overflow-hidden border-slate-200 shadow-sm bg-white">
                        <div className="bg-slate-50/40 p-4 border-b border-slate-100 flex justify-between items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border">
                              {req.employees?.photo_url ? (
                                <img src={req.employees.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-bold text-slate-500">
                                  {req.employees?.first_name?.[0]}{req.employees?.last_name?.[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">
                                {req.employees?.first_name} {req.employees?.last_name}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium">
                                ID: {req.employees?.employee_id} • {req.employees?.department}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] py-0.5 px-2 font-bold uppercase tracking-wider">
                              Awaiting Your Approval
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleToggleExpandCommutation(req.id, req.employee_id)}
                              className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Collapsed view summary */}
                        {!isExpanded && (
                          <CardContent className="p-4 flex justify-between items-center text-xs">
                            <div className="flex gap-4">
                              <div>
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Commuted Days</span>
                                <span className="font-extrabold text-slate-800">{req.total_days} Days</span>
                              </div>
                              {req.hours_per_day && (
                                <div>
                                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Hours Per Day</span>
                                  <span className="font-extrabold text-slate-800">{req.hours_per_day} Hrs</span>
                                </div>
                              )}
                              {req.teaching_days && (
                                <div>
                                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Teaching Load Days</span>
                                  <span className="font-extrabold text-slate-800">{req.teaching_days} Days</span>
                                </div>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleToggleExpandCommutation(req.id, req.employee_id)}
                              className="bg-[#0C005F] hover:bg-[#0C005F]/90 text-white font-bold text-xs h-8 px-4"
                            >
                              Open Form
                            </Button>
                          </CardContent>
                        )}

                        {/* Expanded detailed commutation view */}
                        {isExpanded && (
                          <CardContent className="p-6 space-y-6 border-t border-slate-100 bg-slate-50/10">
                            {/* Department title & Routing Condition */}
                            <div className="text-center space-y-1 pb-3 border-b border-slate-100">
                              <div className="font-bold text-slate-700 text-xs tracking-wide">
                                <span className="font-extrabold text-[#0C005F]">{req.employees?.first_name} {req.employees?.last_name}</span> of <span className="font-extrabold text-[#0C005F]">{req.employees?.department}</span> hereby applies for the commutation of unused sick/vacation/forced leave benefits.
                              </div>
                              <div className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                                Route Match: {resolvedConditions[req.id] || "Loading match..."}
                              </div>
                            </div>

                            {/* Credits Table Snapshot */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-center">
                                    <th className="p-2 text-left w-1/4"></th>
                                    <th className="p-2 border-l border-slate-200">Sick Leave</th>
                                    <th className="p-2 border-l border-slate-200">Vacation Leave</th>
                                    <th className="p-2 border-l border-slate-200">Family Leave</th>
                                    {force && <th className="p-2 border-l border-slate-200">Force Leave</th>}
                                    <th className="p-2 border-l border-slate-200 font-extrabold text-[#0C005F]">TOTAL</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-center">
                                  <tr>
                                    <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Days Allocated</td>
                                    <td className="p-2 border-l border-slate-100">{sick.allocated}</td>
                                    <td className="p-2 border-l border-slate-100">{vacation.allocated}</td>
                                    <td className="p-2 border-l border-slate-100">{family.allocated}</td>
                                    {force && <td className="p-2 border-l border-slate-100">{force.allocated}</td>}
                                    <td className="p-2 border-l border-slate-100 font-bold text-slate-800 bg-slate-50/20">{total.allocated}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Non-Commutable Days</td>
                                    <td className="p-2 border-l border-slate-100">{sick.nonCommutableDays}</td>
                                    <td className="p-2 border-l border-slate-100">{vacation.nonCommutableDays}</td>
                                    <td className="p-2 border-l border-slate-100">{family.nonCommutableDays}</td>
                                    {force && <td className="p-2 border-l border-slate-100">{force.nonCommutableDays}</td>}
                                    <td className="p-2 border-l border-slate-100 font-bold text-slate-800 bg-slate-50/20">{total.nonCommutableDays}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Days Commutable</td>
                                    <td className="p-2 border-l border-slate-100 text-amber-600 font-bold">{sick.commutableDays}</td>
                                    <td className="p-2 border-l border-slate-100 text-amber-600 font-bold">{vacation.commutableDays}</td>
                                    <td className="p-2 border-l border-slate-100 text-amber-600 font-bold">{family.commutableDays}</td>
                                    {force && <td className="p-2 border-l border-slate-100 text-amber-600 font-bold">{force.commutableDays}</td>}
                                    <td className="p-2 border-l border-slate-100 font-bold text-amber-700 bg-slate-50/20">{total.commutableDays}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Used Leave</td>
                                    <td className="p-2 border-l border-slate-100">{sick.used}</td>
                                    <td className="p-2 border-l border-slate-100">{vacation.used}</td>
                                    <td className="p-2 border-l border-slate-100">{family.used}</td>
                                    {force && <td className="p-2 border-l border-slate-100">{force.used}</td>}
                                    <td className="p-2 border-l border-slate-100 font-bold text-slate-800 bg-slate-50/20">{total.used}</td>
                                  </tr>
                                  <tr className="border-b border-slate-200">
                                    <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Unused Leave</td>
                                    <td className="p-2 border-l border-slate-100 text-emerald-600 font-bold">{sick.unused}</td>
                                    <td className="p-2 border-l border-slate-100 text-emerald-600 font-bold">{vacation.unused}</td>
                                    <td className="p-2 border-l border-slate-100 text-emerald-600 font-bold">{family.unused}</td>
                                    {force && <td className="p-2 border-l border-slate-100 text-emerald-600 font-bold">{force.unused}</td>}
                                    <td className="p-2 border-l border-slate-100 font-bold text-emerald-700 bg-slate-50/20">{total.unused}</td>
                                  </tr>
                                  <tr className="bg-slate-50/50 font-bold text-left">
                                    <td className="p-2 text-slate-800">Total Number of Days of Commutation</td>
                                    <td colSpan={colSpanCount} className="p-2 border-l border-slate-100 font-extrabold text-slate-800 text-xs">
                                      {req.total_days} Days
                                    </td>
                                  </tr>
                                  {req.hours_per_day && !req.teaching_days && (
                                    <tr className="bg-slate-50/50 font-bold text-left">
                                      <td className="p-2 text-slate-800">Hours Per Day</td>
                                      <td colSpan={colSpanCount} className="p-2 border-l border-slate-100 font-extrabold text-slate-800 text-xs">
                                        {req.hours_per_day} Hours
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Teaching Load details for Non-teaching */}
                            {req.teaching_days && (
                              <div className="p-4 border border-slate-200 bg-white rounded-xl text-xs space-y-2">
                                <h4 className="font-extrabold text-slate-500 uppercase text-[9px] tracking-widest">FOR TEACHING LOAD DETAILS:</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Hours Per Day</span>
                                    <span className="font-extrabold text-slate-800">{req.hours_per_day} Hours</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Total Days (For Commutation)</span>
                                    <span className="font-extrabold text-slate-800">{req.teaching_days} Days</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Approval Signature Block (Image #4 Layout) */}
                            <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs">
                                {/* Employee Signature block */}
                                <div className="flex flex-col items-center justify-end h-28">
                                  {req.employees?.signature_url ? (
                                    <img src={req.employees.signature_url} alt="Signature" className="h-12 object-contain mb-2" />
                                  ) : (
                                    <div className="h-8 flex items-center justify-center italic text-slate-400 text-[10px]">Signed Digitally</div>
                                  )}
                                  <div className="border-t border-slate-400 w-64 pt-1 font-bold text-slate-800">
                                    {req.employees?.first_name} {req.employees?.last_name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium">Employee's Signature</div>
                                </div>

                                {/* Recommending Approval Dean block */}
                                {req.ra_id && (
                                  <div className="flex flex-col items-center justify-end h-28">
                                    {req.ra_approved ? (
                                      <div className="flex flex-col items-center mb-1">
                                        {raSigner?.signature_url ? (
                                          <img src={raSigner.signature_url} alt="Signature" className="h-10 object-contain" />
                                        ) : (
                                          <Badge className="bg-emerald-100 text-emerald-700 text-[9px] hover:bg-emerald-100 font-bold border-none uppercase py-0.5 px-2 mb-1 shadow-none">Stamps APPROVED</Badge>
                                        )}
                                        <span className="text-[9px] text-slate-400 font-medium">Signed on {format(new Date(req.ra_approved_at), "MM/dd/yyyy")}</span>
                                      </div>
                                    ) : (
                                      <div className="h-12 flex items-center justify-center text-amber-500 font-semibold italic text-[10px]">Awaiting Recommending Approval</div>
                                    )}
                                    <div className="border-t border-slate-400 w-64 pt-1 font-bold text-slate-800">
                                      {getApproverName(req.ra_id)}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium">Dean / Office Head (Recommending Approval)</div>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-100">
                                {/* Noted VP Admin block */}
                                {req.noted_by_id && (
                                  <div className="flex flex-col items-center justify-end h-28">
                                    {req.noted_approved ? (
                                      <div className="flex flex-col items-center mb-1">
                                        {notedSigner?.signature_url ? (
                                          <img src={notedSigner.signature_url} alt="Signature" className="h-10 object-contain" />
                                        ) : (
                                          <Badge className="bg-emerald-100 text-emerald-700 text-[9px] hover:bg-emerald-100 font-bold border-none uppercase py-0.5 px-2 mb-1 shadow-none">Stamps NOTED</Badge>
                                        )}
                                        <span className="text-[9px] text-slate-400 font-medium">Noted on {format(new Date(req.noted_approved_at), "MM/dd/yyyy")}</span>
                                      </div>
                                    ) : (
                                      <div className="h-12 flex items-center justify-center text-amber-500 font-semibold italic text-[10px]">Awaiting Noting</div>
                                    )}
                                    <div className="border-t border-slate-400 w-64 pt-1 font-bold text-slate-800">
                                      {getApproverName(req.noted_by_id)}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium">Vice President for Administration (Noted By)</div>
                                  </div>
                                )}

                                {/* Approved by President block */}
                                <div className="flex flex-col items-center justify-end h-28">
                                  {req.final_approved ? (
                                    <div className="flex flex-col items-center mb-1">
                                      {approvedSigner?.signature_url ? (
                                        <img src={approvedSigner.signature_url} alt="Signature" className="h-10 object-contain" />
                                      ) : (
                                        <Badge className="bg-emerald-100 text-emerald-700 text-[9px] hover:bg-emerald-100 font-bold border-none uppercase py-0.5 px-2 mb-1 shadow-none">Stamps APPROVED</Badge>
                                      )}
                                      <span className="text-[9px] text-slate-400 font-medium">Approved on {format(new Date(req.final_approved_at), "MM/dd/yyyy")}</span>
                                    </div>
                                  ) : (
                                    <div className="h-12 flex items-center justify-center text-amber-500 font-semibold italic text-[10px]">Awaiting Final Approval</div>
                                  )}
                                  <div className="border-t border-slate-400 w-64 pt-1 font-bold text-slate-800">
                                    {getApproverName(req.approved_by_id)}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium">Approved By</div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons for Approver */}
                            <div className="flex gap-3 justify-end pt-2">
                              <Button 
                                onClick={() => handleCommutationAction(req, "approve")}
                                disabled={isSubmitting}
                                className="bg-[#0C005F] hover:bg-[#0C005F]/90 font-bold gap-2 text-white text-xs h-9 px-6"
                              >
                                <Check className="w-4 h-4" /> Sign & Approve Request
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => handleCommutationAction(req, "reject")}
                                disabled={isSubmitting}
                                className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold gap-2 text-xs h-9 px-6"
                              >
                                <X className="w-4 h-4" /> Reject Request
                              </Button>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-4 border-t border-slate-100 shrink-0 bg-slate-50">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-9 font-bold text-xs">
            Close approvals
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
