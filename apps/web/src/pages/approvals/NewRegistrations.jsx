import { useState, useEffect } from "react";
import { Check, X, UserPlus, Eye, Search, Filter, Trash2, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import E201Modal from "@/components/employees/E201Modal";
import { useOutletContext } from "react-router-dom";
import ApprovalsTabs from "@/components/approvals/ApprovalsTabs";

export default function NewRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { counts, searchQuery, statusFilter } = useOutletContext();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const { data: regData, error: regError } = await supabase
        .from('employees')
        .select('*')
        .or(`employment_status.eq.Pending,created_at.gte.${oneYearAgo}`)
        .order('created_at', { ascending: false });

      if (!regError) {
        setRegistrations(regData || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    const empSub = supabase.channel('new_registrations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      empSub.unsubscribe();
    };
  }, []);

  const handleRegistrationAction = async (emp, action) => {
    try {
      if (action === 'approved') {
        const { error } = await supabase
          .from('employees')
          .update({ 
            is_active: true, 
            employment_status: emp.employment_status === 'Pending' ? 'Fulltime' : emp.employment_status,
            employment_tenure: 'Probationary'
          })
          .eq('id', emp.id);
        if (error) throw error;

        // Notify the employee (Welcome message)
        await supabase.from('notifications').insert({
          employee_id: emp.id,
          type: 'approved',
          title: "Welcome to UB HRIS",
          message: "Your registration has been approved! You can now access all features of the HRIS."
        });

        // Log to admin activity
        await supabase.from('admin_activity_log').insert({
          actor_type: 'admin',
          actor_name: 'Administrator',
          action: 'admin_approved_registration',
          description: `Approved registration for ${emp.first_name} ${emp.last_name}`,
          employee_id: emp.id
        });

        // Automatically compute initial benefits eligibility for the newly approved employee
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await fetch('/api/run-benefits-computation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token ?? ''}`,
            },
            body: JSON.stringify({ employee_id: emp.id, year: new Date().getFullYear() }),
          });
        } catch (e) {
          console.warn('Initial benefits calculation failed:', e);
        }

        toast.success(`Registration for ${emp.first_name} approved.`);
      } else {
        const { error } = await supabase
          .from('employees')
          .update({
            employment_status: 'Rejected',
            is_active: false
          })
          .eq('id', emp.id);
        if (error) throw error;

        // Log rejection
        await supabase.from('admin_activity_log').insert({
          actor_type: 'admin',
          actor_name: 'Administrator',
          action: 'admin_rejected_registration',
          description: `Rejected registration for ${emp.first_name} ${emp.last_name}`,
          employee_id: emp.id
        });
        toast.success(`Registration for ${emp.first_name} rejected.`);
      }
      setModalOpen(false);
      window.dispatchEvent(new CustomEvent('pending_counts_changed'));
      fetchRequests();
    } catch (err) {
      toast.error(`Failed to process registration: ${err.message}`);
    }
  };

  const handleDelete = async (emp) => {
    try {
      const empName = `${emp.first_name || ''} ${emp.last_name || ''}`;
      const label = `${empName.trim() || 'Unknown Registrant'} - New Registration`;

      // 1. Snapshot registration to bin
      const { error: binError } = await supabase
        .from('bin')
        .insert({
          record_type: 'registration',
          record_id: emp.id,
          record_data: emp,
          label: label
        });

      if (binError) throw binError;

      // 2. Delete registration from employees table
      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', emp.id);

      if (deleteError) throw deleteError;

      // 3. Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: 'admin_rejected_registration', // fallback action
        description: `Deleted pending registration for ${empName.trim()}`,
        employee_id: emp.id
      });

      toast.success(`Registration for ${empName.trim()} deleted.`);
      setRegistrations(prev => prev.filter(r => r.id !== emp.id));
      setModalOpen(false);
      window.dispatchEvent(new CustomEvent('pending_counts_changed'));
      fetchRequests();
    } catch (err) {
      toast.error(`Failed to delete registration: ${err.message}`);
    }
  };

  const handleViewRegistrant = (emp) => {
    setSelectedRegistrant(emp);
    setModalOpen(true);
  };

  // Determine registration status label
  const getStatusLabel = (emp) => {
    if (emp.employment_status === 'Pending') return 'pending';
    if (emp.employment_status === 'Rejected') return 'rejected';
    return 'approved';
  };

  const registrationPool = statusFilter === 'all'
    ? registrations
    : registrations.filter(emp => getStatusLabel(emp) === statusFilter);

  const filteredRegistrations = registrationPool.filter(emp => {
    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
    const empEmail = (emp.contact_email || emp.email || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const empId = (emp.employee_id || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return !query || fullName.includes(query) || empEmail.includes(query) || dept.includes(query) || empId.includes(query);
  });

  const pendingCount = registrations.filter(e => e.employment_status === 'Pending').length;

  return (
    <div className="space-y-4 w-full">
      {/* Search & Filter Bar is now rendered at layout level */}

      {isLoading ? (
        <div className="text-center p-8 text-slate-400 text-xs font-semibold">Loading registrations...</div>
      ) : filteredRegistrations.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none bg-slate-50/50 rounded-xl">
           <CardContent className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <UserPlus className="w-12 h-12 mb-3 opacity-20 text-[#0C005F]" />
              <p className="font-bold text-base text-slate-600">
                {pendingCount === 0 ? "No pending registrations" : "No matching registrations"}
              </p>
              <p className="text-xs">
                {pendingCount === 0 ? "No new applicants at the moment." : "Try adjusting your search or filter."}
              </p>
           </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredRegistrations.map((emp) => (
            <Card key={emp.id} className="overflow-hidden shadow-none rounded-xl border border-slate-200 bg-white hover:border-[#0C005F] transition-all group">
                <CardHeader className="bg-slate-50/50 group-hover:bg-blue-50/20 transition-colors pb-3 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                      {emp.photo_url ? (
                        <img src={emp.photo_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-600">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2 flex-wrap">
                         {emp.first_name} {emp.last_name}
                         {getStatusLabel(emp) === 'pending' && (
                           <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 text-2xs font-bold uppercase tracking-wider">Pending Registration</Badge>
                         )}
                         {getStatusLabel(emp) === 'approved' && (
                           <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-2xs font-bold uppercase tracking-wider">Approved</Badge>
                         )}
                         {getStatusLabel(emp) === 'rejected' && (
                           <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 text-2xs font-bold uppercase tracking-wider">Rejected</Badge>
                         )}
                      </CardTitle>
                      <CardDescription className="mt-0.5 text-xs text-slate-500 font-medium">
                         {emp.contact_email || emp.email || "No email"} • {emp.department || "No Department"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Requested on {format(new Date(emp.created_at || new Date()), "MMM d, yyyy h:mm a")}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3.5">
                   <div className="flex flex-col md:flex-row gap-5">
                     <div className="flex-1 space-y-2">
                        <p className="text-xs font-semibold text-slate-700">Registration: <span className="text-[#0C005F] font-bold">New Employee Registration</span></p>
                        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                           <p className="text-2xs font-bold text-[#0C005F] uppercase tracking-wider mb-1">Registration Details</p>
                           <p className="text-xs text-slate-500 leading-relaxed font-medium">
                             Position: <span className="font-semibold text-slate-700">{emp.position || "Staff"}</span> • Department: <span className="font-semibold text-slate-700">{emp.department || "General"}</span> • Email: <span className="font-semibold text-slate-700">{emp.contact_email || emp.email || "—"}</span>
                           </p>
                        </div>
                     </div>
                      <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-center">
                         <Button size="sm" variant="outline" onClick={() => handleViewRegistrant(emp)} className="h-8 text-xs gap-1.5 border-slate-200 rounded-lg font-bold shadow-none">
                            <Eye className="w-3.5 h-3.5" /> View Details
                         </Button>
                         {getStatusLabel(emp) === 'pending' && (
                           <>
                             <Button size="sm" onClick={() => handleRegistrationAction(emp, 'approved')} className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-none">
                                <Check className="w-3.5 h-3.5" /> Approve
                             </Button>
                             <Button size="sm" variant="outline" onClick={() => handleRegistrationAction(emp, 'rejected')} className="h-8 text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 rounded-lg font-bold shadow-none">
                                <X className="w-3.5 h-3.5" /> Reject
                             </Button>
                           </>
                         )}
                         <Button size="sm" variant="outline" onClick={() => handleDelete(emp)} className="h-8 text-xs gap-1.5 text-rose-600 border-rose-200 hover:text-white hover:bg-rose-600 rounded-lg font-bold shadow-none">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                         </Button>
                      </div>
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
