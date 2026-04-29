import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, User, GraduationCap, Award, Briefcase, CalendarDays, AlertCircle, Zap, Shield, FileText, Loader2, Info, LogOut, Gift, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProfileSkeleton } from "@/components/employees/profile/ProfileSkeleton";
const PersonalDetailsTab = lazy(() => import("@/components/employees/profile/PersonalDetailsTab"));
const EducationTab = lazy(() => import("@/components/employees/profile/EducationTab"));
const TrainingDevTab = lazy(() => import("@/components/employees/profile/TrainingDevTab"));
const EmploymentInfoTab = lazy(() => import("@/components/employees/profile/EmploymentInfoTab"));
const LeaveTab = lazy(() => import("@/components/employees/profile/LeaveTab"));
const BenefitsTab = lazy(() => import("@/components/employees/profile/BenefitsTab"));
const HomeTab = lazy(() => import("@/components/employees/profile/HomeTab"));
import EditProfileDialog from "@/components/employees/profile/EditProfileDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays, isAfter, isBefore, addDays } from "date-fns";
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

const hasValueChanged = (oldValue, newValue) => {
  if (oldValue === newValue) return false;

  const oldIsObj = oldValue !== null && typeof oldValue === "object";
  const newIsObj = newValue !== null && typeof newValue === "object";
  if (oldIsObj || newIsObj) {
    return JSON.stringify(oldValue ?? null) !== JSON.stringify(newValue ?? null);
  }

  return true;
};

const buildRequestedChanges = (originalData, updatedData) => {
  if (!originalData || !updatedData) return {};

  const changedEntries = Object.keys(updatedData).reduce((acc, key) => {
    if (hasValueChanged(originalData[key], updatedData[key])) {
      acc[key] = updatedData[key];
    }
    return acc;
  }, {});

  return changedEntries;
};

export default function EmployeeProfile() {
  const [activeTab, setActiveTab] = useState("home");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [employeeData, setEmployeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [leaveCredits, setLeaveCredits] = useState([]); // Leave credits balance from DB

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

        // Fetch leave credits
        const { data: credits, error: creditsError } = await supabase
          .from("leave_credits")
          .select("*")
          .eq("employee_id", data.id);
        
        if (!creditsError) {
          setLeaveCredits(credits);
        }
      } catch (err) {
        console.error("Error loading employee profile", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();

    // Set up realtime subscription for this employee's record
    let sub = null;
    if (user?.id) {
      sub = supabase
        .channel(`employee_profile_${user.id}`)
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'employees',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log("Profile updated in realtime", payload);
            setEmployeeData(payload.new);
          }
        )
        .subscribe();
    }

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [user]);
  
  // Fetch notifications from DB and subscribe to realtime updates
  const fetchNotifications = async (employeeId) => {
    if (!employeeId) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setNotifications(data.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        description: n.message,
        date: new Date(n.created_at),
        read: n.is_read
      })));
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  // Check for expiring licenses and upsert notifications if not already stored
  const checkLicenseExpiry = async (emp) => {
    if (!emp?.licenses || !emp?.id) return;
    const today = new Date();
    for (const lic of emp.licenses) {
      if (!lic.expiry || !lic.number) continue;
      const expiryDate = new Date(lic.expiry);
      const daysToExpiry = differenceInDays(expiryDate, today);
      if (daysToExpiry > 90) continue;

      const isExpired = daysToExpiry < 0;
      const refKey = `license-${lic.number}`;

      // Check if a notification for this license already exists
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('employee_id', emp.id)
        .eq('type', isExpired ? 'expired' : 'expiring')
        .ilike('message', `%${lic.number}%`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      await supabase.from('notifications').insert({
        employee_id: emp.id,
        type: isExpired ? 'expired' : 'expiring',
        title: isExpired ? 'License Expired' : 'License Expiring Soon',
        message: isExpired
          ? `Your ${lic.name} license (${lic.number}) expired on ${lic.expiry}. Please renew it as soon as possible.`
          : `Your ${lic.name} license (${lic.number}) will expire in ${daysToExpiry} day(s) on ${lic.expiry}.`
      });
    }
  };

  useEffect(() => {
    if (employeeData?.id) {
      fetchNotifications(employeeData.id);
      checkLicenseExpiry(employeeData);

      // Realtime: listen for new/updated notifications for this employee
      const notifSub = supabase
        .channel(`employee_notifications_${employeeData.id}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `employee_id=eq.${employeeData.id}` },
          () => fetchNotifications(employeeData.id)
        )
        .subscribe();

      return () => notifSub.unsubscribe();
    }
  }, [employeeData?.id]);

  const handleNotificationOpen = async () => {
    setUnreadCount(0);
    // Mark all as read in DB
    if (employeeData?.id) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('employee_id', employeeData.id)
        .eq('is_read', false);
    }
  };

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
      const requestedChanges = buildRequestedChanges(employeeData, editedData);
      if (Object.keys(requestedChanges).length === 0) {
        toast({
          title: "No changes to submit",
          description: "Update at least one field before submitting for approval.",
        });
        return;
      }

      // Create update request in supabase
      const { error } = await supabase
        .from('employee_update_requests')
        .insert({
          employee_id: employeeData.id,
          requested_changes: requestedChanges,
          status: 'pending'
        });

      if (error) throw error;

      // Notify the employee: submission confirmation
      await supabase.from('notifications').insert({
        employee_id: employeeData.id,
        type: 'info',
        title: 'Profile Update Submitted',
        message: 'Your profile update request has been submitted and is pending HR review. You will be notified once it has been reviewed.'
      });

      // Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'employee',
        actor_name: `${employeeData.first_name} ${employeeData.last_name}`,
        action: 'employee_submitted_update',
        description: `${employeeData.first_name} ${employeeData.last_name} submitted a profile update request`,
        employee_id: employeeData.id
      });

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

          <div className="flex items-center gap-2">
            <Popover onOpenChange={(open) => open && handleNotificationOpen()}>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="relative bg-white text-[#0C005F] hover:bg-white/90 shadow-sm border-none"
                >
                  <Bell className="h-5 w-5 fill-current" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 overflow-hidden rounded-xl border-slate-200 shadow-2xl" align="end">
                <div className="bg-[#0C005F] p-4 text-white">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Bell className="w-4 h-4" /> System Notifications
                  </h3>
                </div>
                <ScrollArea className="h-[350px]">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${
                              notif.type === 'approved' ? 'text-green-600' :
                              notif.type === 'rejected' ? 'text-red-600' :
                              notif.type === 'expired' ? 'text-red-600' :
                              notif.type === 'expiring' ? 'text-amber-600' :
                              notif.type === 'info' ? 'text-blue-600' : 'text-primary'
                            }`}>
                              {notif.title}
                            </p>
                            <span className="text-[9px] text-muted-foreground">
                              {notif.date && !isNaN(notif.date) ? format(notif.date, "MMM d") : ""}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-snug">{notif.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-xs font-medium">All caught up!</p>
                    </div>
                  )}
                </ScrollArea>
                {notifications.length > 0 && (
                  <div className="p-2 border-t bg-slate-50 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-6 text-primary hover:text-primary font-bold"
                      onClick={async () => {
                        if (employeeData?.id) {
                          await supabase.from('notifications').delete().eq('employee_id', employeeData.id);
                          setNotifications([]);
                          setUnreadCount(0);
                        }
                      }}
                    >
                      Clear all notifications
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

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
      </div>

      <div className="flex-1 overflow-hidden p-6 md:p-8">
        <div className="max-w-[1800px] mx-auto h-full flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full grid grid-cols-7 bg-white border shadow-sm h-10 p-1 mb-6">
              <TabsTrigger value="home" className="gap-2 text-[11px] h-8 font-bold data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                <Home className="w-4 h-4" />
                Home
              </TabsTrigger>
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
                Trainings and Development
              </TabsTrigger>
              <TabsTrigger value="employment" className="gap-2 text-[11px] h-8 font-bold data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                <Briefcase className="w-4 h-4" />
                Employment Info
              </TabsTrigger>
              <TabsTrigger value="leave" className="gap-2 text-[11px] h-8 font-bold data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                <CalendarDays className="w-4 h-4" />
                Leave Credits
              </TabsTrigger>
              <TabsTrigger value="benefits" className="gap-2 text-[11px] h-8 font-bold data-[state=active]:bg-[#0C005F] data-[state=active]:text-white">
                <Gift className="w-4 h-4" />
                Benefits
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 pr-4">
              <Suspense fallback={<ProfileSkeleton />}>
                <TabsContent value="home" className="m-0 space-y-6">
                  <HomeTab 
                    employee={employeeData} 
                    onViewProfile={() => setActiveTab("profiling")}
                    notifications={notifications}
                    leaveCredits={leaveCredits}
                  />
                </TabsContent>
                <TabsContent value="profiling" className="m-0 space-y-6">
                  <PersonalDetailsTab
                    employee={isEditing ? editedData : employeeData}
                    isReadOnly={!isEditing}
                    isEditMode={isEditing}
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
                <TabsContent value="employment" className="m-0 space-y-6">
                  <EmploymentInfoTab employee={isEditing ? editedData : employeeData} isReadOnly={true} />
                </TabsContent>
                <TabsContent value="leave" className="m-0 space-y-6">
                  <LeaveTab 
                    employee={isEditing ? editedData : employeeData} 
                    isReadOnly={true} 
                    leaveCredits={leaveCredits}
                  />
                </TabsContent>
                <TabsContent value="benefits" className="m-0 space-y-6">
                  <BenefitsTab employee={isEditing ? editedData : employeeData} />
                </TabsContent>
              </Suspense>
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
