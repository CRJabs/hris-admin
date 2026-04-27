import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Plus, Activity, Settings2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

function LeaveBalanceCard({ id, title, total, used, isCommutable, isReadOnly, onUpdate }) {
  const [localTotal, setLocalTotal] = useState(total);
  const [localUsed, setLocalUsed] = useState(used);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalTotal(total);
    setLocalUsed(used);
  }, [total, used]);

  const handleManualSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('leave_credits')
        .update({ 
          total_credits: parseFloat(localTotal), 
          used_credits: parseFloat(localUsed),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(`${title} updated.`);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(`Failed to update ${title}`);
    } finally {
      setIsSaving(false);
    }
  };

  const remaining = localTotal - localUsed;
  const percentage = Math.round((remaining / localTotal) * 100) || 0;
  
  let colorClass = "bg-primary text-primary-foreground";
  if (percentage < 30) colorClass = "bg-red-500 text-white";
  else if (percentage < 60) colorClass = "bg-amber-500 text-white";

  return (
    <Card className="shadow-sm border-slate-300 overflow-hidden relative">
       {isSaving && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center"><Activity className="animate-spin" /></div>}
       <div className={`h-2 ${colorClass}`} style={{ width: `${percentage}%` }} />
       <CardContent className="p-4 pt-3">
         <div className="flex justify-between items-start mb-2">
           <div>
             <h4 className="font-semibold text-sm">{title}</h4>
             <p className="text-[10px] text-muted-foreground uppercase">{isCommutable ? "Commutable" : "Non-commutable"}</p>
           </div>
           <Badge variant="outline">{remaining} left</Badge>
         </div>
         {isReadOnly ? (
           <div className="flex justify-between text-xs text-muted-foreground mt-4">
             <span>Total: {localTotal}</span>
             <span>Used: {localUsed}</span>
           </div>
         ) : (
           <div className="space-y-3 mt-4">
             <div className="flex gap-2 items-center">
               <div className="flex flex-col gap-1 flex-1">
                 <span className="text-[10px] uppercase text-muted-foreground font-semibold">Total</span>
                 <Input 
                   type="number" 
                   value={localTotal} 
                   onChange={(e) => setLocalTotal(e.target.value)}
                   className="h-7 text-xs w-full" 
                 />
               </div>
               <div className="flex flex-col gap-1 flex-1">
                 <span className="text-[10px] uppercase text-muted-foreground font-semibold">Used</span>
                 <Input 
                   type="number" 
                   value={localUsed} 
                   onChange={(e) => setLocalUsed(e.target.value)}
                   className="h-7 text-xs w-full" 
                 />
               </div>
             </div>
             <Button 
               size="sm" 
               className="w-full h-7 text-[10px] gap-1.5 bg-slate-800 hover:bg-slate-900" 
               onClick={handleManualSave}
               disabled={isSaving || (localTotal == total && localUsed == used)}
             >
               <Save className="w-3 h-3" /> Update Balance
             </Button>
           </div>
         )}
       </CardContent>
    </Card>
  );
}

export default function LeaveTab({ employee, isReadOnly = false, onChange, requestedChanges = null, leaveCredits = [] }) {
  const checkUpdated = (name) => {
    if (!requestedChanges) return false;
    if (requestedChanges[name] !== undefined) {
      return true;
    }
    return false;
  };

  const isTeaching = employee.classification === "Teaching";
  
  // Use DB credits if available, otherwise fallback to the derived logic for initial state
  const displayCredits = leaveCredits.length > 0 
    ? leaveCredits.map(c => ({
        title: `${c.leave_type} Leave${c.is_commutable ? ' (Commutable)' : ' (Non-commutable)'}`,
        total: parseFloat(c.total_credits),
        used: parseFloat(c.used_credits),
        isCommutable: c.is_commutable
      }))
    : (isTeaching ? [
        { title: 'Vacation Leave', total: 7, used: 2, isCommutable: true },
        { title: 'Family Leave', total: 4, used: 1, isCommutable: false },
      ] : [
        { title: 'Vacation Leave (Commutable)', total: 10, used: 3, isCommutable: true },
        { title: 'Vacation Leave (Non-commutable)', total: 5, used: 0, isCommutable: false },
        { title: 'Family Leave', total: 4, used: 0, isCommutable: false },
      ]).concat([
        { title: 'Sick Leave', total: 15, used: 5, isCommutable: false },
        { title: 'Bereavement Leave', total: 3, used: 0, isCommutable: false },
        { title: 'Force Leave (Commutable)', total: 5, used: 0, isCommutable: true },
        { title: 'Force Leave (Non-commutable)', total: 5, used: 0, isCommutable: false },
      ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-lg font-bold flex items-center gap-2">
           <CalendarDays className="w-5 h-5 text-primary" />
           Leave Credits Breakdown
           {checkUpdated('leave_balances') && (
             <Badge variant="outline" className="h-4 text-[9px] bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">Updated</Badge>
           )}
         </h3>
         <div className="flex gap-2">
           {!isReadOnly && (
             <Button size="sm" variant="outline" className="gap-1 h-8">
                <Settings2 className="w-3.5 h-3.5" /> Manage Types
             </Button>
           )}
           <Button size="sm" variant="default" className="gap-1 h-8 bg-primary">
              <Plus className="w-3.5 h-3.5" /> File Leave
           </Button>
         </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2 rounded-lg transition-colors ${checkUpdated('leave_balances') ? 'bg-amber-50/30' : ''}`}>
        {displayCredits.map((leave, idx) => (
          <LeaveBalanceCard 
            key={idx}
            id={leaveCredits[idx]?.id}
            title={leave.title} 
            total={leave.total} 
            used={leave.used} 
            isCommutable={leave.isCommutable} 
            isReadOnly={isReadOnly} 
            onUpdate={onChange}
          />
        ))}
      </div>

      <Card className="shadow-sm border-slate-300 mt-8">
         <CardHeader className="p-4 pb-2">
           <CardTitle className="text-sm font-bold flex items-center gap-2">
             <Activity className="w-4 h-4 text-primary" />
             Recent Leave Activity
           </CardTitle>
         </CardHeader>
         <CardContent className="p-4">
            <div className="text-sm text-muted-foreground italic py-6 text-center border rounded-md border-dashed">
               No recent leave applications.
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
