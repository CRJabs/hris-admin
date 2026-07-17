import { useState, useEffect } from "react";
import { CheckSquare, Check, X, Clock, Search, Filter, Trash2, Eye, User, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function formatFieldLabel(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function ProfileUpdates() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { counts, searchQuery, statusFilter } = useOutletContext();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data: updateData, error: updateError } = await supabase
        .from('employee_update_requests')
        .select(`*, employees (*)`)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!updateError) setRequests(updateData || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    const reqSub = supabase.channel('profile_updates_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_update_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      reqSub.unsubscribe();
    };
  }, []);

  const handleUpdateAction = async (req, status) => {
    setIsProcessing(true);
    try {
      if (status === 'approved') {
        // Sanitize changes: convert empty strings to nulls for DB compatibility
        const sanitizedChanges = Object.fromEntries(
          Object.entries(req.requested_changes).map(([key, value]) => [
            key,
            value === "" ? null : value
          ])
        );

        const { error: updateError } = await supabase
          .from('employees')
          .update(sanitizedChanges)
          .eq('id', req.employee_id);
          
        if (updateError) throw updateError;
      }

      const { error } = await supabase
        .from('employee_update_requests')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', req.id);

      if (error) throw error;

      // Notify the employee
      await supabase.from('notifications').insert({
        employee_id: req.employee_id,
        type: status === 'approved' ? 'approved' : 'rejected',
        title: `Profile Update ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: status === 'approved' 
          ? "Your profile update request has been approved and applied." 
          : "Your profile update request was rejected by the HR administration."
      });

      // Log to admin activity
      const empName = `${req.employees?.first_name} ${req.employees?.last_name}`;
      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: status === 'approved' ? 'admin_approved_update' : 'admin_rejected_update',
        description: `${status === 'approved' ? 'Approved' : 'Rejected'} profile update for ${empName}`,
        employee_id: req.employee_id,
        metadata: { request_id: req.id }
      });

      // Recalculate benefits eligibility for this employee if approved
      if (status === 'approved') {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await fetch('/api/run-benefits-computation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token ?? ''}`,
            },
            body: JSON.stringify({ employee_id: req.employee_id, year: new Date().getFullYear() }),
          });
        } catch (e) {
          console.warn('Benefits recalculation failed:', e);
        }
      }

      toast.success(`Request ${status} successfully.`);
      setModalOpen(false);
      fetchRequests();
    } catch (err) {
      toast.error(`Failed to ${status} request: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (req) => {
    try {
      const empName = `${req.employees?.first_name || ''} ${req.employees?.last_name || ''}`;
      const label = `${empName.trim() || 'Unknown Employee'} - Profile Update Request`;

      const { error: binError } = await supabase
        .from('bin')
        .insert({
          record_type: 'profile_update',
          record_id: req.id,
          record_data: req,
          label: label
        });

      if (binError) throw binError;

      const { error: deleteError } = await supabase
        .from('employee_update_requests')
        .delete()
        .eq('id', req.id);

      if (deleteError) throw deleteError;

      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: 'admin_toggled_employee_status',
        description: `Moved Profile Update Request for ${empName} to Bin`,
        employee_id: req.employee_id
      });

      toast.success("Request moved to Bin.");
      setModalOpen(false);
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to delete request: ${err.message}`);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const fullName = `${req.employees?.first_name || ''} ${req.employees?.last_name || ''}`.toLowerCase();
    const empId = (req.employees?.employee_id || '').toLowerCase();
    const dept = (req.employees?.department || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || fullName.includes(query) || empId.includes(query) || dept.includes(query);
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
  const requestedChanges = selectedReq?.requested_changes || {};

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1440px] mx-auto">
      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Loading requests...</div>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/10">
           <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <CheckSquare className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-lg">
                {requests.length === 0 ? "No requests found" : "No matching requests"}
              </p>
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
                       Requested on {format(new Date(req.created_at || new Date()), "MMM d, yyyy")}
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

      {/* Profile Update Review Modal */}
      {selectedReq && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl">
            {/* Header */}
            <div className="bg-[#0C005F] p-6 text-white pr-12 relative">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-300" />
                Profile Update Review
              </DialogTitle>
              <DialogDescription className="text-white/60 text-xs mt-1 uppercase tracking-widest font-medium">
                BATCH PROFILE INFORMATION UPDATE
              </DialogDescription>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Employee Info Banner */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                  {emp.photo_url ? (
                    <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    {emp.employee_id} • {emp.department} • {emp.position}
                  </p>
                </div>
                {getStatusBadge(selectedReq.status)}
              </div>

              {/* Requested Changes Breakdown */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Requested Changes ({Object.keys(requestedChanges).length} fields)
                </p>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm text-xs">
                  {Object.entries(requestedChanges).map(([key, newVal]) => {
                    const currentVal = emp[key] ?? "—";
                    const displayNew = newVal === "" || newVal === null ? "(Empty / Remove)" : String(newVal);

                    return (
                      <div key={key} className="p-3.5 grid grid-cols-3 gap-2 items-center">
                        <div className="font-bold text-slate-700">{formatFieldLabel(key)}</div>
                        <div className="text-slate-400 text-[11px] truncate">
                          Current: <span className="font-medium text-slate-600">{String(currentVal)}</span>
                        </div>
                        <div className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 w-fit">
                          {displayNew}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isProcessing}
                  onClick={() => handleDelete(selectedReq)}
                  className="text-red-600 border-red-200 hover:bg-red-50 font-semibold gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Move to Bin
                </Button>

                {selectedReq.status === "pending" && (
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isProcessing}
                      onClick={() => handleUpdateAction(selectedReq, "rejected")}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Reject
                    </Button>
                    <Button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleUpdateAction(selectedReq, "approved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve & Apply
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
