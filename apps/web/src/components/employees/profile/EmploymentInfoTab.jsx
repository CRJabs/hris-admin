import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, CalendarClock, PenTool } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EMPLOYMENT_CLASSIFICATIONS } from "@/lib/constants";

function InfoRow({ label, value, name, onChange, isReadOnly, type = "text", isUpdated = false }) {
  return (
    <div className={`flex items-center justify-between py-2 px-2 rounded-md transition-colors ${isUpdated ? 'bg-amber-50 border border-amber-200/50 shadow-sm' : 'border-b last:border-0'}`}>
      <div className="w-full pr-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
          {isUpdated && (
            <Badge variant="outline" className="h-3.5 text-[8px] px-1 bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">
              Updated
            </Badge>
          )}
        </div>
        {!isReadOnly ? (
          <Input 
            type={type}
            name={name}
            value={value || ""} 
            onChange={(e) => onChange(name, e.target.value)}
            className="h-8 text-sm mt-1 w-full max-w-sm"
          />
        ) : (
          <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

export default function EmploymentInfoTab({ employee, isReadOnly = false, onChange, requestedChanges = null }) {
  const checkUpdated = (name) => {
    if (!requestedChanges) return false;
    if (requestedChanges[name] !== undefined && requestedChanges[name] !== employee[name]) {
      return true;
    }
    return false;
  };

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
               label="Employee ID" 
               value={employee.employee_id} 
               name="employee_id"
               onChange={onChange}
               isReadOnly={isReadOnly}
               isUpdated={checkUpdated('employee_id')}
             />
             <InfoRow 
               label="Date of Employment" 
               value={isReadOnly ? (employee.date_hired ? format(new Date(employee.date_hired), "MMMM d, yyyy") : "—") : employee.date_hired} 
               name="date_hired"
               type="date"
               onChange={onChange}
               isReadOnly={isReadOnly}
               isUpdated={checkUpdated('date_hired')}
             />
             <InfoRow label="Employment Status" value={employee.employment_status || "Full time"} name="employment_status" onChange={onChange} isReadOnly={isReadOnly} isUpdated={checkUpdated('employment_status')} />
             <div className={`flex items-center justify-between py-2 px-2 rounded-md transition-colors ${checkUpdated('employment_classification') ? 'bg-amber-50 border border-amber-200/50 shadow-sm' : 'border-b last:border-0'}`}>
               <div className="w-full pr-4">
                 <div className="flex items-center justify-between">
                   <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Classification</p>
                   {checkUpdated('employment_classification') && (
                     <Badge variant="outline" className="h-3.5 text-[8px] px-1 bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">
                       Updated
                     </Badge>
                   )}
                 </div>
                 {!isReadOnly ? (
                   <select 
                     className="flex h-8 w-full max-w-sm items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                     value={employee.employment_classification || EMPLOYMENT_CLASSIFICATIONS[0]}
                     onChange={(e) => onChange('employment_classification', e.target.value)}
                   >
                     {EMPLOYMENT_CLASSIFICATIONS.map(cls => (
                       <option key={cls} value={cls}>{cls}</option>
                     ))}
                   </select>
                 ) : (
                   <p className="text-sm font-medium mt-0.5">{employee.employment_classification || "—"}</p>
                 )}
               </div>
             </div>
             <InfoRow label="Position" value={employee.position} name="position" onChange={onChange} isReadOnly={isReadOnly} isUpdated={checkUpdated('position')} />
             <InfoRow label="College/Department" value={employee.department} name="department" onChange={onChange} isReadOnly={isReadOnly} isUpdated={checkUpdated('department')} />
             <InfoRow label="Employee Status" value={employee.is_active ? "Active" : "Inactive"} isReadOnly={true} />
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
          {checkUpdated('previous_employment') && (
            <Badge variant="outline" className="h-4 text-[9px] bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">Updated</Badge>
          )}
          {!isReadOnly && (
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Plus className="w-3.5 h-3.5" />
              Add Record
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-4">
          <div className="space-y-4">
            {employee.previous_employment && employee.previous_employment.length > 0 ? (
               employee.previous_employment.map((item, i) => (
                 <div key={i} className={`border rounded-lg p-4 transition-colors ${checkUpdated('previous_employment') ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'} space-y-3`}>
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className="font-bold text-sm uppercase">{item.company}</h4>
                          <p className="text-xs text-primary font-medium">{item.position} • {item.status}</p>
                       </div>
                       <Badge variant="outline" className="text-[10px] bg-white">{item.start} — {item.end}</Badge>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-2 border-y border-border/50 text-[11px]">
                       <div><p className="text-muted-foreground uppercase">Department</p><p className="font-medium">{item.dept}</p></div>
                       <div><p className="text-muted-foreground uppercase">Monthly Salary</p><p className="font-medium">{item.salary}</p></div>
                       <div className="col-span-2"><p className="text-muted-foreground uppercase">Responsibility</p><p className="font-medium italic">{item.resp}</p></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Reason for Leaving: <span className="text-foreground">{item.reason}</span></p>
                 </div>
               ))
            ) : (
               <div className="border rounded-md border-dashed py-8 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/10">
                 <CalendarClock className="w-8 h-8 mb-2 opacity-20" />
                 <p className="text-sm font-medium">No previous employment records.</p>
               </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
