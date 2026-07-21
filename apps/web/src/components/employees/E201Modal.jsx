import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, Award, Briefcase, CalendarDays, AlertCircle, Check, X, Save, Edit3, ShieldCheck, Gift, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PersonalDetailsTab from "./profile/PersonalDetailsTab";
import EducationTab from "./profile/EducationTab";
import TrainingDevTab from "./profile/TrainingDevTab";
import EmploymentInfoTab from "./profile/EmploymentInfoTab";
import SemestralRecordsTab from "./profile/SemestralRecordsTab";
import LeaveTab from "./profile/LeaveTab";
import BenefitsTab from "./profile/BenefitsTab";

export default function E201Modal({ employee, open, onOpenChange, onToggleActive, onSave, isAdminView = true, initialTab = "profiling", initialEditMode = false }) {
  const [editedEmployee, setEditedEmployee] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("profiling");
  const [leaveCredits, setLeaveCredits] = useState([]);
  const [headOfUnit, setHeadOfUnit] = useState(null);

  const pendingRequests = employee?.pendingRequests || [];
  const activeRequest = pendingRequests[0];
  const requestedChanges = activeRequest?.requested_changes || null;
  const baselineEmployee = employee
    ? { ...employee, pendingRequests: undefined }
    : null;

  const getReviewEmployee = () => {
    if (!baselineEmployee) return null;
    if (!requestedChanges) return { ...baselineEmployee };
    return { ...baselineEmployee, ...requestedChanges };
  };

  const [leaveApps, setLeaveApps] = useState([]);
  const [localSemesters, setLocalSemesters] = useState([]);
  const [baselineSemesters, setBaselineSemesters] = useState([]);

  const fetchLeaveData = async (targetId = employee?.id) => {
    if (!targetId) return;
    const [creditsRes, appsRes, semRes] = await Promise.all([
      supabase.from('leave_credits').select('*').eq('employee_id', targetId),
      supabase.from('leave_applications').select('*').eq('employee_id', targetId).order('created_at', { ascending: false }),
      supabase.from('employee_semesters').select('*').eq('employee_id', targetId).order('academic_year', { ascending: false })
    ]);
    if (creditsRes.data) setLeaveCredits(creditsRes.data);
    if (appsRes.data) setLeaveApps(appsRes.data);
    if (semRes.data) {
      setLocalSemesters(semRes.data);
      setBaselineSemesters(semRes.data);
    }
  };

  useEffect(() => {
    if (open && employee) {
      setEditedEmployee(getReviewEmployee());
      setIsEditMode(initialEditMode);
      setActiveTab(initialTab);
      fetchLeaveData();

      // Fetch head status
      const fetchHeadStatus = async () => {
        const { data } = await supabase
          .from('org_units')
          .select('name, parent_id')
          .eq('head_id', employee.id)
          .maybeSingle();
        
        if (data) {
          // Only the head of the absolute root node (parent_id IS NULL) is the University President.
          const isPresident = data.parent_id === null;
          setHeadOfUnit({ name: data.name, isPresident });
        } else {
          setHeadOfUnit(null);
        }
      };
      fetchHeadStatus();
    }
  }, [employee, open, activeRequest?.id, initialTab, initialEditMode]);

  if (!employee || !editedEmployee) return null;

  const handleAction = async (req, status) => {
    try {
      if (status === 'approved') {
        // Sanitize changes: convert empty strings to nulls for DB compatibility
        const sanitizedChanges = Object.fromEntries(
          Object.entries(req.requested_changes).map(([key, value]) => [
            key,
            value === "" ? null : value
          ])
        );

        const { error: updateError } = await supabase
          .from('employees')
          .update(sanitizedChanges)
          .eq('id', req.employee_id);
          
        if (updateError) throw updateError;
      }

      const { error } = await supabase
        .from('employee_update_requests')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', req.id);

      if (error) throw error;

      // Notify the employee
      await supabase.from('notifications').insert({
        employee_id: req.employee_id,
        type: status === 'approved' ? 'approved' : 'rejected',
        title: `Profile Update ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: status === 'approved' 
          ? "Your profile update request has been approved and applied." 
          : "Your profile update request was rejected by the HR administration."
      });

      // Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: status === 'approved' ? 'admin_approved_update' : 'admin_rejected_update',
        description: `${status === 'approved' ? 'Approved' : 'Rejected'} profile update for ${editedEmployee.first_name} ${editedEmployee.last_name}`,
        employee_id: req.employee_id,
        metadata: { request_id: req.id }
      });

      // Automatically recalculate benefits eligibility for this employee if approved
      if (status === 'approved') {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await fetch('/api/run-benefits-computation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token ?? ''}`,
            },
            body: JSON.stringify({ employee_id: req.employee_id, year: new Date().getFullYear() }),
          });
        } catch (e) {
          console.warn('Benefits recalculation failed:', e);
        }
      }

      toast.success(`Request ${status} successfully.`);
      onOpenChange(false); // Close the modal
      if (onSave) onSave();
    } catch (err) {
      toast.error(`Failed to ${status} request: ${err.message}`);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const parseTeachingLoad = (val) => {
      if (val === null || val === undefined || String(val).trim() === "") return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    try {
      // Validation for reactivation if employee was inactive
      if (baselineEmployee && !baselineEmployee.is_active) {
        const empStatus = editedEmployee.employment_status;
        const empTenure = editedEmployee.employment_tenure;
        const empClass = editedEmployee.employment_classification;
        const empClassII = editedEmployee.classification_ii;
        
        if (!empStatus || !empTenure || !empClass || !empClassII) {
          toast.error("Reactivation failed: Employment Status, Tenure, Classification I, and Classification II are required fields.");
          setIsSaving(false);
          return;
        }
        
        // Auto-set is_active to true upon successful save
        editedEmployee.is_active = true;

        // Auto-set classification_iii to Rehired if employee was Resigned or Retired
        if (['resigned', 'retired'].includes(baselineEmployee.classification_iii?.toLowerCase()) || ['resigned', 'retired'].includes(editedEmployee.classification_iii?.toLowerCase())) {
          editedEmployee.classification_iii = 'Rehired';
        }
      }

      // Auto-transition New to Resident if date_hired is >= 12 months ago
      if (editedEmployee.date_hired && (editedEmployee.classification_iii === 'New' || !editedEmployee.classification_iii)) {
        const hired = new Date(editedEmployee.date_hired);
        const today = new Date();
        const months = (today.getFullYear() - hired.getFullYear()) * 12 + (today.getMonth() - hired.getMonth());
        if (months >= 12) {
          editedEmployee.classification_iii = 'Resident';
        }
      }

      // Save semester changes
      const deletedIds = baselineSemesters
        .filter(b => !localSemesters.some(l => l.id === b.id))
        .map(b => b.id);

      const insertedRows = localSemesters.filter(l => String(l.id).startsWith('temp-'));

      const updatedRows = localSemesters.filter(l => {
        if (String(l.id).startsWith('temp-')) return false;
        const base = baselineSemesters.find(b => b.id === l.id);
        if (!base) return false;
        return (
          base.academic_year !== l.academic_year ||
          base.semester !== l.semester ||
          base.teaching_load !== l.teaching_load ||
          base.is_active !== l.is_active
        );
      });

      const dbClient = supabase;

      if (deletedIds.length > 0) {
        const { error: delErr } = await dbClient.from('employee_semesters').delete().in('id', deletedIds);
        if (delErr) throw delErr;
      }

      if (insertedRows.length > 0) {
        const inserts = insertedRows.map(({ id, ...rest }) => ({
          ...rest,
          employee_id: editedEmployee.id,
          teaching_load: parseTeachingLoad(rest.teaching_load)
        }));
        const { error: insErr } = await dbClient.from('employee_semesters').insert(inserts);
        if (insErr) throw insErr;
      }

      if (updatedRows.length > 0) {
        for (const row of updatedRows) {
          const payload = {
            academic_year: row.academic_year,
            semester: row.semester,
            is_active: row.is_active,
            teaching_load: parseTeachingLoad(row.teaching_load)
          };
          const { error: updErr } = await dbClient.from('employee_semesters').update(payload).eq('id', row.id);
          if (updErr) throw updErr;
        }
      }

      // Remove joined properties before updating the employee record
      const updateData = { ...editedEmployee };
      delete updateData.pendingRequests;

      // Sanitize empty strings to null for better database compatibility across all fields (prevents 400 errors on numeric/date columns)
      const sanitizedUpdateData = Object.fromEntries(
        Object.entries(updateData).map(([key, value]) => [
          key,
          value === "" ? null : value
        ])
      );
      
      const { error } = await supabase
        .from('employees')
        .update(sanitizedUpdateData)
        .eq('id', editedEmployee.id);
        
      if (error) throw error;
      
      // Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: 'admin_edited_employee',
        description: `Manually edited employee record for ${editedEmployee.first_name} ${editedEmployee.last_name}`,
        employee_id: editedEmployee.id
      });

      // Automatically recalculate benefits eligibility for this employee
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch('/api/run-benefits-computation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ employee_id: editedEmployee.id, year: new Date().getFullYear() }),
        });
      } catch (e) {
        console.warn('Benefits recalculation failed:', e);
      }

      // Re-fetch fresh semester & leave data to sync baseline and local states
      await fetchLeaveData(editedEmployee.id);

      toast.success("Employee changes saved successfully.");
      if (onSave) onSave();
      setIsEditMode(false);
      onOpenChange(false);
    } catch (err) {
      toast.error(`Failed to save changes: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedEmployee(prev => ({ ...prev, [field]: value }));
    // For direct DB updates in the tab (photo/signature), notify parent to refresh list
    if ((field === 'photo_url' || field === 'signature_url') && onSave) {
      onSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[85vh] xl:max-w-7xl p-0 rounded-2xl border border-slate-200 shadow-none overflow-hidden flex flex-col bg-white">
        {pendingRequests.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-50">
            <div>
              <p className="text-amber-800 font-bold text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Reviewing Profile Update Request
              </p>
              <div className="text-xs text-amber-700 mt-0.5 flex flex-col md:flex-row md:items-center gap-2">
                <span className="font-medium italic">The fields highlighted in amber have pending changes.</span>
                <span className="hidden md:inline">•</span>
                <span className="opacity-70 text-2xs">Verify details before approving.</span>
              </div>
            </div>
          </div>
        )}

        <DialogHeader className="px-6 pt-5 pb-2 flex flex-row items-center justify-between shrink-0 bg-white">
          <div>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2 flex-wrap">
              {editedEmployee.first_name} {editedEmployee.last_name}{editedEmployee.titles ? `, ${editedEmployee.titles}` : ""}
              {headOfUnit && (
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-2xs px-2 py-0.5 uppercase tracking-wider font-bold">
                  {headOfUnit.isPresident ? headOfUnit.name : `Head of ${headOfUnit.name}`}
                </Badge>
              )}
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const activeLeave = leaveApps.find(app => 
                  app.status === 'approved' && 
                  app.start_date <= todayStr && 
                  app.end_date >= todayStr
                );
                if (activeLeave) {
                  return (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-2xs px-2 py-0.5 font-bold uppercase tracking-wider">
                      On {activeLeave.leave_type} Leave
                    </Badge>
                  );
                }
                return null;
              })()}
            </DialogTitle>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {editedEmployee.employee_id || "No ID"} • {editedEmployee.department || "No Dept"} • {editedEmployee.position || "No Position"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isEditMode ? (
              <Button onClick={() => setIsEditMode(true)} className="h-8 text-xs font-bold rounded-lg shadow-none gap-1.5 bg-[#0C005F] hover:bg-[#0C005F]/90 text-white px-4 border border-slate-200">
                 <Edit3 className="w-3.5 h-3.5" /> Edit Details
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setIsEditMode(false); setEditedEmployee(getReviewEmployee()); }} className="h-8 text-xs font-bold rounded-lg shadow-none border-slate-200">Cancel</Button>
                <Button onClick={handleSaveAll} disabled={isSaving} className="h-8 text-xs font-bold rounded-lg shadow-none gap-1.5 bg-[#0C005F] hover:bg-[#0C005F]/90 text-white px-4 border border-slate-200">
                   <Save className="w-3.5 h-3.5" />
                   {isSaving ? "Saving..." : (baselineEmployee && !baselineEmployee.is_active ? "Reactivate & Save" : "Save Admin Changes")}
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-6 py-2 shrink-0 bg-slate-50/50 border-b border-slate-100">
            <TabsList className="w-full flex bg-slate-100/80 border border-slate-200 rounded-xl p-1 gap-1 h-auto shrink-0 shadow-none">
              <TabsTrigger value="profiling" className="flex-1 justify-center py-2 text-xs font-bold rounded-lg text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-1.5">
                <User className="w-3.5 h-3.5" />
                Personal Details
              </TabsTrigger>
              <TabsTrigger value="education" className="flex-1 justify-center py-2 text-xs font-bold rounded-lg text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Educational Record
              </TabsTrigger>
              <TabsTrigger value="training" className="flex-1 justify-center py-2 text-xs font-bold rounded-lg text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Trainings and Development
              </TabsTrigger>
              <TabsTrigger value="employment" className="flex-1 justify-center py-2 text-xs font-bold rounded-lg text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Employment Info
              </TabsTrigger>
              <TabsTrigger value="semestral" className="flex-1 justify-center py-2 text-xs font-bold rounded-lg text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Semestral Records
              </TabsTrigger>
              <TabsTrigger value="leave" className="flex-1 justify-center py-2 text-xs font-bold rounded-lg text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Leave Credits
              </TabsTrigger>
              <TabsTrigger value="benefits" className="flex-1 justify-center py-2 text-xs font-bold rounded-lg text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                Benefits
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">
            <TabsContent value="profiling" className="mt-0">
              <PersonalDetailsTab 
                employee={editedEmployee} 
                onChange={handleFieldChange} 
                onToggleActive={onToggleActive} 
                isReadOnly={!isEditMode} 
                isEditMode={isEditMode}
                isAdminView={true}
                requestedChanges={requestedChanges} 
              />
            </TabsContent>
            <TabsContent value="education" className="mt-0">
              <EducationTab 
                employee={editedEmployee} 
                isReadOnly={!isEditMode} 
                isEditing={isEditMode}
                onUpdate={(newData) => handleFieldChange('educational_record', newData)}
                requestedChanges={requestedChanges} 
              />
            </TabsContent>
            <TabsContent value="training" className="mt-0">
              <TrainingDevTab 
                employee={editedEmployee} 
                isReadOnly={!isEditMode} 
                isEditing={isEditMode}
                onUpdate={(field, newData) => handleFieldChange(field, newData)}
                requestedChanges={requestedChanges} 
              />
            </TabsContent>
            <TabsContent value="employment" className="mt-0">
              <EmploymentInfoTab 
                employee={editedEmployee} 
                onChange={handleFieldChange} 
                isReadOnly={!isEditMode} 
                isAdminView={true}
                requestedChanges={requestedChanges} 
              />
            </TabsContent>
            <TabsContent value="semestral" className="mt-0">
              <SemestralRecordsTab 
                employee={editedEmployee} 
                semesters={localSemesters}
                onSemestersChange={setLocalSemesters}
                isReadOnly={!isEditMode} 
                isAdminView={true}
              />
            </TabsContent>
            <TabsContent value="leave" className="mt-0">
              <LeaveTab 
                employee={editedEmployee} 
                onRefresh={() => {
                  // Refetch credits after update
                  const fetchLeaveData = async () => {
                     if (!employee?.id) return;
                     const [creditsRes, appsRes] = await Promise.all([
                       supabase.from('leave_credits').select('*').eq('employee_id', employee.id),
                       supabase.from('leave_applications').select('*').eq('employee_id', employee.id).order('created_at', { ascending: false })
                     ]);
                     if (creditsRes.data) setLeaveCredits(creditsRes.data);
                     if (appsRes.data) setLeaveApps(appsRes.data);
                   };
                   fetchLeaveData();
                }} 
                isReadOnly={!isEditMode} 
                requestedChanges={requestedChanges ? baselineEmployee : null}
                leaveCredits={leaveCredits}
                leaveApplications={leaveApps}
                isAdminView={true}
              />
            </TabsContent>
            <TabsContent value="benefits" className="mt-0">
              <BenefitsTab employee={editedEmployee} />
            </TabsContent>
          </div>
        </Tabs>

        {pendingRequests.length > 0 && activeRequest?.status === 'pending' && (
          <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0 z-50">
             <div className="mr-auto text-xs font-semibold text-slate-500">
               {pendingRequests.length} pending request(s) for this employee
             </div>
             <Button variant="outline" onClick={() => handleAction(pendingRequests[0], 'rejected')} className="h-8 text-xs font-bold rounded-lg shadow-none gap-1.5 text-rose-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700">
               <X className="w-3.5 h-3.5" /> Reject Request
             </Button>
             <Button onClick={() => handleAction(pendingRequests[0], 'approved')} className="h-8 text-xs font-bold rounded-lg shadow-none gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-6">
               <Check className="w-3.5 h-3.5" /> Approve Changes
             </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}