import { useState, useEffect } from "react";
import { Check, X, UserPlus, Eye, Search, Filter, Trash2, User, Loader2 } from "lucide-react";
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

export default function NewRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { counts, searchQuery, statusFilter } = useOutletContext();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data: regData, error: regError } = await supabase
        .from('employees')
        .select('*')
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
    setIsProcessing(true);
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

        await supabase.from('notifications').insert({
          employee_id: emp.id,
          type: 'approved',
          title: "Welcome to UB HRIS",
          message: "Your registration has been approved! You can now access all features of the HRIS."
        });

        await supabase.from('admin_activity_log').insert({
          actor_type: 'admin',
          actor_name: 'Administrator',
          action: 'admin_approved_registration',
          description: `Approved registration for ${emp.first_name} ${emp.last_name}`,
          employee_id: emp.id
        });

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
        await supabase.from('admin_activity_log').insert({
          actor_type: 'admin',
          actor_name: 'Administrator',
          action: 'admin_rejected_registration',
          description: `Rejected registration for ${emp.first_name} ${emp.last_name}`,
          employee_id: emp.id
        });

        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', emp.id);
        if (error) throw error;
        toast.success(`Registration for ${emp.first_name} rejected.`);
      }
      setModalOpen(false);
      fetchRequests();
    } catch (err) {
      toast.error(`Failed to process registration: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (emp) => {
    try {
      const empName = `${emp.first_name || ''} ${emp.last_name || ''}`;
      const label = `${empName.trim() || 'Unknown Registrant'} - New Registration`;

      const { error: binError } = await supabase
        .from('bin')
        .insert({
          record_type: 'registration',
          record_id: emp.id,
          record_data: emp,
          label: label
        });

      if (binError) throw binError;

      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', emp.id);

      if (deleteError) throw deleteError;

      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: 'admin_rejected_registration',
        description: `Moved New Registration for ${empName} to Bin`,
        employee_id: emp.id
      });

      toast.success("Registration request moved to Bin.");
      setModalOpen(false);
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to delete registration request: ${err.message}`);
    }
  };

  const handleViewRegistrant = (emp) => {
    setSelectedRegistrant(emp);
    setModalOpen(true);
  };

  const registrationPool = statusFilter === 'all'
    ? registrations.filter(emp => emp.employment_status === 'Pending')
    : statusFilter === 'pending'
    ? registrations.filter(emp => emp.employment_status === 'Pending')
    : [];

  const filteredRegistrations = registrationPool.filter(emp => {
    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
    const empEmail = (emp.contact_email || emp.email || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const empId = (emp.employee_id || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return !query || fullName.includes(query) || empEmail.includes(query) || dept.includes(query) || empId.includes(query);
  });

  const pendingCount = registrations.filter(e => e.employment_status === 'Pending').length;

  const emp = selectedRegistrant || {};

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1440px] mx-auto">
      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Loading registrations...</div>
      ) : filteredRegistrations.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/10">
           <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <UserPlus className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-lg">
                {pendingCount === 0 ? "No pending registrations" : "No matching registrations"}
              </p>
              <p className="text-sm">
                {pendingCount === 0 ? "No new applicants at the moment." : "Try adjusting your search or filter."}
              </p>
           </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRegistrations.map((empItem) => (
            <Card key={empItem.id} className="overflow-hidden hover:shadow-md transition-all">
               <CardHeader className="bg-muted/30 pb-3 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                     {empItem.photo_url ? (
                       <img src={empItem.photo_url} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-xs font-bold text-slate-500">
                         {empItem.first_name?.[0]}{empItem.last_name?.[0]}
                       </span>
                     )}
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-800 text-sm">
                        {empItem.first_name} {empItem.last_name}
                     </h3>
                     <p className="text-[10px] text-slate-400 font-medium">
                        {empItem.contact_email || empItem.email || "No email"} • {empItem.department || "No Department"}
                     </p>
                   </div>
                 </div>

                 <div className="flex items-center gap-3 self-start sm:self-center">
                   <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">
                     Pending Registration
                   </Badge>

                   <Button
                     type="button"
                     size="sm"
                     onClick={() => handleViewRegistrant(empItem)}
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

      {/* Registration Review Modal */}
      {selectedRegistrant && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
            {/* Header */}
            <div className="bg-[#0C005F] p-6 text-white pr-12 relative">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                New Registration Review
              </DialogTitle>
              <DialogDescription className="text-white/60 text-xs mt-1 uppercase tracking-widest font-medium">
                EMPLOYEE REGISTRATION APPLICATION
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
                    {emp.employee_id || "ID Pending"} • {emp.department || "No Department"} • {emp.position || "Staff"}
                  </p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold uppercase text-[9px] px-2 py-0.5 shadow-none">
                  Pending
                </Badge>
              </div>

              {/* Registration Fields Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500 uppercase">Employee ID</Label>
                  <Input value={emp.employee_id || "—"} disabled className="h-9 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500 uppercase">Full Name</Label>
                  <Input value={`${emp.first_name || ""} ${emp.last_name || ""}`} disabled className="h-9 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500 uppercase">Email</Label>
                  <Input value={emp.contact_email || emp.email || "—"} disabled className="h-9 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500 uppercase">Phone Number</Label>
                  <Input value={emp.contact_phone || "—"} disabled className="h-9 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500 uppercase">Department</Label>
                  <Input value={emp.department || "—"} disabled className="h-9 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500 uppercase">Position</Label>
                  <Input value={emp.position || "—"} disabled className="h-9 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500 uppercase">Date Hired</Label>
                  <Input value={emp.date_hired || "—"} disabled className="h-9 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500 uppercase">Birthdate</Label>
                  <Input value={emp.birthdate || "—"} disabled className="h-9 bg-slate-50" />
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isProcessing}
                  onClick={() => handleDelete(emp)}
                  className="text-red-600 border-red-200 hover:bg-red-50 font-semibold gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Move to Bin
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isProcessing}
                    onClick={() => handleRegistrationAction(emp, 'rejected')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Reject
                  </Button>
                  <Button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleRegistrationAction(emp, 'approved')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Approve Registration
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
