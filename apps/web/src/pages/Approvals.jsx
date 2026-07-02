import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { FileText, UserPlus, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import ApprovalsTabs from "@/components/approvals/ApprovalsTabs";

export default function Approvals() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/').pop() || "updates";
  
  const [counts, setCounts] = useState({
    updates: 0,
    registrations: 0,
    leaves: 0,
    commutations: 0,
    resignations: 0,
    retirements: 0
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [updates, regs, leaves, commutations, resignations, retirements] = await Promise.all([
          supabase.from('employee_update_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'Pending'),
          supabase.from('leave_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('commutation_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('resignation_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('retirement_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        ]);
        
        setCounts({
          updates: updates.count || 0,
          registrations: regs.count || 0,
          leaves: leaves.count || 0,
          commutations: commutations.count || 0,
          resignations: resignations.count || 0,
          retirements: retirements.count || 0
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

    const commutationsSub = supabase.channel('approval-counts-commutations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commutation_requests' }, fetchCounts)
      .subscribe();

    const resignationsSub = supabase.channel('approval-counts-resignations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resignation_requests' }, fetchCounts)
      .subscribe();

    const retirementsSub = supabase.channel('approval-counts-retirements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'retirement_requests' }, fetchCounts)
      .subscribe();

    return () => {
      updatesSub.unsubscribe();
      regsSub.unsubscribe();
      leavesSub.unsubscribe();
      commutationsSub.unsubscribe();
      resignationsSub.unsubscribe();
      retirementsSub.unsubscribe();
    };
  }, []);

  // Reset search and filters when tab changes
  useEffect(() => {
    setSearchQuery("");
    setStatusFilter("all");
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-0 max-w-[1440px] mx-auto w-full shrink-0">
        <ApprovalsTabs 
          counts={counts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <Outlet context={{ counts, searchQuery, statusFilter }} />
      </div>
    </div>
  );
}
