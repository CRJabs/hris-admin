import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Palmtree, Stethoscope, Siren, Baby } from "lucide-react";
import { cn } from "@/lib/utils";

function LeaveCard({ icon: Icon, label, total, used, color }) {
  const remaining = total - used;
  const pct = total > 0 ? (used / total) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color)}>
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{remaining} days remaining</p>
          </div>
        </div>

        <Progress value={pct} className="h-2 mb-3" />

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold">{total}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold text-primary">{used}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Used</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold text-green-600">{remaining}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Balance</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TimeOffTab({ employee }) {
  const lc = employee.leave_credits || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LeaveCard
          icon={Palmtree}
          label="Vacation Leave"
          total={lc.vacation_total || 0}
          used={lc.vacation_used || 0}
          color="bg-primary"
        />
        <LeaveCard
          icon={Stethoscope}
          label="Sick Leave"
          total={lc.sick_total || 0}
          used={lc.sick_used || 0}
          color="bg-green-600"
        />
        <LeaveCard
          icon={Siren}
          label="Emergency Leave"
          total={lc.emergency_total || 0}
          used={lc.emergency_used || 0}
          color="bg-amber-500"
        />
        <LeaveCard
          icon={Baby}
          label="Maternity / Paternity Leave"
          total={lc.maternity_paternity_total || 0}
          used={lc.maternity_paternity_used || 0}
          color="bg-purple-600"
        />
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Leave Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm py-2 border-b border-border">
            <span className="text-muted-foreground">Total Leave Credits</span>
            <span className="font-semibold">
              {(lc.vacation_total || 0) + (lc.sick_total || 0) + (lc.emergency_total || 0) + (lc.maternity_paternity_total || 0)} days
            </span>
          </div>
          <div className="flex items-center justify-between text-sm py-2 border-b border-border">
            <span className="text-muted-foreground">Total Used</span>
            <span className="font-semibold text-primary">
              {(lc.vacation_used || 0) + (lc.sick_used || 0) + (lc.emergency_used || 0) + (lc.maternity_paternity_used || 0)} days
            </span>
          </div>
          <div className="flex items-center justify-between text-sm py-2">
            <span className="text-muted-foreground">Total Remaining</span>
            <span className="font-semibold text-green-600">
              {((lc.vacation_total || 0) - (lc.vacation_used || 0)) +
               ((lc.sick_total || 0) - (lc.sick_used || 0)) +
               ((lc.emergency_total || 0) - (lc.emergency_used || 0)) +
               ((lc.maternity_paternity_total || 0) - (lc.maternity_paternity_used || 0))} days
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}