import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User, GraduationCap, Award, Briefcase, CalendarDays, AlertCircle, Check, X, Save, Edit3, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PersonalDetailsTab from "./profile/PersonalDetailsTab";
import EducationTab from "./profile/EducationTab";
import TrainingDevTab from "./profile/TrainingDevTab";
import EmploymentInfoTab from "./profile/EmploymentInfoTab";
import LeaveTab from "./profile/LeaveTab";
import CredentialsTab from "./profile/CredentialsTab";
import SkillsTab from "./profile/SkillsTab";

export default function E201Modal({ employee, open, onOpenChange, onToggleActive, onSave }) {
  const [editedEmployee, setEditedEmployee] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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

  useEffect(() => {
    if (open && employee) {
      setEditedEmployee(getReviewEmployee());
      setIsEditMode(false);
    }
  }, [employee, open, activeRequest?.id]);

  if (!employee || !editedEmployee) return null;

  const handleAction = async (req, status) => {
    try {
      if (status === 'approved') {
        const { error: updateError } = await supabase
          .from('employees')
          .update(req.requested_changes)
          .eq('id', req.employee_id);
          
        if (updateError) throw updateError;
      }

      const { error } = await supabase
        .from('employee_update_requests')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', req.id);

      if (error) throw error;
      toast.success(`Request ${status} successfully.`);
      onOpenChange(false); // Close the modal
      if (onSave) onSave();
    } catch (err) {
      toast.error(`Failed to ${status} request: ${err.message}`);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Remove joined properties before updating the employee record
      const updateData = { ...editedEmployee };
      delete updateData.pendingRequests;
      
      const { error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', editedEmployee.id);
        
      if (error) throw error;
      toast.success("Employee changes saved successfully.");
      if (onSave) onSave();
      setIsEditMode(false);
    } catch (err) {
      toast.error(`Failed to save changes: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedEmployee(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0 xl:max-w-7xl">
        {pendingRequests.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-50">
            <div>
              <p className="text-amber-800 font-bold text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Reviewing Profile Update Request
              </p>
              <div className="text-xs text-amber-700 mt-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium italic">The fields highlighted in amber have pending changes.</span>
                  <span className="hidden md:inline">•</span>
                  <span className="opacity-70 text-[10px]">Verify details before approving.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold">
              {editedEmployee.first_name} {editedEmployee.last_name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {editedEmployee.employee_id || "No ID"} • {editedEmployee.department || "No Dept"} • {editedEmployee.position || "No Position"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <Button onClick={() => setIsEditMode(true)} className="gap-2 bg-[#0C005F] hover:bg-[#0C005F]/90">
                 <Edit3 className="w-4 h-4" /> Edit Details
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setIsEditMode(false); setEditedEmployee(getReviewEmployee()); }}>Cancel</Button>
                <Button onClick={handleSaveAll} disabled={isSaving} className="gap-2 bg-[#0C005F] hover:bg-[#0C005F]/90">
                   <Save className="w-4 h-4" />
                   {isSaving ? "Saving..." : "Save Admin Changes"}
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="profiling" className="px-6 pb-6 mt-4">
          <TabsList className="w-full justify-start bg-muted/50 h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="profiling" className="gap-1.5 text-xs data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-sm">
              <User className="w-3.5 h-3.5" />
              Personal Details
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-1.5 text-xs data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-sm">
              <GraduationCap className="w-3.5 h-3.5" />
              Educational Record
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-1.5 text-xs data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Award className="w-3.5 h-3.5" />
              Training & Development
            </TabsTrigger>
            <TabsTrigger value="employment" className="gap-1.5 text-xs data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Briefcase className="w-3.5 h-3.5" />
              Employment Info
            </TabsTrigger>
            <TabsTrigger value="credentials" className="gap-1.5 text-xs data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              Credentials & Skills
            </TabsTrigger>
            <TabsTrigger value="leave" className="gap-1.5 text-xs data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-sm">
              <CalendarDays className="w-3.5 h-3.5" />
              Leave Credits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiling" className="mt-4">
            <PersonalDetailsTab 
              employee={editedEmployee} 
              onChange={handleFieldChange} 
              onToggleActive={onToggleActive} 
              isReadOnly={true} 
              isEditMode={isEditMode}
              requestedChanges={requestedChanges ? baselineEmployee : null} 
            />
          </TabsContent>
          <TabsContent value="education" className="mt-4">
            <EducationTab employee={editedEmployee} isReadOnly={true} requestedChanges={requestedChanges ? baselineEmployee : null} />
          </TabsContent>
          <TabsContent value="training" className="mt-4">
            <TrainingDevTab employee={editedEmployee} isReadOnly={true} requestedChanges={requestedChanges ? baselineEmployee : null} />
          </TabsContent>
          <TabsContent value="employment" className="mt-4">
            <EmploymentInfoTab employee={editedEmployee} onChange={handleFieldChange} isReadOnly={!isEditMode} requestedChanges={requestedChanges ? baselineEmployee : null} />
          </TabsContent>
          <TabsContent value="credentials" className="mt-4">
            <div className="grid grid-cols-1 gap-6">
              <CredentialsTab employee={editedEmployee} isEditing={false} requestedChanges={requestedChanges ? baselineEmployee : null} />
              <SkillsTab employee={editedEmployee} isEditing={false} requestedChanges={requestedChanges ? baselineEmployee : null} />
            </div>
          </TabsContent>
          <TabsContent value="leave" className="mt-4">
            <LeaveTab employee={editedEmployee} onChange={handleFieldChange} isReadOnly={!isEditMode} requestedChanges={requestedChanges ? baselineEmployee : null} />
          </TabsContent>
        </Tabs>

        {pendingRequests.length > 0 && (
          <div className="p-6 border-t bg-muted/20 flex items-center justify-end gap-3 sticky bottom-0 z-50 backdrop-blur-sm">
             <div className="mr-auto text-xs text-muted-foreground">
               {pendingRequests.length} pending request(s) for this employee
             </div>
             <Button variant="outline" onClick={() => handleAction(pendingRequests[0], 'rejected')} className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
               <X className="w-4 h-4" /> Reject Request
             </Button>
             <Button onClick={() => handleAction(pendingRequests[0], 'approved')} className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 px-8">
               <Check className="w-4 h-4" /> Approve Changes
             </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}