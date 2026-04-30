import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, CalendarClock, PenTool } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EMPLOYMENT_CLASSIFICATIONS, DEPARTMENTS } from "@/utils/constants";
import mockEmployees from "@/data/mockEmployees";

import DynamicGrid from "@/components/employees/registration/DynamicGrid";

function InfoRow({ label, value, name, onChange, isReadOnly, type = "text", isUpdated = false, isError = false, children }) {
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
          children ? children : (
            <Input 
              type={type}
              name={name}
              value={value || ""} 
              onChange={(e) => onChange(name, e.target.value)}
              className={`h-8 text-sm mt-1 w-full max-w-sm ${isError ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50' : ''}`}
            />
          )
        ) : (
          <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

export default function EmploymentInfoTab({ employee, isReadOnly = false, isAdminView = false, onChange, requestedChanges = null, errors = {} }) {
  const isEmployeeEditing = !isReadOnly && !isAdminView;
  const isAdminEditing = !isReadOnly && isAdminView;
  const checkUpdated = (name) => {
    if (!requestedChanges) return false;
    if (requestedChanges[name] !== undefined && requestedChanges[name] !== employee[name]) {
      return true;
    }
    return false;
  };

  const prevEmpCols = [
    { key: 'company', label: 'Company Name', span: 4 }, { key: 'address', label: 'Company Address', span: 4 },
    { key: 'position', label: 'Position', span: 4 },
    { key: 'status', label: 'Employment Status', span: 3 }, { key: 'phone', label: 'Phone No.', span: 3 },
    { key: 'dept', label: 'Department', span: 3 }, { key: 'salary', label: 'Monthly Salary', span: 3 },
    { key: 'start', label: 'Start Date', type: 'date', span: 2 }, { key: 'end', label: 'End Date', type: 'date', span: 2 },
    { key: 'resp', label: 'Responsibilities', span: 3 }, { key: 'awards', label: 'Achievements/Awards', span: 3 },
    { key: 'reason', label: 'Reason for Leaving', span: 2 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Employment Information */}
      <Card className="shadow-sm border-slate-300">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Current Employment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="space-y-1 mt-2">
             <div className="grid grid-cols-2 gap-x-8">
               <InfoRow label="Employee ID" value={employee.employee_id} name="employee_id" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('employee_id')} />
               <InfoRow 
                 label="Date of Employment" 
                 value={!isAdminEditing ? (employee.date_hired ? format(new Date(employee.date_hired), "MMMM d, yyyy") : "—") : employee.date_hired} 
                 name="date_hired"
                 type="date"
                 onChange={onChange}
                 isReadOnly={!isAdminEditing}
                 isUpdated={checkUpdated('date_hired')}
               />
             </div>

             <div className="grid grid-cols-2 gap-x-8">
               <InfoRow label="Employment Status" value={employee.employment_status} name="employment_status" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('employment_status')}>
                  <select 
                    className="flex h-8 w-full max-w-sm items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring mt-1"
                    value={employee.employment_status || "Fulltime"}
                    onChange={(e) => onChange('employment_status', e.target.value)}
                  >
                    {["Fulltime", "Parttime"].map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
               </InfoRow>
               <InfoRow label="Employment Tenure" value={employee.employment_tenure} name="employment_tenure" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('employment_tenure')}>
                  <select 
                    className="flex h-8 w-full max-w-sm items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring mt-1"
                    value={employee.employment_tenure || "Regular"}
                    onChange={(e) => onChange('employment_tenure', e.target.value)}
                  >
                    {["Regular", "Probationary", "Contractual"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
               </InfoRow>
             </div>

             <div className="grid grid-cols-2 gap-x-8 border-t pt-2 mt-2">
               <InfoRow label="Classification I" value={employee.employment_classification} name="employment_classification" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('employment_classification')}>
                  <select 
                    className="flex h-8 w-full max-w-sm items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring mt-1"
                    value={employee.employment_classification || "Teaching"}
                    onChange={(e) => onChange('employment_classification', e.target.value)}
                  >
                    {["Teaching", "Non-Teaching"].map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
               </InfoRow>
               <InfoRow label="Classification II" value={employee.classification_ii} name="classification_ii" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('classification_ii')}>
                  <select 
                    className="flex h-8 w-full max-w-sm items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring mt-1"
                    value={employee.classification_ii || "Executive"}
                    onChange={(e) => onChange('classification_ii', e.target.value)}
                  >
                    {["Executive", "Academic Official", "Administrative Official", "Consultant"].map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </InfoRow>
             </div>

             <div className="grid grid-cols-3 gap-x-4 border-t pt-2 mt-2">
                <InfoRow label="Present Rank" value={employee.present_rank} name="present_rank" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('present_rank')} />
                <InfoRow label="Rank Start" value={employee.present_rank_start} name="present_rank_start" type="date" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('present_rank_start')} />
                <InfoRow label="Rank End" value={employee.present_rank_end} name="present_rank_end" type="date" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('present_rank_end')} />
             </div>

             <div className="grid grid-cols-2 gap-x-8 border-t pt-2 mt-2">
                <InfoRow label="Position" value={employee.position} name="position" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('position')} isError={!!errors.position}>
                  <textarea
                    className="flex min-h-[60px] w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    value={employee.position || ""}
                    onChange={(e) => onChange('position', e.target.value)}
                    placeholder="Enter multiple positions separated by commas or newlines"
                  />
                </InfoRow>
                <InfoRow label="College/Department" value={employee.department} name="department" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('department')} isError={!!errors.department}>
                  <select 
                    className={`flex h-8 w-full max-w-sm items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring mt-1 ${errors.department ? 'border-red-500 ring-red-500' : ''}`}
                    value={employee.department || ""}
                    onChange={(e) => onChange('department', e.target.value)}
                  >
                    <option value="" disabled>Select Department</option>
                    {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </InfoRow>
             </div>

             <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest">Employee Global Status</p>
                <Badge variant={employee.is_active ? "default" : "destructive"} className="uppercase text-[10px]">
                  {employee.is_active ? "Active Service" : "Inactive / Separated"}
                </Badge>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment History Timeline */}
      <Card className="shadow-sm border-slate-300">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Employment History
          </CardTitle>
          {!isReadOnly && checkUpdated('previous_employment') && (
            <Badge variant="outline" className="h-4 text-[9px] bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">Updated</Badge>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-4">
          <div className="space-y-4">
            {isEmployeeEditing ? (
              <DynamicGrid 
                title="Previous Employment" 
                columns={prevEmpCols} 
                data={employee.previous_employment || []} 
                onChange={(newData) => onChange('previous_employment', newData)} 
              />
            ) : (
              <>
                {employee.previous_employment && employee.previous_employment.length > 0 ? (
                   employee.previous_employment.map((item, i) => (
                     <div key={i} className={`border rounded-lg p-4 transition-colors ${checkUpdated('previous_employment') ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'} space-y-3`}>
                        <div className="flex justify-between items-start">
                           <div>
                              <h4 className="font-bold text-sm uppercase">{item.company}</h4>
                              <p className="text-[10px] text-muted-foreground italic mb-1">{item.address}</p>
                              <p className="text-xs text-primary font-medium">{item.position} • {item.status}</p>
                           </div>
                           <Badge variant="outline" className="text-[10px] bg-white">{item.start || '—'} — {item.end || '—'}</Badge>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-2 border-y border-border/50 text-[11px]">
                           <div><p className="text-muted-foreground uppercase">Department</p><p className="font-medium">{item.dept}</p></div>
                           <div><p className="text-muted-foreground uppercase">Monthly Salary</p><p className="font-medium">{item.salary}</p></div>
                           <div className="col-span-2"><p className="text-muted-foreground uppercase">Responsibility</p><p className="font-medium italic">{item.resp}</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                           <p className="text-muted-foreground">Achievements: <span className="text-foreground">{item.awards}</span></p>
                           <p className="text-muted-foreground text-right">Reason for Leaving: <span className="text-foreground">{item.reason}</span></p>
                        </div>
                     </div>
                   ))
                ) : (
                   <div className="border rounded-md border-dashed py-8 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/10">
                     <CalendarClock className="w-8 h-8 mb-2 opacity-20" />
                     <p className="text-sm font-medium">No previous employment records.</p>
                   </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
