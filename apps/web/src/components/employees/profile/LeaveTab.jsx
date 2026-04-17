import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Plus, Activity } from "lucide-react";

function LeaveBalanceCard({ title, total, used, isCommutable }) {
  const remaining = total - used;
  const percentage = Math.round((remaining / total) * 100) || 0;
  
  let colorClass = "bg-primary text-primary-foreground";
  if (percentage < 30) colorClass = "bg-red-500 text-white";
  else if (percentage < 60) colorClass = "bg-amber-500 text-white";

  return (
    <Card className="shadow-none border-muted overflow-hidden">
       <div className={`h-2 ${colorClass}`} style={{ width: `${percentage}%` }} />
       <CardContent className="p-4 pt-3">
         <div className="flex justify-between items-start mb-2">
           <div>
             <h4 className="font-semibold text-sm">{title}</h4>
             <p className="text-[10px] text-muted-foreground uppercase">{isCommutable ? "Commutable" : "Non-commutable"}</p>
           </div>
           <Badge variant="outline">{remaining} left</Badge>
         </div>
         <div className="flex justify-between text-xs text-muted-foreground mt-4">
           <span>Total: {total}</span>
           <span>Used: {used}</span>
         </div>
       </CardContent>
    </Card>
  );
}

export default function LeaveTab({ employee, isReadOnly = false }) {
  // Mock data for leave balances based on Section V.I
  const isTeaching = employee.classification === "Teaching";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-lg font-bold flex items-center gap-2">
           <CalendarDays className="w-5 h-5 text-primary" />
           Leave Credits Breakdown
         </h3>
         {!isReadOnly && (
           <Button size="sm" variant="default" className="gap-1 h-8 bg-primary">
              <Plus className="w-3.5 h-3.5" /> File Leave
           </Button>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isTeaching ? (
           <>
             <LeaveBalanceCard title="Vacation Leave" total={7} used={2} isCommutable={true} />
             <LeaveBalanceCard title="Family Leave" total={4} used={1} isCommutable={false} />
           </>
        ) : (
           <>
             <LeaveBalanceCard title="Vacation Leave (Commutable)" total={10} used={3} isCommutable={true} />
             <LeaveBalanceCard title="Vacation Leave (Non-commutable)" total={5} used={0} isCommutable={false} />
             <LeaveBalanceCard title="Family Leave" total={4} used={0} isCommutable={false} />
           </>
        )}
        <LeaveBalanceCard title="Sick Leave" total={15} used={5} isCommutable={false} />
        <LeaveBalanceCard title="Bereavement Leave" total={3} used={0} isCommutable={false} />
        <LeaveBalanceCard title="Force Leave (Commutable)" total={5} used={0} isCommutable={true} />
        <LeaveBalanceCard title="Force Leave (Non-commutable)" total={5} used={0} isCommutable={false} />
        <LeaveBalanceCard title="Leave without Pay" total={0} used={2} isCommutable={false} />
      </div>

      <Card className="shadow-none border-muted mt-8">
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
