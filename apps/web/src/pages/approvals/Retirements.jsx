import { useState, useEffect } from "react";
import { Check, X, Search, Filter, Award, ChevronDown, ChevronUp } from "lucide-react";
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

function computeAge(birthdate) {
  if (!birthdate) return 0;
  const start = new Date(birthdate);
  const ref = new Date();
  if (isNaN(start.getTime())) return 0;
  let years = ref.getFullYear() - start.getFullYear();
  const m = ref.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < start.getDate())) years--;
  return Math.max(0, years);
}

export default function Retirements() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const { counts, searchQuery, statusFilter } = useOutletContext();

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("retirement_requests")
        .select(`*, employees ( id, first_name, last_name, employee_id, department, position, photo_url, contact_email, contact_phone, birthdate )`)
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
      .channel("retirement_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "retirement_requests" },
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
        .from("retirement_requests")
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
        title: `Retirement Request ${action.toUpperCase()}`,
        message: `Your Retirement request has been ${action} by HR.`
      });

      // Admin log
      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: "Administrator",
        action: action === "approved" ? "admin_toggled_employee_status" : "admin_rejected_update",
        description: `${action === "approved" ? "Approved" : "Rejected"} Retirement Request for ${req.employees?.first_name} ${req.employees?.last_name}`,
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
      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Loading retirement requests...</div>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Award className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium text-lg">No retirement requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((req) => {
            const isExpanded = expandedId === req.id;
            const empAge = computeAge(req.employees?.birthdate);
            const filingDateStr = req.created_at ? format(new Date(req.created_at), "yyyy-MM-dd") : "—";

            return (
              <Card key={req.id} className="overflow-hidden hover:shadow-md transition-all">
                <CardHeader className="bg-muted/30 pb-3 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleExpand(req.id)}>
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
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(req.id)}
                      className="h-8 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1"
                    >
                      {isExpanded ? (
                        <>
                          Less <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          More <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 flex flex-col space-y-4">
                  {/* Collapsed short statement preview */}
                  {!isExpanded && (
                    <div className="text-xs text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                      <span className="font-bold text-slate-800 mr-1.5">Statement:</span>
                      <span className="italic">{req.statement}</span>
                    </div>
                  )}

                  {/* Expanded full details breakdown matching Image #2 */}
                  {isExpanded && (
                    <div className="space-y-4 border-t pt-3 animate-in fade-in-50 duration-200">
                      <p className="text-xs text-slate-500">Details for formal statement of retirement.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <Label className="font-bold text-slate-500 uppercase">Employee ID</Label>
                          <Input value={req.employees?.employee_id || "—"} disabled className="h-9 bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-bold text-slate-500 uppercase">Full Name</Label>
                          <Input value={`${req.employees?.first_name || ""} ${req.employees?.last_name || ""}`} disabled className="h-9 bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-bold text-slate-500 uppercase">Email</Label>
                          <Input value={req.employees?.contact_email || "—"} disabled className="h-9 bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-bold text-slate-500 uppercase">Phone Number</Label>
                          <Input value={req.employees?.contact_phone || "—"} disabled className="h-9 bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-bold text-slate-500 uppercase">Filing Date</Label>
                          <Input value={filingDateStr} disabled className="h-9 bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-bold text-slate-500 uppercase">Employee Age</Label>
                          <Input value={`${empAge} Years Old`} disabled className="h-9 bg-slate-50 text-emerald-600 font-bold" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Statement of Retirement</Label>
                        <Textarea
                          value={req.statement || ""}
                          readOnly
                          disabled
                          className="min-h-[100px] border-slate-200 text-sm bg-slate-50/50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions for pending requests */}
                  {req.status === "pending" && (
                    <div className="flex items-center gap-2 pt-2 self-end shrink-0 w-full sm:w-auto">
                      <Button
                        size="sm"
                        onClick={() => handleAction(req, "approved")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-1 sm:flex-initial gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve & Retire
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
            );
          })}
        </div>
      )}
    </div>
  );
}
