import { useState, useEffect } from "react";
import { Check, X, UserPlus, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import E201Modal from "@/components/employees/E201Modal";

export default function NewRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data: regData, error: regError } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'Pending');

      if (!regError) setRegistrations(regData || []);
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

        toast.success(`Registration for ${emp.first_name} approved.`);
      } else {
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

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Loading registrations...</div>
      ) : registrations.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/10">
           <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <UserPlus className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-lg">No pending registrations</p>
           </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {registrations.map((emp) => (
            <Card key={emp.id} className="overflow-hidden">
               <CardHeader className="bg-muted/30 pb-3 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                 <div>
                   <CardTitle className="text-base flex items-center gap-2">
                      {emp.first_name} {emp.last_name}
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Registration</Badge>
                   </CardTitle>
                   <CardDescription className="mt-1">
                      {emp.email} • {emp.department || "No Department"}
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
