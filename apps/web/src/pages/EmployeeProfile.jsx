import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, GraduationCap, Award, Briefcase, CalendarDays, AlertCircle, Zap, Shield, FileText, Loader2, Info, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import PersonalDetailsTab from "@/components/employees/profile/PersonalDetailsTab";
import EducationTab from "@/components/employees/profile/EducationTab";
import TrainingDevTab from "@/components/employees/profile/TrainingDevTab";
import EmploymentInfoTab from "@/components/employees/profile/EmploymentInfoTab";
import LeaveTab from "@/components/employees/profile/LeaveTab";
import SkillsTab from "@/components/employees/profile/SkillsTab";
import CredentialsTab from "@/components/employees/profile/CredentialsTab";
import EditProfileDialog from "@/components/employees/profile/EditProfileDialog";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, X } from "lucide-react";

export default function EmployeeProfile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [employeeData, setEmployeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        setEmployeeData(data);
      } catch (err) {
        console.error("Error loading employee profile", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleStartEdit = () => {
    setEditedData(JSON.parse(JSON.stringify(employeeData))); // Deep clone
    setIsEditing(true);
  };

  const handleDiscard = () => {
    const isDataChanged = JSON.stringify(employeeData) !== JSON.stringify(editedData);
    if (isDataChanged) {
      setShowDiscardDialog(true);
    } else {
      setIsEditing(false);
      setEditedData(null);
    }
  };

  const confirmDiscard = () => {
    setIsEditing(false);
    setEditedData(null);
    setShowDiscardDialog(false);
  };

  const handleSave = () => {
    setShowSaveDialog(true);
  };

  const confirmSave = async () => {
    setIsSaving(true);
    try {
      // Create update request in supabase
      const { error } = await supabase
        .from('employee_update_requests')
        .insert({
          employee_id: employeeData.id,
          requested_changes: editedData,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Changes Submitted",
        description: "Your updates have been sent for HR approval.",
      });
      setIsEditing(false);
      setEditedData(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error saving changes",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setShowSaveDialog(false);
    }
  };

  const handleFieldChange = (name, value) => {
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading your profile...</div>;
  }

  if (!employeeData) {
    // Fallback if data is missing
    return (
      <Card className="border-red-200 bg-red-50 text-red-800">
        <CardContent className="p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>Your employee profile could not be loaded. Please contact HR.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      {/* Top Standardized Header */}
      <div className="bg-[#0C005F] text-white py-4 px-8 flex justify-between items-center shadow-md z-10 shrink-0">
        <div className="flex items-center gap-6">
          <img
            src="/assets/ub-hris-logo-white.png"
            alt="UB HRIS"
            className="h-10 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'block';
            }}
          />
          <FileText className="w-8 h-8 text-white/80 hidden" />
          <div>
            <h1 className="text-xl font-bold leading-none">Personnel Information</h1>
            <p className="text-xs text-white/70 mt-1 uppercase tracking-wider">Digital 201 Form</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isEditing ? (
            <Button 
              onClick={handleStartEdit}
              className="bg-white text-[#0C005F] hover:bg-white/90 font-bold gap-2"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Update Information
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30 text-[10px] font-bold uppercase tracking-widest animate-pulse">
              Editing Mode
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={logout} 
            title="Log out" 
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 md:p-8">
        <div className="max-w-[1800px] mx-auto h-full flex flex-col">
          <Tabs defaultValue="profiling" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full grid grid-cols-6 bg-white border shadow-sm h-10 p-1 mb-6">
              <TabsTrigger value="profiling" className="gap-2 text-[11px] h-8 font-bold data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                <User className="w-4 h-4" />
                Personal Data
              </TabsTrigger>
              <TabsTrigger value="education" className="gap-2 text-[11px] h-8 font-bold data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                <GraduationCap className="w-4 h-4" />
                Educational Record
              </TabsTrigger>
              <TabsTrigger value="training" className="gap-2 text-[11px] h-8 font-bold data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                <Award className="w-4 h-4" />
                Trainings
              </TabsTrigger>
              <TabsTrigger value="credentials" className="gap-2 text-[11px] h-8 font-bold data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                <Shield className="w-4 h-4" />
                Credentials & Skills
              </TabsTrigger>
              <TabsTrigger value="employment" className="gap-2 text-[11px] h-8 font-bold data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                <Briefcase className="w-4 h-4" />
                Employment Info
              </TabsTrigger>
              <TabsTrigger value="leave" className="gap-2 text-[11px] h-8 font-bold data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                <CalendarDays className="w-4 h-4" />
                Leave Credits
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 pr-4">
              <TabsContent value="profiling" className="m-0 space-y-6">
                <PersonalDetailsTab 
                  employee={isEditing ? editedData : employeeData} 
                  isReadOnly={!isEditing} 
                  showPhotoUpload={true} 
                  onChange={handleFieldChange}
                />
              </TabsContent>
              <TabsContent value="education" className="m-0 space-y-6">
                <EducationTab 
                  employee={isEditing ? editedData : employeeData} 
                  isReadOnly={!isEditing} 
                  isEditing={isEditing}
                  onUpdate={(newData) => handleFieldChange('educational_record', newData)}
                />
              </TabsContent>
              <TabsContent value="training" className="m-0 space-y-6">
                <TrainingDevTab 
                  employee={isEditing ? editedData : employeeData} 
                  isReadOnly={!isEditing} 
                  isEditing={isEditing}
                  onUpdate={(field, newData) => handleFieldChange(field, newData)}
                />
              </TabsContent>
              <TabsContent value="credentials" className="m-0 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <CredentialsTab 
                    employee={isEditing ? editedData : employeeData} 
                    isEditing={isEditing}
                    onUpdate={(field, newData) => handleFieldChange(field, newData)}
                  />
                  <SkillsTab 
                    employee={isEditing ? editedData : employeeData} 
                    isEditing={isEditing}
                    onUpdate={(field, newData) => handleFieldChange(field, newData)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="employment" className="m-0 space-y-6">
                <EmploymentInfoTab employee={isEditing ? editedData : employeeData} isReadOnly={true} />
              </TabsContent>
              <TabsContent value="leave" className="m-0 space-y-6">
                <LeaveTab employee={isEditing ? editedData : employeeData} isReadOnly={true} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      {/* Floating Action Bar */}
      {isEditing && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="bg-white/90 backdrop-blur-md shadow-2xl border-[#0C005F]/20 flex items-center gap-4 px-6 py-4 rounded-2xl">
            <div className="flex flex-col mr-8">
              <p className="text-[10px] font-bold text-[#0C005F] uppercase tracking-widest opacity-60">Editing Profile</p>
              <p className="text-xs font-medium">Unsaved changes will be lost on discard</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleDiscard}
                className="gap-2 border-slate-200 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
                Discard
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#0C005F] text-white hover:bg-[#0C005F]/90 gap-2 px-8 shadow-lg shadow-[#0C005F]/20"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Unsaved Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for Approval?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit these changes? Your updates will be reviewed by HR before they are applied to your official record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Changes</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave} className="bg-[#0C005F] hover:bg-[#0C005F]/90">
              Submit Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
