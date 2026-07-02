import { useState, useEffect } from "react";
import { Check, X, Search, Filter, RefreshCw } from "lucide-react";
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
  const { counts, searchQuery, statusFilter } = useOutletContext();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("commutation_requests")
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
      const { error } = await supabase
        .from("commutation_requests")
        .update({
          status: action,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", req.id);

      if (error) throw error;

      // Notify the employee
      await supabase.from("notifications").insert({
        employee_id: req.employee_id,
        type: action === "approved" ? "approved" : "rejected",
        title: `Commutation Request ${action.toUpperCase()}`,
        message: `Your request for Commutation of Leave Credits has been ${action} by HR.`
      });

      // Admin log
      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: "Administrator",
        action: action === "approved" ? "admin_approved_update" : "admin_rejected_update",
        description: `${action === "approved" ? "Approved" : "Rejected"} Commutation Request for ${req.employees?.first_name} ${req.employees?.last_name}`,
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
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Request:</span> Commutation of remaining commutable leave balance.
                </div>
                {req.status === "pending" && (
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => handleAction(req, "approved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-1 sm:flex-initial gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
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
