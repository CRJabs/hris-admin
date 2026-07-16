import { useState, useEffect } from "react";
import { Check, X, Search, Filter, RefreshCw, ChevronDown, ChevronUp, Clock, User, CalendarDays } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOutletContext } from "react-router-dom";
import ApprovalsTabs from "@/components/approvals/ApprovalsTabs";

export default function Commutations() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [resolvedConditions, setResolvedConditions] = useState({});

  const handleToggleExpand = async (reqId, empId) => {
    if (expandedId === reqId) {
      setExpandedId(null);
    } else {
      setExpandedId(reqId);
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
  const [allEmployees, setAllEmployees] = useState([]);
  const { counts, searchQuery, statusFilter } = useOutletContext();

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_id, position, department, signature_url");
      if (!error && data) setAllEmployees(data);
    } catch (err) {
      console.error("Error fetching employees metadata:", err);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("commutation_requests")
        .select(`*, employees:employees!commutation_requests_employee_id_fkey ( id, first_name, last_name, employee_id, department, position, photo_url )`)
        .order("created_at", { ascending: false });

      if (!error) setRequests(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchEmployees();

    const sub = supabase
      .channel("commutation_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commutation_requests" },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, []);

  const handleAction = async (req, action) => {
    try {
      let targetStatus = action;
      let actionLog = "";
      let descriptionLog = "";
      let notifMsg = "";
      
      const empName = `${req.employees?.first_name || ""} ${req.employees?.last_name || ""}`;

      if (action === "forward") {
        targetStatus = req.noted_by_id ? "pending_noted" : "pending_approved_by";
        actionLog = "admin_forwarded_commutation";
        descriptionLog = `Forwarded Commutation Request for ${empName} to next approval stage`;
        notifMsg = `Your commutation request has been reviewed by HR and forwarded to the next approver.`;
      } else if (action === "rejected") {
        targetStatus = "rejected";
        actionLog = "admin_rejected_commutation";
        descriptionLog = `Rejected Commutation Request for ${empName}`;
        notifMsg = `Your commutation request was rejected by HR.`;
      }

      const { error } = await supabase
        .from("commutation_requests")
        .update({
          status: targetStatus,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", req.id);

      if (error) throw error;

      // Notify the employee
      await supabase.from("notifications").insert({
        employee_id: req.employee_id,
        type: action === "rejected" ? "rejected" : "info",
        title: action === "rejected" ? "Commutation Request Rejected" : "Commutation Request Forwarded",
        message: notifMsg
      });

      // Admin log
      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: "Administrator",
        action: actionLog,
        description: descriptionLog,
        employee_id: req.employee_id
      });

      toast.success(action === "forward" ? "Request forwarded successfully." : "Request rejected.");
      fetchRequests();
    } catch (err) {
      toast.error(`Action failed: ${err.message}`);
    }
  };

  const filteredRequests = requests.filter((req) => {
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "pending") {
      matchesStatus = ["pending_ra", "pending_hr_forward", "pending_noted", "pending_approved_by"].includes(req.status);
    } else {
      matchesStatus = req.status === statusFilter;
    }

    const fullName = `${req.employees?.first_name || ""} ${req.employees?.last_name || ""}`.toLowerCase();
    const empId = (req.employees?.employee_id || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || fullName.includes(query) || empId.includes(query);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => ["pending_ra", "pending_hr_forward", "pending_noted", "pending_approved_by"].includes(r.status)).length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_ra":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">Awaiting Dean Approval</Badge>;
      case "pending_hr_forward":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">Pending HR Forwarding</Badge>;
      case "pending_noted":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">Awaiting Noting (VP Admin)</Badge>;
      case "pending_approved_by":
        return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">Awaiting Final Approval</Badge>;
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">Fully Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">Rejected</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1440px] mx-auto">
      {/* Search & Filter Bar is now rendered at layout level */}

      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Loading commutation requests...</div>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <RefreshCw className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium text-lg">No commutation requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((req) => {
            const isExpanded = expandedId === req.id;
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

            const getApproverName = (id) => {
              if (!id) return "Pending Assignment";
              const found = allEmployees.find(e => e.id === id);
              return found ? `${found.first_name} ${found.last_name}` : "Pending Assignment";
            };

            return (
              <Card key={req.id} className="overflow-hidden hover:shadow-md transition-all bg-white">
                <CardHeader className="bg-muted/30 pb-3 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                      {req.employees?.photo_url ? (
                        <img src={req.employees.photo_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          {req.employees?.first_name?.[0]}{req.employees?.last_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {req.employees?.first_name} {req.employees?.last_name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        ID: {req.employees?.employee_id || "—"} · {req.employees?.department || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    {getStatusBadge(req.status)}
                    <span className="text-[10px] text-slate-400 font-semibold ml-2">
                      Filed on {format(new Date(req.created_at), "MMM d, yyyy h:mm a")}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleToggleExpand(req.id, req.employee_id)}
                      className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full ml-2"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                
                {!isExpanded ? (
                  <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="font-bold text-slate-800">Request:</span> Commutation of {req.total_days} Days.
                        {req.hours_per_day && ` (Hours per day: ${req.hours_per_day} Hrs)`}
                        {req.teaching_days && ` (Teaching load: ${req.teaching_days} Days)`}
                      </div>
                      {req.status === "approved" && (
                        <div className="text-[10px] text-slate-400 font-medium">
                          Fully approved and signed by President/VP. Saved for Record Keeping.
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleToggleExpand(req.id, req.employee_id)}
                      className="bg-[#0C005F] hover:bg-[#0C005F]/90 text-white font-bold text-xs h-8 px-4 border-none shadow-sm"
                    >
                      Open Form
                    </Button>
                  </CardContent>
                ) : (
                  <CardContent className="p-6 space-y-6 border-t border-slate-100 bg-slate-50/10">
                    <div className="text-center space-y-1 pb-3 border-b border-slate-100">
                      <div className="font-bold text-slate-700 text-xs tracking-wide">
                        <span className="font-extrabold text-[#0C005F]">{req.employees?.first_name} {req.employees?.last_name}</span> of <span className="font-extrabold text-[#0C005F]">{req.employees?.department}</span> hereby applies for the commutation of unused sick/vacation/forced benefits.
                      </div>
                      <div className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                        Route Match: {resolvedConditions[req.id] || "Loading match..."}
                      </div>
                    </div>

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

                    <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs">
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

                    {req.status === "pending_hr_forward" && (
                      <div className="flex gap-3 justify-end pt-2">
                        <Button 
                          onClick={() => handleAction(req, "forward")}
                          className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 text-white text-xs h-9 px-6 border-none shadow-sm"
                        >
                          <Check className="w-4 h-4" /> Forward Request
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleAction(req, "rejected")}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2 text-xs h-9 px-6 border-none"
                        >
                          <X className="w-4 h-4" /> Reject Request
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
