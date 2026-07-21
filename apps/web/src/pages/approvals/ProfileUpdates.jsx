import { useState, useEffect } from "react";
import { CheckSquare, Check, X, Clock, Search, Filter, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import E201Modal from "@/components/employees/E201Modal";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import ApprovalsTabs from "@/components/approvals/ApprovalsTabs";

export default function ProfileUpdates() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { counts, searchQuery, statusFilter } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();

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
      fetchRequests();
    } catch (err) {
      toast.error(`Failed to ${status} request: ${err.message}`);
    }
  };

  const handleDelete = async (req) => {
    try {
      const empName = `${req.employees?.first_name || ''} ${req.employees?.last_name || ''}`;
      const label = `${empName.trim() || 'Unknown Employee'} - Profile Update Request`;

      // 1. Snapshot request to bin
      const { error: binError } = await supabase
        .from('bin')
        .insert({
          record_type: 'profile_update',
          record_id: req.id,
          record_data: req,
          label: label
        });

      if (binError) throw binError;

      // 2. Delete request from source table
      const { error: deleteError } = await supabase
        .from('employee_update_requests')
        .delete()
        .eq('id', req.id);

      if (deleteError) throw deleteError;

      // 3. Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: 'admin_toggled_employee_status', // fallback action
        description: `Moved Profile Update Request for ${empName} to Bin`,
        employee_id: req.employee_id
      });

      toast.success("Request moved to Bin.");
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to delete request: ${err.message}`);
    }
  };

  const handleViewRegistrant = (emp) => {
    setSelectedRegistrant(emp);
    setModalOpen(true);
  };

  // Filter and search logic
  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const fullName = `${req.employees?.first_name || ''} ${req.employees?.last_name || ''}`.toLowerCase();
    const empId = (req.employees?.employee_id || '').toLowerCase();
    const dept = (req.employees?.department || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || fullName.includes(query) || empId.includes(query) || dept.includes(query);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-4 w-full">
      {/* Search & Filter Bar is now rendered at layout level */}

      {isLoading ? (
        <div className="text-center p-8 text-slate-400 text-xs font-semibold">Loading requests...</div>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none bg-slate-50/50 rounded-xl">
           <CardContent className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <CheckSquare className="w-12 h-12 mb-3 opacity-20 text-[#0C005F]" />
              <p className="font-bold text-base text-slate-600">
                {requests.length === 0 ? "No requests found" : "No matching requests"}
              </p>
              <p className="text-xs">
                {requests.length === 0 ? "You are all caught up!" : "Try adjusting your search or filter."}
              </p>
           </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredRequests.map((req) => (
            <Card key={req.id} className="overflow-hidden cursor-pointer hover:border-[#0C005F] transition-all shadow-none rounded-xl border border-slate-200 bg-white group" onClick={() => handleViewRegistrant({ ...req.employees, pendingRequests: [req] })}>
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
                         {req.status === 'pending' && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 text-2xs font-bold uppercase tracking-wider">Pending</Badge>}
                         {req.status === 'approved' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-2xs font-bold uppercase tracking-wider">Approved</Badge>}
                         {req.status === 'rejected' && <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 text-2xs font-bold uppercase tracking-wider">Rejected</Badge>}
                      </CardTitle>
                      <CardDescription className="mt-0.5 text-xs text-slate-500 font-medium">
                         {req.employees?.employee_id || "—"} • {req.employees?.department || "—"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Requested on {format(new Date(req.created_at || new Date()), "MMM d, yyyy h:mm a")}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3.5">
                   <div className="flex flex-col md:flex-row gap-5">
                     <div className="flex-1 space-y-2">
                        <p className="text-xs font-semibold text-slate-700">Modification: <span className="text-[#0C005F] font-bold">Profile Information Update</span></p>
                        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                           <p className="text-2xs font-bold text-[#0C005F] uppercase tracking-wider mb-1">Changes Submitted</p>
                           <p className="text-xs text-slate-500 leading-relaxed font-medium">
                             The employee has submitted a batch update to their profile information. Review the details or approve to apply all changes.
                           </p>
                        </div>
                     </div>
                      {req.status === 'pending' ? (
                         <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-center" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" onClick={() => handleUpdateAction(req, 'approved')} className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-none">
                               <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleUpdateAction(req, 'rejected')} className="h-8 text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 rounded-lg font-bold shadow-none">
                               <X className="w-3.5 h-3.5" /> Reject
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(req)} className="h-8 text-xs gap-1.5 text-rose-600 border-rose-200 hover:text-white hover:bg-rose-600 rounded-lg font-bold shadow-none">
                               <Trash2 className="w-3.5 h-3.5" /> Delete
                            </Button>
                         </div>
                      ) : (
                         <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-center" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(req)} className="h-8 text-xs gap-1.5 text-rose-600 border-rose-200 hover:text-white hover:bg-rose-600 rounded-lg font-bold shadow-none">
                               <Trash2 className="w-3.5 h-3.5" /> Delete
                            </Button>
                         </div>
                      )}
                   </div>
                </CardContent>
            </Card>
          ))}
        </div>
      )}

      <E201Modal
        employee={selectedRegistrant}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onToggleActive={() => {}}
        onSave={() => fetchRequests()}
      />
    </div>
  );
}
