import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { FileText, UserPlus, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

export default function Approvals() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/').pop() || "updates";
  
  const [counts, setCounts] = useState({
    updates: 0,
    registrations: 0,
    leaves: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [updates, regs, leaves] = await Promise.all([
          supabase.from('employee_update_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'Pending'),
          supabase.from('leave_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        ]);
        
        setCounts({
          updates: updates.count || 0,
          registrations: regs.count || 0,
          leaves: leaves.count || 0
        });
      } catch (err) {
        console.error("Error fetching counts:", err);
      }
    };

    fetchCounts();
    
    // Subscribe to changes for live counts
    const updatesSub = supabase.channel('approval-counts-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_update_requests' }, fetchCounts)
      .subscribe();
      
    const regsSub = supabase.channel('approval-counts-regs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchCounts)
      .subscribe();

    const leavesSub = supabase.channel('approval-counts-leaves')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_applications' }, fetchCounts)
      .subscribe();

    return () => {
      updatesSub.unsubscribe();
      regsSub.unsubscribe();
      leavesSub.unsubscribe();
    };
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-6 bg-white border-b shrink-0">
        <Tabs value={activeTab} onValueChange={(val) => navigate(`/approvals/${val}`)} className="w-full">
          <TabsList className="bg-slate-100/50 p-1 h-12 mb-0">
            <TabsTrigger value="updates" className="gap-2 px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4" /> 
              Profile Updates
              {counts.updates > 0 && (
                <Badge className="ml-1 bg-[#0C005F] text-white hover:bg-[#0C005F]">
                  {counts.updates}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="registrations" className="gap-2 px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <UserPlus className="w-4 h-4" /> 
              New Registrations
              {counts.registrations > 0 && (
                <Badge className="ml-1 bg-[#0C005F] text-white hover:bg-[#0C005F]">
                  {counts.registrations}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="leaves" className="gap-2 px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <CalendarDays className="w-4 h-4" /> 
              Leave Applications
              {counts.leaves > 0 && (
                <Badge className="ml-1 bg-[#0C005F] text-white hover:bg-[#0C005F]">
                  {counts.leaves}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <Outlet />
      </div>
    </div>
  );
}
