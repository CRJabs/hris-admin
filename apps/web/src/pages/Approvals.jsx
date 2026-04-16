import { useState, useEffect } from "react";
import { CheckSquare, Check, X, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Approvals() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_update_requests')
        .select(`
          *,
          employees ( first_name, last_name, employee_id, department )
        `)
        .order('requested_at', { ascending: false });

      if (error) {
        // Fallback or ignore if the table doesn't exist yet for the UI to not crash
        console.error("Error fetching requests:", error.message);
      } else {
        setRequests(data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, status) => {
    try {
      const { error } = await supabase
        .from('profile_update_requests')
        .update({ status, processed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Request ${status} successfully.`);
      fetchRequests();
      
      // In a real app, if status === 'approved', you would then update the actual employees record here
      
    } catch (err) {
      toast.error(`Failed to ${status} request: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-primary" />
          Pending Approvals
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review profile update requests submitted by employees.
        </p>
      </div>

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
            <Card key={req.id} className="overflow-hidden">
               <CardHeader className="bg-muted/30 pb-3 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
                    Requested on {format(new Date(req.requested_at), "MMM d, yyyy h:mm a")}
                 </div>
               </CardHeader>
               <CardContent className="p-4 pt-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                       <p className="text-sm font-medium">Field Modification: <span className="text-primary">{req.field_name}</span></p>
                       <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="p-3 border rounded-md bg-red-50/50">
                             <p className="text-xs text-red-600 font-semibold mb-1 uppercase">Old Value</p>
                             <p className="text-sm">{JSON.stringify(req.old_value) || "None"}</p>
                          </div>
                          <div className="p-3 border rounded-md bg-green-50/50">
                             <p className="text-xs text-green-600 font-semibold mb-1 uppercase">New Value</p>
                             <p className="text-sm">{JSON.stringify(req.new_value)}</p>
                          </div>
                       </div>
                    </div>
                    {req.status === 'pending' && (
                       <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-center">
                          <Button size="sm" onClick={() => handleAction(req.id, 'approved')} className="gap-1.5 bg-green-600 hover:bg-green-700">
                             <Check className="w-4 h-4" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(req.id, 'rejected')} className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50">
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
    </div>
  );
}
