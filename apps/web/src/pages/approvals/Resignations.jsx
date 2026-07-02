import { useState, useEffect } from "react";
import { Check, X, Search, Filter, LogOut } from "lucide-react";
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

export default function Resignations() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { counts, searchQuery, statusFilter } = useOutletContext();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("resignation_requests")
        .select(`*, employees ( id, first_name, last_name, employee_id, department, position, photo_url )`)
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

      // 2. If approved, archive employee (is_active = false)
      if (action === "approved") {
        const { error: empError } = await supabase
          .from("employees")
          .update({ is_active: false })
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
      fetchRequests();
    } catch (err) {
      toast.error(`Action failed: ${err.message}`);
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

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1440px] mx-auto">
      {/* Search & Filter Bar is now rendered at layout level */}

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
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs max-w-md bg-slate-50 p-3 rounded-xl border">
                  <div>
                    <span className="text-slate-400 uppercase font-bold">Filing Date:</span>
                    <p className="font-semibold text-slate-700">{format(new Date(req.created_at), "MMMM d, yyyy")}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold">Proposed Final Work Day:</span>
                    <p className="font-semibold text-red-600">{format(new Date(req.final_work_day + "T00:00:00"), "MMMM d, yyyy")}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">Statement of Resignation:</span>
                  <p className="whitespace-pre-line leading-relaxed italic">{req.statement}</p>
                </div>

                {req.status === "pending" && (
                  <div className="flex items-center gap-2 pt-2 self-end shrink-0 w-full sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => handleAction(req, "approved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-1 sm:flex-initial gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve & Archive
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(req, "rejected")}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold flex-1 sm:flex-initial gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
