import { useState, useEffect } from "react";
import { Check, X, Search, Filter, RefreshCw, Clock, User, Eye, CalendarDays, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useOutletContext } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Commutations() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolvedCondition, setResolvedCondition] = useState("");
  const [allEmployees, setAllEmployees] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
        .select(`*, employees:employees!commutation_requests_employee_id_fkey ( id, first_name, last_name, employee_id, department, position, photo_url, signature_url )`)
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

  const handleOpenReviewModal = async (req) => {
    setSelectedReq(req);
    setModalOpen(true);
    setResolvedCondition("");
    try {
      const { data, error } = await supabase.rpc('resolve_commutation_approvers', { emp_id: req.employee_id });
      if (!error && data) {
        setResolvedCondition(data.condition_name);
      }
    } catch (err) {
      console.error("Error resolving condition on modal open:", err);
    }
  };

  const handleAction = async (req, action) => {
    setIsProcessing(true);
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

      await supabase.from("notifications").insert({
        employee_id: req.employee_id,
        type: action === "rejected" ? "rejected" : "info",
        title: action === "rejected" ? "Commutation Request Rejected" : "Commutation Request Forwarded",
        message: notifMsg
      });

      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: "Administrator",
        action: actionLog,
        description: descriptionLog,
        employee_id: req.employee_id
      });

      toast.success(action === "forward" ? "Request forwarded successfully." : "Request rejected.");
      setModalOpen(false);
      fetchRequests();
    } catch (err) {
      toast.error(`Action failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_ra":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 text-2xs font-bold uppercase tracking-wider">Awaiting Dean Approval</Badge>;
      case "pending_hr_forward":
        return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 text-2xs font-bold uppercase tracking-wider">Pending HR Forwarding</Badge>;
      case "pending_noted":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 text-2xs font-bold uppercase tracking-wider">Awaiting VP Admin</Badge>;
      case "pending_approved_by":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 text-2xs font-bold uppercase tracking-wider">Awaiting Final Approval</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-2xs font-bold uppercase tracking-wider">Fully Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 text-2xs font-bold uppercase tracking-wider">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 text-2xs font-bold uppercase tracking-wider">{status}</Badge>;
    }
  };

  const snapshot = selectedReq?.commutation_snapshot || {};
  const sick = snapshot.sick || { allocated: 0, nonCommutableDays: 0, commutableDays: 0, used: 0, unused: 0 };
  const vacation = snapshot.vacation || { allocated: 0, nonCommutableDays: 0, commutableDays: 0, used: 0, unused: 0 };
  const family = snapshot.family || { allocated: 0, nonCommutableDays: 0, commutableDays: 0, used: 0, unused: 0 };
  const force = snapshot.force || null;
  const total = snapshot.total || { allocated: 0, nonCommutableDays: 0, commutableDays: 0, used: 0, unused: 0 };
  const colSpanCount = force ? 5 : 4;

  const raSigner = allEmployees.find(e => e.id === selectedReq?.ra_id);
  const notedSigner = allEmployees.find(e => e.id === selectedReq?.noted_by_id);
  const approvedSigner = allEmployees.find(e => e.id === selectedReq?.approved_by_id);

  const getApproverName = (id) => {
    if (!id) return "Pending Assignment";
    const found = allEmployees.find(e => e.id === id);
    return found ? `${found.first_name} ${found.last_name}` : "Pending Assignment";
  };

  return (
    <div className="space-y-4 w-full">
      {isLoading ? (
        <div className="text-center p-8 text-slate-400 text-xs font-semibold">Loading commutation requests...</div>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none bg-slate-50/50 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <RefreshCw className="w-12 h-12 mb-3 opacity-20 text-[#0C005F]" />
            <p className="font-bold text-base text-slate-600">No commutation requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredRequests.map((req) => (
            <Card key={req.id} className="overflow-hidden shadow-none rounded-xl border border-slate-200 bg-white hover:border-[#0C005F] transition-all group">
              <CardHeader className="bg-slate-50/50 group-hover:bg-blue-50/20 transition-colors pb-3 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                    {req.employees?.photo_url ? (
                      <img src={req.employees.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-600">
                        {req.employees?.first_name?.[0]}{req.employees?.last_name?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2 flex-wrap">
                      {req.employees?.first_name} {req.employees?.last_name}
                      {getStatusBadge(req.status)}
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-xs text-slate-500 font-medium">
                      {req.employees?.employee_id || "—"} • {req.employees?.department || "—"}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Filed on {format(new Date(req.created_at || new Date()), "MMM d, yyyy h:mm a")}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3.5">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      Commutation Request: <span className="text-[#0C005F] font-bold">Monetization of Unused Leave Credits</span>
                    </p>
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                      <p className="text-2xs font-bold text-[#0C005F] uppercase tracking-wider mb-1">
                        APPLICATION DETAILS
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Employee submitted a request to commute unused leave credits. Review clearance status and process computation details.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-center">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenReviewModal(req)}
                      className="h-8 bg-[#0C005F] hover:bg-[#0C005F]/90 text-white font-bold text-xs gap-1.5 px-3 rounded-lg shadow-none"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review Application
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Commutation Review Modal */}
      {selectedReq && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl">
            {/* Minimal Header without Title/Subtitle text */}
            <div className="bg-[#0C005F] h-12 flex items-center justify-between px-6 relative">
              <DialogTitle className="sr-only">Commutation Application Review</DialogTitle>
              <DialogDescription className="sr-only">Commutation of Unused Leave Credits</DialogDescription>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Employee Info Banner */}
              <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300 shrink-0">
                  {selectedReq.employees?.photo_url ? (
                    <img src={selectedReq.employees.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-base text-slate-900">
                    {selectedReq.employees?.first_name} {selectedReq.employees?.last_name}
                  </p>
                  <p className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider mt-0.5">
                    {selectedReq.employees?.employee_id} • {selectedReq.employees?.department} • {selectedReq.employees?.position}
                  </p>
                </div>
                {getStatusBadge(selectedReq.status)}
              </div>

              <div className="text-center space-y-1 pb-3 border-b border-slate-200">
                <div className="font-bold text-slate-800 text-xs tracking-wide">
                  <span className="font-extrabold text-[#0C005F]">{selectedReq.employees?.first_name} {selectedReq.employees?.last_name}</span> of <span className="font-extrabold text-[#0C005F]">{selectedReq.employees?.department}</span> hereby applies for the commutation of unused sick/vacation/forced benefits.
                </div>
                <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">
                  Route Match: {resolvedCondition || "Loading match..."}
                </div>
              </div>

              {/* Commutation Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold text-center">
                      <th className="p-2.5 text-left w-1/4"></th>
                      <th className="p-2.5 border-l border-slate-200">Sick Leave</th>
                      <th className="p-2.5 border-l border-slate-200">Vacation Leave</th>
                      <th className="p-2.5 border-l border-slate-200">Family Leave</th>
                      {force && <th className="p-2.5 border-l border-slate-200">Force Leave</th>}
                      <th className="p-2.5 border-l border-slate-200 font-extrabold text-[#0C005F]">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-900 text-center">
                    <tr>
                      <td className="p-2 text-left font-bold text-slate-800 bg-slate-50">Number of Days Allocated</td>
                      <td className="p-2 border-l border-slate-100">{sick.allocated}</td>
                      <td className="p-2 border-l border-slate-100">{vacation.allocated}</td>
                      <td className="p-2 border-l border-slate-100">{family.allocated}</td>
                      {force && <td className="p-2 border-l border-slate-100">{force.allocated}</td>}
                      <td className="p-2 border-l border-slate-100 font-extrabold text-slate-900 bg-slate-50">{total.allocated}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-left font-bold text-slate-800 bg-slate-50">Number of Non-Commutable Days</td>
                      <td className="p-2 border-l border-slate-100">{sick.nonCommutableDays}</td>
                      <td className="p-2 border-l border-slate-100">{vacation.nonCommutableDays}</td>
                      <td className="p-2 border-l border-slate-100">{family.nonCommutableDays}</td>
                      {force && <td className="p-2 border-l border-slate-100">{force.nonCommutableDays}</td>}
                      <td className="p-2 border-l border-slate-100 font-extrabold text-slate-900 bg-slate-50">{total.nonCommutableDays}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-left font-bold text-slate-800 bg-slate-50">Number of Days Commutable</td>
                      <td className="p-2 border-l border-slate-100 text-amber-700 font-extrabold">{sick.commutableDays}</td>
                      <td className="p-2 border-l border-slate-100 text-amber-700 font-extrabold">{vacation.commutableDays}</td>
                      <td className="p-2 border-l border-slate-100 text-amber-700 font-extrabold">{family.commutableDays}</td>
                      {force && <td className="p-2 border-l border-slate-100 text-amber-700 font-extrabold">{force.commutableDays}</td>}
                      <td className="p-2 border-l border-slate-100 font-extrabold text-amber-800 bg-slate-50">{total.commutableDays}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-left font-bold text-slate-800 bg-slate-50">Number of Used Leave</td>
                      <td className="p-2 border-l border-slate-100">{sick.used}</td>
                      <td className="p-2 border-l border-slate-100">{vacation.used}</td>
                      <td className="p-2 border-l border-slate-100">{family.used}</td>
                      {force && <td className="p-2 border-l border-slate-100">{force.used}</td>}
                      <td className="p-2 border-l border-slate-100 font-extrabold text-slate-900 bg-slate-50">{total.used}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 text-left font-bold text-slate-800 bg-slate-50">Number of Unused Leave</td>
                      <td className="p-2 border-l border-slate-100 text-emerald-700 font-extrabold">{sick.unused}</td>
                      <td className="p-2 border-l border-slate-100 text-emerald-700 font-extrabold">{vacation.unused}</td>
                      <td className="p-2 border-l border-slate-100 text-emerald-700 font-extrabold">{family.unused}</td>
                      {force && <td className="p-2 border-l border-slate-100 text-emerald-700 font-extrabold">{force.unused}</td>}
                      <td className="p-2 border-l border-slate-100 font-extrabold text-emerald-800 bg-slate-50">{total.unused}</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold text-left">
                      <td className="p-2 text-slate-900">Total Number of Days of Commutation</td>
                      <td colSpan={colSpanCount} className="p-2 border-l border-slate-100 font-black text-slate-900 text-xs">
                        {selectedReq.total_days} Days
                      </td>
                    </tr>
                    {selectedReq.hours_per_day && !selectedReq.teaching_days && (
                      <tr className="bg-slate-50 font-bold text-left">
                        <td className="p-2 text-slate-900">Hours Per Day</td>
                        <td colSpan={colSpanCount} className="p-2 border-l border-slate-100 font-black text-slate-900 text-xs">
                          {selectedReq.hours_per_day} Hours
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {selectedReq.teaching_days && (
                <div className="p-4 border border-slate-200 bg-white rounded-xl text-xs space-y-2">
                  <h4 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">FOR TEACHING LOAD DETAILS:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">Hours Per Day</span>
                      <span className="font-extrabold text-slate-900">{selectedReq.hours_per_day} Hours</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">Total Days (For Commutation)</span>
                      <span className="font-extrabold text-slate-900">{selectedReq.teaching_days} Days</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Signatures Status */}
              <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs">
                  <div className="flex flex-col items-center justify-end h-28">
                    {selectedReq.employees?.signature_url ? (
                      <img src={selectedReq.employees.signature_url} alt="Signature" className="h-12 object-contain mb-2" />
                    ) : (
                      <div className="h-8 flex items-center justify-center italic text-slate-500 text-[10px] font-bold">Signed Digitally</div>
                    )}
                    <div className="border-t border-slate-400 w-64 pt-1 font-extrabold text-slate-900">
                      {selectedReq.employees?.first_name} {selectedReq.employees?.last_name}
                    </div>
                    <div className="text-[10px] text-slate-600 font-semibold">Employee's Signature</div>
                  </div>

                  {selectedReq.ra_id && (
                    <div className="flex flex-col items-center justify-end h-28">
                      {selectedReq.ra_approved ? (
                        <div className="flex flex-col items-center mb-1">
                          {raSigner?.signature_url ? (
                            <img src={raSigner.signature_url} alt="Signature" className="h-10 object-contain" />
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[9px] hover:bg-emerald-100 font-bold border-none uppercase py-0.5 px-2 mb-1 shadow-none">Stamps APPROVED</Badge>
                          )}
                          <span className="text-[9px] text-slate-600 font-bold">Signed on {format(new Date(selectedReq.ra_approved_at), "MM/dd/yyyy")}</span>
                        </div>
                      ) : (
                        <div className="h-12 flex items-center justify-center text-amber-600 font-bold italic text-[10px]">Awaiting Recommending Approval</div>
                      )}
                      <div className="border-t border-slate-400 w-64 pt-1 font-extrabold text-slate-900">
                        {getApproverName(selectedReq.ra_id)}
                      </div>
                      <div className="text-[10px] text-slate-600 font-semibold">Dean / Office Head (Recommending Approval)</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-200">
                  {selectedReq.noted_by_id && (
                    <div className="flex flex-col items-center justify-end h-28">
                      {selectedReq.noted_approved ? (
                        <div className="flex flex-col items-center mb-1">
                          {notedSigner?.signature_url ? (
                            <img src={notedSigner.signature_url} alt="Signature" className="h-10 object-contain" />
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[9px] hover:bg-emerald-100 font-bold border-none uppercase py-0.5 px-2 mb-1 shadow-none">Stamps NOTED</Badge>
                          )}
                          <span className="text-[9px] text-slate-600 font-bold">Noted on {format(new Date(selectedReq.noted_approved_at), "MM/dd/yyyy")}</span>
                        </div>
                      ) : (
                        <div className="h-12 flex items-center justify-center text-amber-600 font-bold italic text-[10px]">Awaiting Noting</div>
                      )}
                      <div className="border-t border-slate-400 w-64 pt-1 font-extrabold text-slate-900">
                        {getApproverName(selectedReq.noted_by_id)}
                      </div>
                      <div className="text-[10px] text-slate-600 font-semibold">Vice President for Administration (Noted By)</div>
                    </div>
                  )}

                  <div className="flex flex-col items-center justify-end h-28">
                    {selectedReq.final_approved ? (
                      <div className="flex flex-col items-center mb-1">
                        {approvedSigner?.signature_url ? (
                          <img src={approvedSigner.signature_url} alt="Signature" className="h-10 object-contain" />
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[9px] hover:bg-emerald-100 font-bold border-none uppercase py-0.5 px-2 mb-1 shadow-none">Stamps APPROVED</Badge>
                        )}
                        <span className="text-[9px] text-slate-600 font-bold">Approved on {format(new Date(selectedReq.final_approved_at), "MM/dd/yyyy")}</span>
                      </div>
                    ) : (
                      <div className="h-12 flex items-center justify-center text-amber-600 font-bold italic text-[10px]">Awaiting Final Approval</div>
                    )}
                    <div className="border-t border-slate-400 w-64 pt-1 font-extrabold text-slate-900">
                      {getApproverName(selectedReq.approved_by_id)}
                    </div>
                    <div className="text-[10px] text-slate-600 font-semibold">Approved By</div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              {selectedReq.status === "pending_hr_forward" && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button 
                    type="button"
                    variant="destructive"
                    disabled={isProcessing}
                    onClick={() => handleAction(selectedReq, "rejected")}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Reject Request
                  </Button>
                  <Button 
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleAction(selectedReq, "forward")}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 text-white"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Forward Request
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
