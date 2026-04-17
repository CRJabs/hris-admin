import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, CalendarClock, PenTool } from "lucide-react";
import { format } from "date-fns";

function InfoRow({ label, value, action, isReadOnly }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
      </div>
      {action && !isReadOnly && (
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
          <PenTool className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

export default function EmploymentInfoTab({ employee, isReadOnly = false }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Employment Information */}
      <Card className="shadow-none border-muted">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Current Employment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="space-y-1 mt-2">
             <InfoRow 
               label="Date of Employment" 
               value={employee.date_hired ? format(new Date(employee.date_hired), "MMMM d, yyyy") : "—"} 
               isReadOnly={true}
             />
             <InfoRow label="Employment Status" value={employee.employment_status || "Full time"} isReadOnly={true} />
             <InfoRow label="Employment Tenure" value={employee.employment_status || "Regular"} isReadOnly={true} />
             <InfoRow label="Classification" value="New" isReadOnly={true} />
             <InfoRow label="Position" value={employee.position} isReadOnly={true} />
             <InfoRow label="Employee Classification" value="Teaching" isReadOnly={true} />
             <InfoRow label="College/Department" value={employee.department} isReadOnly={true} />
             <InfoRow label="Present Rank" value="—" isReadOnly={true} />
             <InfoRow label="Active Dates" value="—" isReadOnly={true} />
             <InfoRow label="Last Date of Employment" value="—" isReadOnly={true} />
          </div>
        </CardContent>
      </Card>

      {/* Employment History Timeline */}
      <Card className="shadow-none border-muted">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Employment History
          </CardTitle>
          {!isReadOnly && (
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Plus className="w-3.5 h-3.5" />
              Add Record
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-4">
          <div className="space-y-0">
            {employee.employment_history && employee.employment_history.length > 0 ? (
               employee.employment_history.map((item, i) => (
                 <div key={i} className="flex gap-3 relative">
                   <div className="flex flex-col items-center">
                     <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                     {i < employee.employment_history.length - 1 && (
                       <div className="w-px flex-1 bg-border" />
                     )}
                   </div>
                   <div className="pb-6">
                     <p className="text-xs text-muted-foreground">{item.date}</p>
                     <p className="text-sm font-medium">{item.event}</p>
                     <p className="text-xs text-muted-foreground mt-1 bg-muted/30 p-2 rounded">{item.details}</p>
                   </div>
                 </div>
               ))
            ) : (
               <div className="border rounded-md border-dashed py-8 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/10">
                 <CalendarClock className="w-8 h-8 mb-2 opacity-20" />
                 <p className="text-sm font-medium">No employment history recorded.</p>
               </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
