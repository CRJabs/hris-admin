import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, CalendarClock, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
const EMPLOYMENT_CLASSIFICATIONS = [
  "Executive",
  "Academic Official",
  "Administrative Official",
  "Teaching",
  "Non-Teaching",
  "Consultant"
];
import { useOrgDepartments } from "@/hooks/useOrgDepartments";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const { departments, academicDepts, nonAcademicDepts, allUnits, isLoading: deptsLoading } = useOrgDepartments();
  
  const [classIIIOptions, setClassIIIOptions] = useState(['New', 'Rehired', 'Retired/Rehired']);
  const [showClassIIIModal, setShowClassIIIModal] = useState(false);
  const [newClassIIIOption, setNewClassIIIOption] = useState('');
  const [isClassIIISaving, setIsClassIIISaving] = useState(false);

  // Fetch Classification III options
  useEffect(() => {
    async function loadOptions() {
      try {
        const { data, error } = await supabase
          .from('classification_iii_options')
          .select('name')
          .order('name');
        if (error) throw error;
        if (data && data.length > 0) {
          setClassIIIOptions(data.map(d => d.name));
        }
      } catch (err) {
        console.error("Error loading classification_iii options:", err);
      }
    }
    loadOptions();
  }, []);

  const handleAddClassIIIOption = async () => {
    const optionName = newClassIIIOption.trim();
    if (!optionName) return;
    setIsClassIIISaving(true);
    try {
      const { error } = await supabase
        .from('classification_iii_options')
        .insert({ name: optionName });
      
      if (error) {
        if (error.code === '23505') {
          toast.error("Option already exists");
          return;
        }
        throw error;
      }
      
      setClassIIIOptions(prev => [...prev, optionName].sort());
      setNewClassIIIOption('');
      toast.success("Option added successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add option: " + err.message);
    } finally {
      setIsClassIIISaving(false);
    }
  };

  const handleDeleteClassIIIOption = async (name) => {
    if (classIIIOptions.length <= 1) {
      toast.error("At least one option must remain");
      return;
    }
    setIsClassIIISaving(true);
    try {
      const { error } = await supabase
        .from('classification_iii_options')
        .delete()
        .eq('name', name);
      
      if (error) throw error;
      
      setClassIIIOptions(prev => prev.filter(o => o !== name));
      toast.success("Option deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete option: " + err.message);
    } finally {
      setIsClassIIISaving(false);
    }
  };

  const checkUpdated = (name) => {
    if (!requestedChanges) return false;
    return Object.prototype.hasOwnProperty.call(requestedChanges, name);
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Loading employee information...
      </div>
    );
  }

  // Parse Position
  const positions = employee.position
    ? employee.position.split(',').map(p => p.trim()).filter(Boolean)
    : [''];

  const handlePositionChange = (idx, value) => {
    const newPositions = [...positions];
    newPositions[idx] = value;
    onChange('position', newPositions.join(', '));
  };

  const handleAddPositionField = () => {
    onChange('position', [...positions, ''].join(', '));
  };

  const handleRemovePositionField = (idx) => {
    const newPositions = positions.filter((_, i) => i !== idx);
    onChange('position', newPositions.join(', '));
  };

  // Calculate assigned departments/colleges for existing employee
  const assignedDepts = (allUnits || []).filter(d => {
    if (!employee.id) return false;
    if (employee.org_unit_id === d.id) return true;
    if (d.head_id === employee.id) return true;
    if (d.heads && d.heads.some(h => h.employee_id === employee.id)) return true;
    return false;
  }).map(d => d.name);

  const uniqueAssignedDepts = Array.from(new Set(assignedDepts));
  const displayDepts = uniqueAssignedDepts.length > 0 
    ? uniqueAssignedDepts 
    : (employee.department ? [employee.department] : []);

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
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
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

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
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
                       {["Regular", "Probationary", "Contractual", "Part-Time"].map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                </InfoRow>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 border-t pt-2 mt-2">
                <InfoRow label="Classification I" value={employee.employment_classification} name="employment_classification" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('employment_classification')}>
                   <select 
                     className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring mt-1 w-full"
                     value={employee.employment_classification || "Teaching"}
                     onChange={(e) => onChange('employment_classification', e.target.value)}
                   >
                     {["Teaching", "Non-Teaching"].map(cls => <option key={cls} value={cls}>{cls}</option>)}
                   </select>
                </InfoRow>
                <InfoRow label="Classification II" value={employee.classification_ii} name="classification_ii" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('classification_ii')}>
                   <select 
                     className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring mt-1 w-full"
                     value={employee.classification_ii || "Executive"}
                     onChange={(e) => onChange('classification_ii', e.target.value)}
                   >
                     {["Executive", "Academic Official", "Administrative Official", "Consultant"].map(cls => <option key={cls} value={cls}>{cls}</option>)}
                   </select>
                </InfoRow>
                <InfoRow label="Classification III" value={employee.classification_iii} name="classification_iii" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('classification_iii')}>
                   <div className="flex items-center gap-1.5 mt-1 w-full">
                     <select 
                       className="flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring w-full"
                       value={employee.classification_iii || "New"}
                       onChange={(e) => onChange('classification_iii', e.target.value)}
                     >
                       {classIIIOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     </select>
                     {isAdminEditing && (
                       <Button
                         type="button"
                         variant="outline"
                         size="icon"
                         className="h-8 w-8 shrink-0 border-slate-200"
                         onClick={() => setShowClassIIIModal(true)}
                       >
                         <Edit2 className="w-3.5 h-3.5" />
                       </Button>
                     )}
                   </div>
                </InfoRow>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 border-t pt-2 mt-2">
                <InfoRow label="Position" value={employee.position} name="position" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('position')} isError={!!errors.position}>
                  <div className="space-y-2 mt-1">
                    {positions.map((pos, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={pos}
                          onChange={(e) => handlePositionChange(idx, e.target.value)}
                          placeholder={`Position #${idx + 1}`}
                          className="h-8 text-sm w-full max-w-[220px]"
                        />
                        {positions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemovePositionField(idx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-dashed border-2 border-slate-200 hover:border-primary text-slate-500 hover:text-primary gap-1 px-3 mt-1"
                      onClick={handleAddPositionField}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Position
                    </Button>
                  </div>
                </InfoRow>
                <InfoRow label="Department/Offices" value={displayDepts.join(', ') || "—"} name="department" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('department')} isError={!!errors.department}>
                  {!employee.id ? (
                    <select 
                      className={`flex h-8 w-full max-w-sm items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring mt-1 ${errors.department ? 'border-red-500 ring-red-500' : ''}`}
                      value={employee.department || ""}
                      onChange={(e) => onChange('department', e.target.value)}
                      disabled={deptsLoading}
                    >
                      <option value="" disabled>{deptsLoading ? 'Loading...' : 'Select Department'}</option>
                      {academicDepts.length > 0 && (
                        <optgroup label="Academic">
                          {academicDepts.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                        </optgroup>
                      )}
                      {nonAcademicDepts.length > 0 && (
                        <optgroup label="Non-Academic">
                          {nonAcademicDepts.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                        </optgroup>
                      )}
                    </select>
                  ) : (
                    <div className="mt-1">
                      {displayDepts.length > 0 ? (
                        <div className="space-y-2 mt-1">
                          {displayDepts.map(name => {
                            const isHighlighted = employee.department === name;
                            return (
                              <div key={name} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 max-w-sm gap-4">
                                <Badge variant="secondary" className={cn(
                                  "font-bold truncate max-w-[200px]",
                                  isHighlighted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"
                                )}>
                                  {name}
                                </Badge>
                                {isAdminEditing && !isHighlighted && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-6 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-bold text-[10px] uppercase tracking-wider border border-indigo-100 rounded-md"
                                    onClick={() => onChange('department', name)}
                                  >
                                    Highlight
                                  </Button>
                                )}
                                {isHighlighted && (
                                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider px-2">
                                    Highlighted
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Unassigned (change in University Chart)</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1.5 font-medium italic">
                        * Assignments must be managed via the University Chart.
                      </p>
                    </div>
                  )}
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
            {!isReadOnly ? (
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

      {/* Classification III Manage Options Modal */}
      <Dialog open={showClassIIIModal} onOpenChange={setShowClassIIIModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Classification III Options</DialogTitle>
            <DialogDescription>
              Add or remove values for the Classification III dropdown list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="New Classification III option..."
                value={newClassIIIOption}
                onChange={(e) => setNewClassIIIOption(e.target.value)}
                disabled={isClassIIISaving}
                className="h-9"
              />
              <Button 
                onClick={handleAddClassIIIOption} 
                disabled={isClassIIISaving || !newClassIIIOption.trim()}
                className="h-9 font-bold"
              >
                Add
              </Button>
            </div>
            <div className="border rounded-lg max-h-[200px] overflow-y-auto divide-y">
              {classIIIOptions.map((opt) => (
                <div key={opt} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-slate-700">{opt}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isClassIIISaving || classIIIOptions.length <= 1}
                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteClassIIIOption(opt)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setShowClassIIIModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
