import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, CalendarClock, PenTool, BookOpen, Trash2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EMPLOYMENT_CLASSIFICATIONS } from "@/utils/constants";
import { useOrgDepartments } from "@/hooks/useOrgDepartments";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
  const { academicDepts, nonAcademicDepts, isLoading: deptsLoading } = useOrgDepartments();
  const checkUpdated = (name) => {
    if (!requestedChanges) return false;
    return Object.prototype.hasOwnProperty.call(requestedChanges, name);
  };

  // ── Semester Records State ────────────────────────────────────────────────
  const [semesters, setSemesters] = useState([]);
  const [semLoading, setSemLoading] = useState(false);
  const [addingRow, setAddingRow] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];
  const currentYear = new Date().getFullYear();
  const defaultNewRow = () => ({
    academic_year: `${currentYear}-${currentYear + 1}`,
    semester: "1st Semester",
    is_active: true,
    teaching_load: "",
  });
  const [newRow, setNewRow] = useState(defaultNewRow());
  const [editRow, setEditRow] = useState(null);
  const isTeaching = employee?.employment_classification?.toLowerCase() === 'teaching';

  useEffect(() => {
    if (!employee?.id) return;
    async function fetchSemesters() {
      setSemLoading(true);
      const { data, error } = await supabase
        .from('employee_semesters')
        .select('*')
        .eq('employee_id', employee.id)
        .order('academic_year', { ascending: false })
        .order('semester', { ascending: true });
      if (!error) setSemesters(data || []);
      setSemLoading(false);
    }
    fetchSemesters();
  }, [employee?.id]);

  const handleAddSemester = async () => {
    if (!newRow.academic_year || !newRow.semester) {
      toast.error("Academic year and semester are required."); return;
    }
    const payload = {
      employee_id: employee.id,
      academic_year: newRow.academic_year,
      semester: newRow.semester,
      is_active: newRow.is_active,
      teaching_load: isTeaching && newRow.teaching_load !== "" ? parseFloat(newRow.teaching_load) : null,
    };
    const { data, error } = await supabase.from('employee_semesters').insert(payload).select().single();
    if (error) { toast.error("Failed to add semester record."); return; }
    setSemesters(prev => [data, ...prev]);
    setNewRow(defaultNewRow());
    setAddingRow(false);
    toast.success("Semester record added.");
  };

  const handleSaveEdit = async () => {
    const payload = {
      academic_year: editRow.academic_year,
      semester: editRow.semester,
      is_active: editRow.is_active,
      teaching_load: isTeaching && editRow.teaching_load !== "" ? parseFloat(editRow.teaching_load) : null,
    };
    const { error } = await supabase.from('employee_semesters').update(payload).eq('id', editRow.id);
    if (error) { toast.error("Failed to save changes."); return; }
    setSemesters(prev => prev.map(s => s.id === editRow.id ? { ...s, ...payload } : s));
    setEditingId(null);
    toast.success("Semester record updated.");
  };

  const handleDeleteSemester = async (id) => {
    const { error } = await supabase.from('employee_semesters').delete().eq('id', id);
    if (error) { toast.error("Failed to delete semester record."); return; }
    setSemesters(prev => prev.filter(s => s.id !== id));
    toast.success("Semester record deleted.");
  };
  // ─────────────────────────────────────────────────────────────────────────

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
                    {["Regular", "Probationary", "Contractual"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
               </InfoRow>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 border-t pt-2 mt-2">
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

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 border-t pt-2 mt-2">
                <InfoRow label="Present Rank" value={employee.present_rank} name="present_rank" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('present_rank')} />
                <InfoRow label="Rank Start" value={employee.present_rank_start} name="present_rank_start" type="date" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('present_rank_start')} />
                <InfoRow label="Rank End" value={employee.present_rank_end} name="present_rank_end" type="date" onChange={onChange} isReadOnly={!isAdminEditing} isUpdated={checkUpdated('present_rank_end')} />
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 border-t pt-2 mt-2">
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
      {/* Semester Records */}
      <Card className="shadow-sm border-slate-300 lg:col-span-2">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Semester Records
          </CardTitle>
          {isAdminView && !isReadOnly && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              onClick={() => { setAddingRow(true); setEditingId(null); }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Semester
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {semLoading ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Loading...</p>
          ) : (
            <div className="space-y-2">
              {/* Add Row */}
              {addingRow && (
                <div className="grid grid-cols-12 gap-2 items-center bg-indigo-50/60 border border-indigo-100 rounded-lg p-3">
                  <div className="col-span-3">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Academic Year</p>
                    <Input className="h-7 text-xs" value={newRow.academic_year}
                      onChange={e => setNewRow(r => ({ ...r, academic_year: e.target.value }))}
                      placeholder="e.g. 2025-2026" />
                  </div>
                  <div className="col-span-3">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Semester</p>
                    <select className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm"
                      value={newRow.semester} onChange={e => setNewRow(r => ({ ...r, semester: e.target.value }))}>
                      {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {isTeaching && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Teaching Load</p>
                      <Input className="h-7 text-xs" type="number" step="0.5" min="0"
                        value={newRow.teaching_load}
                        onChange={e => setNewRow(r => ({ ...r, teaching_load: e.target.value }))}
                        placeholder="units" />
                    </div>
                  )}
                  <div className="col-span-2 flex items-center gap-2 pt-4">
                    <label className="flex items-center gap-1 text-xs font-medium cursor-pointer">
                      <input type="checkbox" className="rounded" checked={newRow.is_active}
                        onChange={e => setNewRow(r => ({ ...r, is_active: e.target.checked }))} />
                      Active
                    </label>
                  </div>
                  <div className="col-span-2 flex gap-1 pt-4 justify-end">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={handleAddSemester}><Check className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:bg-slate-100" onClick={() => setAddingRow(false)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              )}

              {/* Table Header */}
              {semesters.length > 0 && (
                <div className="grid grid-cols-12 gap-2 px-3 py-1">
                  <p className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year</p>
                  <p className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester</p>
                  {isTeaching && <p className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Load (units)</p>}
                  <p className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                </div>
              )}

              {/* Rows */}
              {semesters.map(sem => (
                <div key={sem.id} className="grid grid-cols-12 gap-2 items-center border rounded-lg px-3 py-2 bg-white hover:bg-slate-50/50 transition-colors">
                  {editingId === sem.id ? (
                    <>
                      <div className="col-span-3">
                        <Input className="h-7 text-xs" value={editRow.academic_year}
                          onChange={e => setEditRow(r => ({ ...r, academic_year: e.target.value }))} />
                      </div>
                      <div className="col-span-3">
                        <select className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm"
                          value={editRow.semester} onChange={e => setEditRow(r => ({ ...r, semester: e.target.value }))}>
                          {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      {isTeaching && (
                        <div className="col-span-2">
                          <Input className="h-7 text-xs" type="number" step="0.5" min="0"
                            value={editRow.teaching_load ?? ""}
                            onChange={e => setEditRow(r => ({ ...r, teaching_load: e.target.value }))} />
                        </div>
                      )}
                      <div className="col-span-2">
                        <label className="flex items-center gap-1 text-xs font-medium cursor-pointer">
                          <input type="checkbox" checked={editRow.is_active}
                            onChange={e => setEditRow(r => ({ ...r, is_active: e.target.checked }))} />
                          Active
                        </label>
                      </div>
                      <div className="col-span-2 flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={handleSaveEdit}><Check className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:bg-slate-100" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="col-span-3 text-sm font-bold">{sem.academic_year}</p>
                      <p className="col-span-3 text-sm text-slate-600">{sem.semester}</p>
                      {isTeaching && <p className="col-span-2 text-sm font-bold text-indigo-600">{sem.teaching_load ?? "—"}</p>}
                      <div className="col-span-2">
                        <Badge className={sem.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}
                          variant="outline">
                          {sem.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {isAdminView && !isReadOnly && (
                        <div className="col-span-2 flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => { setEditingId(sem.id); setEditRow({ ...sem }); setAddingRow(false); }}>
                            <PenTool className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteSemester(sem.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {semesters.length === 0 && !addingRow && (
                <div className="border rounded-md border-dashed py-8 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/10">
                  <BookOpen className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No semester records yet.</p>
                  {isAdminView && !isReadOnly && (
                    <p className="text-xs mt-1">Click "Add Semester" above to get started.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
