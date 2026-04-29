import { useState, useEffect } from "react";
import { CheckSquare, Check, X, Clock, UserPlus, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import E201Modal from "@/components/employees/E201Modal";
import { useLocation, useNavigate } from "react-router-dom";
import { assignDefaultLeaveCredits } from "@/utils/leaveUtils";


export default function Approvals() {
  const [requests, setRequests] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("updates");
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
    
    // Subscribe to changes in update requests
    const reqSub = supabase.channel('approvals_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_update_requests' }, () => {
        console.log("Update requests changed, refetching...");
        fetchRequests();
      })
      .subscribe((status) => {
        console.log("Approvals requests subscription status:", status);
      });
      
    // Subscribe to changes in employees (for new registrations)
    const empSub = supabase.channel('approvals_employees_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        console.log("Employees changed, refetching...");
        fetchRequests();
      })
      .subscribe((status) => {
        console.log("Approvals employees subscription status:", status);
      });

    return () => {
      reqSub.unsubscribe();
      empSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (location.state?.requestId && requests.length > 0) {
      const reqId = location.state.requestId;
      const req = requests.find(r => r.id === reqId);
      if (req) {
        if (location.state.type === 'update') {
          setActiveTab("updates");
          setSelectedRegistrant({ ...req.employees, pendingRequests: [req] });
        } else {
          setActiveTab("registrations");
          setSelectedRegistrant(req.employees);
        }
        setModalOpen(true);
        // Clear state so it doesn't reopen on refresh
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.state, requests, navigate]);

  const handleUpdateAction = async (req, status) => {
    try {
      if (status === 'approved') {
        // Apply the requested changes to the employee table
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

      toast.success(`Request ${status} successfully.`);
      fetchRequests();
    } catch (err) {
      toast.error(`Failed to ${status} request: ${err.message}`);
    }
  };

  const handleRegistrationAction = async (emp, action) => {
    try {
      if (action === 'approved') {
        const { error } = await supabase
          .from('employees')
          .update({ is_active: true, employment_status: 'Probationary' }) // Default approved status
          .eq('id', emp.id);
        if (error) throw error;

        // Notify the employee (Welcome message)
        await supabase.from('notifications').insert({
          employee_id: emp.id,
          type: 'approved',
          title: "Welcome to UB HRIS",
          message: "Your registration has been approved! You can now access all features of the HRIS."
        });

        // Assign default leave credits
        await assignDefaultLeaveCredits(emp.id, emp.employment_classification);

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
        // Log rejection before delete (employee_id will be SET NULL after delete)
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

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="updates" className="gap-2">
            Profile Updates
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-primary text-primary-foreground">
                {requests.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="registrations" className="gap-2">
            New Registrations
            {registrations.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-primary text-primary-foreground">
                {registrations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Profile Updates Tab */}
        <TabsContent value="updates">
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
                                 The employee has submitted a batch update to their profile information. Review the masterlist or approve to apply all changes.
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
        </TabsContent>

        {/* New Registrations Tab */}
        <TabsContent value="registrations">
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
        </TabsContent>
      </Tabs>

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
