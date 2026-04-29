import { useState, useEffect } from "react";
import { Check, X, UserPlus, Eye, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import E201Modal from "@/components/employees/E201Modal";

export default function NewRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      // Fetch all employment statuses to support filtering
      let query = supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      // Only filter by Pending when "all" to include Pending + recently processed
      // We fetch all and let client-side filtering handle the rest
      const { data: regData, error: regError } = await query;

      if (!regError) {
        // Only show employees that were registrations (Pending, Probationary that were recently approved, or ones that could be filtered)
        // For a clean approach: show Pending registrations plus any we want to track
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
          .update({ is_active: true, employment_status: 'Probationary' })
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

        toast.success(`Registration for ${emp.first_name} approved.`);
      } else {
        // Log rejection before delete
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
    }
  };

  const handleViewRegistrant = (emp) => {
    setSelectedRegistrant(emp);
    setModalOpen(true);
  };

  // Determine registration status label
  const getStatusLabel = (emp) => {
    if (emp.employment_status === 'Pending') return 'pending';
    // If they were approved, they'll have a non-Pending status and is_active = true
    if (emp.is_active) return 'approved';
    return 'rejected';
  };

  // Filter: only show registrations that are Pending, or if "all" show just Pending
  // Since rejected ones get deleted, we only really have Pending ones for this page
  const registrationPool = statusFilter === 'all'
    ? registrations.filter(emp => emp.employment_status === 'Pending')
    : statusFilter === 'pending'
    ? registrations.filter(emp => emp.employment_status === 'Pending')
    : []; // approved/rejected registrations don't persist in this table's design

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
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white border-slate-200 focus-visible:ring-[#0C005F]/20"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white border-slate-200">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <SelectValue placeholder="Filter by status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pending ({pendingCount})</SelectItem>
            <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
            <SelectItem value="approved">Approved (processed)</SelectItem>
            <SelectItem value="rejected">Rejected (processed)</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
          {filteredRegistrations.map((emp) => (
            <Card key={emp.id} className="overflow-hidden">
               <CardHeader className="bg-muted/30 pb-3 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                 <div>
                   <CardTitle className="text-base flex items-center gap-2">
                      {emp.first_name} {emp.last_name}
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Registration</Badge>
                   </CardTitle>
                   <CardDescription className="mt-1">
                      {emp.contact_email || emp.email || "No email"} • {emp.department || "No Department"}
                   </CardDescription>
                 </div>
                 <div className="flex flex-row gap-2 shrink-0 justify-center">
                    <Button size="sm" variant="outline" onClick={() => handleViewRegistrant(emp)} className="gap-1.5">
                       <Eye className="w-4 h-4" /> View Details
                    </Button>
                    <Button size="sm" onClick={() => handleRegistrationAction(emp, 'approved')} className="gap-1.5 bg-green-600 hover:bg-green-700">
                       <Check className="w-4 h-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRegistrationAction(emp, 'rejected')} className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50">
                       <X className="w-4 h-4" /> Reject
                    </Button>
                 </div>
               </CardHeader>
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
