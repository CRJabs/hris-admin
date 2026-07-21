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

export default function PendingApprovalsModal({ 
  open, 
  onOpenChange, 
  employee, 
  ledUnitIds = [], 
  onSuccess,
  isAcademicHead = true,
  isExecutiveHead = false
}) {
  const [activeTab, setActiveTab] = useState(isAcademicHead ? "leaves" : "commutations");

  useEffect(() => {
    if (open) {
      setActiveTab(isAcademicHead ? "leaves" : "commutations");
    }
  }, [open, isAcademicHead]);

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
    if (!ledUnitIds || ledUnitIds.length === 0 || !isAcademicHead) {
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

      if (data) {
        const userEmpId = employee.id;
        const myPending = [];

        for (const req of data) {
          const { data: routeMatch, error: rpcErr } = await supabase.rpc('resolve_commutation_approvers', { emp_id: req.employee_id });
          if (!rpcErr && routeMatch) {
            const isMyStep = 
              (req.status === 'pending_ra' && routeMatch.ra_id === userEmpId) ||
              (req.status === 'pending_noted' && routeMatch.noted_by_id === userEmpId) ||
              (req.status === 'pending_approved_by' && routeMatch.approved_by_id === userEmpId);

            if (isMyStep) {
              myPending.push({
                ...req,
                ra_id: routeMatch.ra_id,
                noted_by_id: routeMatch.noted_by_id,
                approved_by_id: routeMatch.approved_by_id
              });
              setResolvedConditions(prev => ({ ...prev, [req.id]: routeMatch.condition_name }));
            }
          }
        }
        setCommutations(myPending);
      }
    } catch (err) {
      console.error("Error fetching commutations:", err);
      toast.error("Failed to load commutation requests.");
    } finally {
      setLoadingCommutations(false);
    }
  };

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [empRes, unitRes] = await Promise.all([
          supabase.from("employees").select("id, first_name, last_name, position, department"),
          supabase.from("org_units").select("id, name, parent_id")
        ]);
        if (empRes.data) setAllEmployees(empRes.data);
        if (unitRes.data) setOrgUnits(unitRes.data);
      } catch (err) {
        console.error("Error loading metadata", err);
      }
    }
    loadMetadata();
  }, []);

  useEffect(() => {
    if (open) {
      if (isAcademicHead) fetchLeaves();
      fetchCommutations();
    }
  }, [open, ledUnitIds, employee?.id, isAcademicHead]);

  const handleLeaveAction = async (app, action) => {
    setIsSubmitting(true);
    try {
      const newStatus = action === "approve" ? "approved" : "rejected";
      
      if (action === "approve") {
        const totalDays = Math.max(1, Math.round((new Date(app.end_date) - new Date(app.start_date)) / (1000 * 60 * 60 * 24)) + 1);
        const { data: credit } = await supabase
          .from("leave_credits")
          .select("*")
          .eq("id", app.leave_credit_id)
          .single();

        if (credit) {
          const newUsed = parseFloat(credit.used_credits || 0) + totalDays;
          await supabase
            .from("leave_credits")
            .update({ used_credits: newUsed })
            .eq("id", credit.id);
        }
      }

      const { error } = await supabase
        .from("leave_applications")
        .update({ status: newStatus })
        .eq("id", app.id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        employee_id: app.employee_id,
        type: action === 'approve' ? 'success' : 'error',
        title: action === 'approve' ? 'Leave Approved' : 'Leave Rejected',
        message: action === 'approve'
          ? `Your ${app.leave_type} Leave request (${app.start_date} to ${app.end_date}) has been approved by your department head.`
          : `Your ${app.leave_type} Leave request (${app.start_date} to ${app.end_date}) was rejected by your department head.`
      });

      toast.success(`Leave application ${action === "approve" ? "approved" : "rejected"}!`);
      setLeaves(prev => prev.filter(l => l.id !== app.id));
      window.dispatchEvent(new CustomEvent('pending_counts_changed'));
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error("Action failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommutationAction = async (req, action) => {
    setIsSubmitting(true);
    try {
      const userEmpId = employee.id;
      let updatePayload = {};
      let isFinal = false;

      if (req.status === 'pending_ra' && req.ra_id === userEmpId) {
        if (action === 'approve') {
          updatePayload = {
            ra_approved: true,
            ra_approved_at: new Date().toISOString(),
            status: req.noted_by_id ? 'pending_noted' : 'pending_approved_by'
          };
        } else {
          updatePayload = { status: 'rejected' };
        }
      } else if (req.status === 'pending_noted' && req.noted_by_id === userEmpId) {
        if (action === 'approve') {
          updatePayload = {
            noted_approved: true,
            noted_approved_at: new Date().toISOString(),
            status: 'pending_approved_by'
          };
        } else {
          updatePayload = { status: 'rejected' };
        }
      } else if (req.status === 'pending_approved_by' && req.approved_by_id === userEmpId) {
        if (action === 'approve') {
          updatePayload = {
            final_approved: true,
            final_approved_at: new Date().toISOString(),
            status: 'approved'
          };
          isFinal = true;
        } else {
          updatePayload = { status: 'rejected' };
        }
      } else {
        toast.error("You are not authorized to action this step.");
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('commutation_requests')
        .update(updatePayload)
        .eq('id', req.id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        employee_id: req.employee_id,
        type: action === 'approve' ? 'info' : 'error',
        title: action === 'approve' ? (isFinal ? 'Commutation Approved' : 'Commutation Request Updated') : 'Commutation Request Rejected',
        message: action === 'approve'
          ? (isFinal ? `Your commutation request for ${req.total_days} day(s) has received final approval!` : `Your commutation request has been reviewed and forwarded to the next approver.`)
          : `Your commutation request for ${req.total_days} day(s) was rejected.`
      });

      toast.success(`Commutation request ${action === "approve" ? "approved & forwarded" : "rejected"}!`);
      setCommutations(prev => prev.filter(c => c.id !== req.id));
      window.dispatchEvent(new CustomEvent('pending_counts_changed'));
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error("Action failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getApproverName = (id) => {
    if (!id) return "—";
    const found = allEmployees.find(e => e.id === id);
    return found ? `${found.first_name} ${found.last_name}` : "Approver";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-[8px] bg-white text-slate-800 border border-slate-200 shadow-none">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 pt-4">
          <div className="px-6 border-b border-slate-100 shrink-0">
            <TabsList className="bg-slate-100 p-1 mb-2 rounded-[8px]">
              {isAcademicHead && (
                <TabsTrigger value="leaves" className="text-xs font-bold gap-2 text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white rounded-[6px]">
                  Leave Applications
                  {leaves.length > 0 && (
                    <Badge variant="destructive" className="h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold">
                      {leaves.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="commutations" className="text-xs font-bold gap-2 text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white rounded-[6px]">
                Commutation Requests
                {commutations.length > 0 && (
                  <Badge variant="destructive" className="h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold">
                    {commutations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 text-slate-800">
            {/* Leaves Tab Content */}
            {isAcademicHead && (
              <TabsContent value="leaves" className="m-0 focus-visible:outline-none">
                {loadingLeaves ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0C005F]" />
                    <span className="text-xs font-medium">Fetching pending leaves...</span>
                  </div>
                ) : leaves.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                    <CheckSquare className="w-12 h-12 mb-3 opacity-30 text-[#0C005F]" />
                    <p className="font-bold text-sm text-slate-800">All caught up!</p>
                    <p className="text-xs mt-0.5 text-slate-500">No leave applications awaiting your approval.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaves.map((app) => (
                      <Card key={app.id} className="overflow-hidden border-slate-200 shadow-none bg-white text-slate-800 rounded-[8px]">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200">
                              {app.employees?.photo_url ? (
                                <img src={app.employees.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-bold text-slate-600">
                                  {app.employees?.first_name?.[0]}{app.employees?.last_name?.[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">
                                {app.employees?.first_name} {app.employees?.last_name}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-medium">
                                ID: {app.employees?.employee_id} • {app.employees?.department}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium shrink-0 border border-slate-200">
                            Filed {format(new Date(app.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="bg-blue-50 text-[#0C005F] border-none font-bold text-[9px] px-2 py-0.5 shadow-none">
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
                            <Button size="sm" onClick={() => handleLeaveAction(app, "approve")} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 shadow-none rounded-[6px]">
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleLeaveAction(app, "reject")} disabled={isSubmitting} className="bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 font-bold text-xs h-8 px-3 shadow-none rounded-[6px]">
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* Commutations Tab Content */}
            <TabsContent value="commutations" className="m-0 focus-visible:outline-none">
              {loadingCommutations ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0C005F]" />
                  <span className="text-xs font-medium">Fetching pending commutations...</span>
                </div>
              ) : commutations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <CheckSquare className="w-12 h-12 mb-3 opacity-30 text-[#0C005F]" />
                  <p className="font-bold text-sm text-slate-800">All caught up!</p>
                  <p className="text-xs mt-0.5 text-slate-500">No commutation requests awaiting your approval.</p>
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
                      <Card key={req.id} className="overflow-hidden border-slate-200 shadow-none bg-white text-slate-800 rounded-[8px]">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200">
                              {req.employees?.photo_url ? (
                                <img src={req.employees.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-bold text-slate-600">
                                  {req.employees?.first_name?.[0]}{req.employees?.last_name?.[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">
                                {req.employees?.first_name} {req.employees?.last_name}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-medium">
                                ID: {req.employees?.employee_id} • {req.employees?.department}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-[#0C005F] border-blue-200 text-[9px] py-0.5 px-2 font-bold uppercase tracking-wider shadow-none">
                              Awaiting Your Approval
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleToggleExpandCommutation(req.id, req.employee_id)}
                              className="h-7 w-7 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full"
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
                                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Commuted Days</span>
                                <span className="font-extrabold text-slate-800">{req.total_days} Days</span>
                              </div>
                              {req.hours_per_day && (
                                <div>
                                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Hours Per Day</span>
                                  <span className="font-extrabold text-slate-800">{req.hours_per_day} Hrs</span>
                                </div>
                              )}
                              {req.teaching_days && (
                                <div>
                                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Teaching Load Days</span>
                                  <span className="font-extrabold text-slate-800">{req.teaching_days} Days</span>
                                </div>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleToggleExpandCommutation(req.id, req.employee_id)}
                              className="bg-[#0C005F] hover:bg-[#0C005F]/90 text-white font-bold text-xs h-8 px-4 rounded-[6px] shadow-none"
                            >
                              Open Form
                            </Button>
                          </CardContent>
                        )}

                        {/* Expanded detailed commutation view */}
                        {isExpanded && (
                          <CardContent className="p-6 space-y-6 border-t border-slate-100 bg-slate-50/30">
                            {/* Department title & Routing Condition */}
                            <div className="text-center space-y-1 pb-3 border-b border-slate-200">
                              <div className="font-bold text-slate-700 text-xs tracking-wide">
                                <span className="font-extrabold text-[#0C005F]">{req.employees?.first_name} {req.employees?.last_name}</span> of <span className="font-extrabold text-[#0C005F]">{req.employees?.department}</span> hereby applies for the commutation of unused sick/vacation/forced leave benefits.
                              </div>
                              <div className="text-[10px] text-[#0C005F] font-semibold uppercase tracking-wider">
                                Route Match: {resolvedConditions[req.id] || "Loading match..."}
                              </div>
                            </div>

                            {/* Credits Table Snapshot */}
                            <div className="border border-slate-200 rounded-[8px] overflow-hidden shadow-none bg-white">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-center">
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
                                    <td className="p-2 border-l border-slate-100 text-[#0C005F] font-bold">{sick.commutableDays}</td>
                                    <td className="p-2 border-l border-slate-100 text-[#0C005F] font-bold">{vacation.commutableDays}</td>
                                    <td className="p-2 border-l border-slate-100 text-[#0C005F] font-bold">{family.commutableDays}</td>
                                    {force && <td className="p-2 border-l border-slate-100 text-[#0C005F] font-bold">{force.commutableDays}</td>}
                                    <td className="p-2 border-l border-slate-100 font-bold text-[#0C005F] bg-slate-50/20">{total.commutableDays}</td>
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
                              <div className="p-4 border border-slate-200 bg-white rounded-[8px] text-xs space-y-2 shadow-none">
                                <h4 className="font-extrabold text-[#0C005F] uppercase text-[9px] tracking-widest">FOR TEACHING LOAD DETAILS:</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-slate-500 font-bold block text-[9px] uppercase">Hours Per Day</span>
                                    <span className="font-extrabold text-slate-800">{req.hours_per_day} Hours</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 font-bold block text-[9px] uppercase">Total Days (For Commutation)</span>
                                    <span className="font-extrabold text-slate-800">{req.teaching_days} Days</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Approval Signature Block */}
                            <div className="p-5 border border-slate-200 rounded-[8px] bg-white space-y-6 shadow-none">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs">
                                {/* Employee Signature block */}
                                <div className="flex flex-col items-center justify-end h-28">
                                  {req.employees?.signature_url ? (
                                    <img src={req.employees.signature_url} alt="Signature" className="h-12 object-contain mb-2" />
                                  ) : (
                                    <div className="h-8 flex items-center justify-center italic text-slate-400 text-[10px]">Signed Digitally</div>
                                  )}
                                  <div className="border-t border-slate-300 w-64 pt-1 font-bold text-slate-800">
                                    {req.employees?.first_name} {req.employees?.last_name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium">Employee's Signature</div>
                                </div>

                                {/* Recommending Approval Dean block */}
                                {req.ra_id && (
                                  <div className="flex flex-col items-center justify-end h-28">
                                    {req.ra_approved ? (
                                      <div className="flex flex-col items-center mb-1">
                                        {raSigner?.signature_url ? (
                                          <img src={raSigner.signature_url} alt="Signature" className="h-10 object-contain" />
                                        ) : (
                                          <Badge className="bg-emerald-50 text-emerald-700 text-[9px] hover:bg-emerald-50 font-bold border-none uppercase py-0.5 px-2 mb-1 shadow-none">Stamps APPROVED</Badge>
                                        )}
                                        <span className="text-[9px] text-slate-400 font-medium">Signed on {format(new Date(req.ra_approved_at), "MM/dd/yyyy")}</span>
                                      </div>
                                    ) : (
                                      <div className="h-12 flex items-center justify-center text-[#0C005F] font-semibold italic text-[10px]">Awaiting Recommending Approval</div>
                                    )}
                                    <div className="border-t border-slate-300 w-64 pt-1 font-bold text-slate-800">
                                      {getApproverName(req.ra_id)}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium">Dean / Office Head (Recommending Approval)</div>
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
                                          <Badge className="bg-emerald-50 text-emerald-700 text-[9px] hover:bg-emerald-50 font-bold border-none uppercase py-0.5 px-2 mb-1 shadow-none">Stamps NOTED</Badge>
                                        )}
                                        <span className="text-[9px] text-slate-400 font-medium">Noted on {format(new Date(req.noted_approved_at), "MM/dd/yyyy")}</span>
                                      </div>
                                    ) : (
                                      <div className="h-12 flex items-center justify-center text-[#0C005F] font-semibold italic text-[10px]">Awaiting Noting</div>
                                    )}
                                    <div className="border-t border-slate-300 w-64 pt-1 font-bold text-slate-800">
                                      {getApproverName(req.noted_by_id)}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium">Vice President for Administration (Noted By)</div>
                                  </div>
                                )}

                                {/* Approved by President block */}
                                <div className="flex flex-col items-center justify-end h-28">
                                  {req.final_approved ? (
                                    <div className="flex flex-col items-center mb-1">
                                      {approvedSigner?.signature_url ? (
                                        <img src={approvedSigner.signature_url} alt="Signature" className="h-10 object-contain" />
                                      ) : (
                                        <Badge className="bg-emerald-50 text-emerald-700 text-[9px] hover:bg-emerald-50 font-bold border-none uppercase py-0.5 px-2 mb-1 shadow-none">Stamps APPROVED</Badge>
                                      )}
                                      <span className="text-[9px] text-slate-400 font-medium">Approved on {format(new Date(req.final_approved_at), "MM/dd/yyyy")}</span>
                                    </div>
                                  ) : (
                                    <div className="h-12 flex items-center justify-center text-[#0C005F] font-semibold italic text-[10px]">Awaiting Final Approval</div>
                                  )}
                                  <div className="border-t border-slate-300 w-64 pt-1 font-bold text-slate-800">
                                    {getApproverName(req.approved_by_id)}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium">Approved By</div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons for Approver */}
                            <div className="flex gap-3 justify-end pt-2">
                              <Button 
                                onClick={() => handleCommutationAction(req, "approve")}
                                disabled={isSubmitting}
                                className="bg-[#0C005F] hover:bg-[#0C005F]/90 font-bold gap-2 text-white text-xs h-9 px-6 rounded-[6px] shadow-none"
                              >
                                <Check className="w-4 h-4" /> Sign & Approve Request
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => handleCommutationAction(req, "reject")}
                                disabled={isSubmitting}
                                className="bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 font-bold gap-2 text-xs h-9 px-6 rounded-[6px] shadow-none"
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
      </DialogContent>
    </Dialog>
  );
}
