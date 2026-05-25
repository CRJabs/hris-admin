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
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="flex-1 overflow-y-auto">
        <Outlet context={{ counts }} />
      </div>
    </div>
  );
}
