import { useState, useEffect } from "react";
import { Check, X, Search, Filter, LogOut, Eye, User, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

export default function Resignations() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { counts, searchQuery, statusFilter } = useOutletContext();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("resignation_requests")
        .select(`*, employees ( id, first_name, last_name, employee_id, department, position, photo_url, contact_email, contact_phone )`)
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

    const sub = supabase
      .channel("resignation_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resignation_requests" },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, []);

  const handleAction = async (req, action) => {
    setIsProcessing(true);
    try {
      // 1. Update status
      const { error } = await supabase
        .from("resignation_requests")
        .update({
          status: action,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", req.id);

      if (error) throw error;

      // 2. If approved, archive employee (is_active = false) & set classification_iii = Resigned
      if (action === "approved") {
        const { error: empError } = await supabase
          .from("employees")
          .update({ is_active: false, classification_iii: "Resigned" })
          .eq("id", req.employee_id);
        if (empError) throw empError;
      }

      // Notify the employee
      await supabase.from("notifications").insert({
        employee_id: req.employee_id,
        type: action === "approved" ? "approved" : "rejected",
        title: `Resignation Request ${action.toUpperCase()}`,
        message: `Your Resignation notice has been ${action} by HR.`
      });

      // Admin log
      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: "Administrator",
        action: action === "approved" ? "admin_toggled_employee_status" : "admin_rejected_update",
        description: `${action === "approved" ? "Approved" : "Rejected"} Resignation Request for ${req.employees?.first_name} ${req.employees?.last_name}`,
        employee_id: req.employee_id
      });

      toast.success(`Request ${action} successfully.`);
      setModalOpen(false);
      fetchRequests();
    } catch (err) {
      toast.error(`Action failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const fullName = `${req.employees?.first_name || ""} ${req.employees?.last_name || ""}`.toLowerCase();
    const empId = (req.employees?.employee_id || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || fullName.includes(query) || empId.includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">Pending</Badge>;
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">Approved</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">Rejected</Badge>;
    }
  };

  const emp = selectedReq?.employees || {};
  const filingDateStr = selectedReq?.created_at ? format(new Date(selectedReq.created_at), "yyyy-MM-dd") : "—";
  const finalWorkDayStr = selectedReq?.final_work_day ? format(new Date(selectedReq.final_work_day + "T00:00:00"), "yyyy-MM-dd") : "—";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1440px] mx-auto">
      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Loading resignation requests...</div>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <LogOut className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium text-lg">No resignation requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((req) => (
            <Card key={req.id} className="overflow-hidden hover:shadow-md transition-all">
              <CardHeader className="bg-muted/30 pb-3 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

                <div className="flex items-center gap-3 self-start sm:self-center">
                  {getStatusBadge(req.status)}
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Filed on {format(new Date(req.created_at), "MMM d, yyyy")}
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setSelectedReq(req);
                      setModalOpen(true);
                    }}
                    className="h-8 bg-[#0C005F] hover:bg-[#0C005F]/90 text-white font-bold text-xs gap-1.5 px-3 rounded-lg"
                  >
                    <Eye className="w-3.5 h-3.5" /> Review Application
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Resignation Review Modal */}
      {selectedReq && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
            {/* Minimal Header without Title/Subtitle text */}
            <div className="bg-[#0C005F] h-12 flex items-center justify-between px-6 relative">
              <DialogTitle className="sr-only">Resignation Application Review</DialogTitle>
              <DialogDescription className="sr-only">Statement of Resignation</DialogDescription>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Employee Info Banner */}
              <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300 shrink-0">
                  {emp.photo_url ? (
                    <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-base text-slate-900">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider mt-0.5">
                    {emp.employee_id} • {emp.department} • {emp.position}
                  </p>
                </div>
                {getStatusBadge(selectedReq.status)}
              </div>

              {/* 6-Field Info Grid with dark bold typography */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-800 uppercase text-[11px]">Employee ID</Label>
                  <Input value={emp.employee_id || "—"} disabled readOnly className="h-9 bg-slate-50 border-slate-200 text-slate-900 font-bold text-sm opacity-100 disabled:opacity-100 disabled:text-slate-900" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-800 uppercase text-[11px]">Full Name</Label>
                  <Input value={`${emp.first_name || ""} ${emp.last_name || ""}`} disabled readOnly className="h-9 bg-slate-50 border-slate-200 text-slate-900 font-bold text-sm opacity-100 disabled:opacity-100 disabled:text-slate-900" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-800 uppercase text-[11px]">Email</Label>
                  <Input value={emp.contact_email || "—"} disabled readOnly className="h-9 bg-slate-50 border-slate-200 text-slate-900 font-bold text-sm opacity-100 disabled:opacity-100 disabled:text-slate-900" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-800 uppercase text-[11px]">Phone Number</Label>
                  <Input value={emp.contact_phone || "—"} disabled readOnly className="h-9 bg-slate-50 border-slate-200 text-slate-900 font-bold text-sm opacity-100 disabled:opacity-100 disabled:text-slate-900" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-800 uppercase text-[11px]">Filing Date</Label>
                  <Input value={filingDateStr} disabled readOnly className="h-9 bg-slate-50 border-slate-200 text-slate-900 font-bold text-sm opacity-100 disabled:opacity-100 disabled:text-slate-900" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-800 uppercase text-[11px]">Final Work Day</Label>
                  <Input value={finalWorkDayStr} disabled readOnly className="h-9 bg-slate-50 border-slate-200 text-indigo-700 font-bold text-sm opacity-100 disabled:opacity-100 disabled:text-indigo-700" />
                </div>
              </div>

              {/* Statement of Resignation */}
              <div className="space-y-1.5">
                <Label className="font-bold text-slate-800 uppercase text-[11px]">Statement of Resignation</Label>
                <Textarea
                  value={selectedReq.statement || ""}
                  readOnly
                  disabled
                  className="min-h-[110px] border-slate-200 text-sm font-bold text-slate-900 bg-slate-50/80 opacity-100 disabled:opacity-100 disabled:text-slate-900"
                />
              </div>

              {/* Action Footer */}
              {selectedReq.status === "pending" && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isProcessing}
                    onClick={() => handleAction(selectedReq, "rejected")}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Reject
                  </Button>
                  <Button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleAction(selectedReq, "approved")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Approve & Archive
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
