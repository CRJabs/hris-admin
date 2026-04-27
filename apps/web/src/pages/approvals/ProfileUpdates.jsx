import { useState, useEffect } from "react";
import { CheckSquare, Check, X, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import E201Modal from "@/components/employees/E201Modal";
import { useLocation, useNavigate } from "react-router-dom";

export default function ProfileUpdates() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data: updateData, error: updateError } = await supabase
        .from('employee_update_requests')
        .select(`*, employees (*)`)
        .order('created_at', { ascending: false });

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
        const { error: updateError } = await supabase
          .from('employees')
          .update(req.requested_changes)
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

      toast.success(`Request ${status} successfully.`);
      fetchRequests();
    } catch (err) {
      toast.error(`Failed to ${status} request: ${err.message}`);
    }
  };

  const handleViewRegistrant = (emp) => {
    setSelectedRegistrant(emp);
    setModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Loading requests...</div>
      ) : requests.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/10">
           <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <CheckSquare className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-lg">No pending requests</p>
              <p className="text-sm">You are all caught up!</p>
           </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group" onClick={() => handleViewRegistrant({ ...req.employees, pendingRequests: [req] })}>
                <CardHeader className="bg-muted/30 group-hover:bg-primary/5 transition-colors pb-3 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                       {req.employees?.first_name} {req.employees?.last_name}
                       {req.status === 'pending' && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>}
                       {req.status === 'approved' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>}
                       {req.status === 'rejected' && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>}
                    </CardTitle>
                    <CardDescription className="mt-1">
                       {req.employees?.employee_id} • {req.employees?.department}
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5 shrink-0">
                     <Clock className="w-3.5 h-3.5" />
                     Requested on {format(new Date(req.created_at || new Date()), "MMM d, yyyy h:mm a")}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-4">
                   <div className="flex flex-col md:flex-row gap-6">
                     <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium">Modification: <span className="text-primary">Profile Information Update</span></p>
                        <div className="p-3 border rounded-md bg-blue-50/30">
                           <p className="text-xs text-blue-600 font-semibold mb-1 uppercase">Changes Submitted</p>
                           <p className="text-xs text-muted-foreground leading-relaxed">
                             The employee has submitted a batch update to their profile information. Review the details or approve to apply all changes.
                           </p>
                        </div>
                     </div>
                     {req.status === 'pending' && (
                        <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-center" onClick={(e) => e.stopPropagation()}>
                           <Button size="sm" onClick={() => handleUpdateAction(req, 'approved')} className="gap-1.5 bg-green-600 hover:bg-green-700">
                              <Check className="w-4 h-4" /> Approve
                           </Button>
                           <Button size="sm" variant="outline" onClick={() => handleUpdateAction(req, 'rejected')} className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50">
                              <X className="w-4 h-4" /> Reject
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
