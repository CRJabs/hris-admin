import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, User, GraduationCap, Award, Briefcase, CalendarDays, AlertCircle, Zap, Shield, FileText, Loader2, Info, LogOut, Gift, Bell, CheckSquare, BookOpen, Menu, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProfileSkeleton } from "@/components/employees/profile/ProfileSkeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const PersonalDetailsTab = lazy(() => import("@/components/employees/profile/PersonalDetailsTab"));
const EducationTab = lazy(() => import("@/components/employees/profile/EducationTab"));
const TrainingDevTab = lazy(() => import("@/components/employees/profile/TrainingDevTab"));
const EmploymentInfoTab = lazy(() => import("@/components/employees/profile/EmploymentInfoTab"));
const LeaveTab = lazy(() => import("@/components/employees/profile/LeaveTab"));
const SemestralRecordsTab = lazy(() => import("@/components/employees/profile/SemestralRecordsTab"));
const BenefitsTab = lazy(() => import("@/components/employees/profile/BenefitsTab"));
const FileRequestModal = lazy(() => import("@/components/employees/profile/FileRequestModal"));
const HomeTab = lazy(() => import("@/components/employees/profile/HomeTab"));
const PendingApprovalsModal = lazy(() => import("@/components/employees/profile/PendingApprovalsModal"));
import EditProfileDialog from "@/components/employees/profile/EditProfileDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays, isAfter, isBefore, addDays } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
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

const getNotificationCategory = (type) => {
  switch (type?.toLowerCase()) {
    case 'info':
      return { label: 'General Information', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'important':
      return { label: 'Important Advisory', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'urgent':
      return { label: 'Urgent Notice', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'event':
      return { label: 'Event / Activity', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'policy':
      return { label: 'Policy Update', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'approved':
      return { label: 'Approval Status', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'rejected':
      return { label: 'Status Update', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'expired':
    case 'expiring':
      return { label: 'License Advisory', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    default:
      return { label: 'General Information', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
};

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
  const [employeeData, setEmployeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [leaveCredits, setLeaveCredits] = useState([]);
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [headOfUnit, setHeadOfUnit] = useState(null);
  const [isInstitutionalHead, setIsInstitutionalHead] = useState(false);
  const [ledUnitIds, setLedUnitIds] = useState([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState(false);
  const [hasTeachingLoad, setHasTeachingLoad] = useState(false);

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

        const { data: credits, error: creditsError } = await supabase
          .from("leave_credits")
          .select("*")
          .eq("employee_id", data.id);
        
        if (!creditsError) {
          setLeaveCredits(credits);
        }

        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
        const { data: apps, error: appsError } = await supabase
          .from("leave_applications")
          .select("*")
          .eq("employee_id", data.id)
          .gte("created_at", oneYearAgo)
          .order("created_at", { ascending: false });
        
        if (!appsError) {
          setLeaveApplications(apps || []);
        }

        const { data: activeSems } = await supabase
          .from("employee_semesters")
          .select("teaching_load")
          .eq("employee_id", data.id)
          .eq("is_active", true);
        const teachingLoad = (activeSems || []).some(
          s => s.teaching_load && parseFloat(s.teaching_load) > 0
        );
        setHasTeachingLoad(teachingLoad);

        const { data: headUnit } = await supabase
          .from('org_units')
          .select('name, parent_id')
          .eq('head_id', data.id)
          .maybeSingle();

        if (headUnit) {
          const isPresident = headUnit.parent_id === null;
          setHeadOfUnit({ name: headUnit.name, isPresident });
        } else {
          setHeadOfUnit(null);
        }

        const { data: allUnits, error: unitsError } = await supabase
          .from("org_units")
          .select("id, name, parent_id, head_id, heads");

        if (!unitsError && allUnits) {
          const ledUnits = allUnits.filter(u => {
            const isLegacyHead = u.head_id === data.id;
            const isJsonHead = u.heads && Array.isArray(u.heads) && u.heads.some(h => h.employee_id === data.id);
            return isLegacyHead || isJsonHead;
          });

          const institutionalLedUnits = ledUnits.filter(u => {
            let current = u;
            while (current) {
              if (current.name?.toLowerCase().includes("departments")) {
                return true;
              }
              if (current.parent_id) {
                current = allUnits.find(parent => parent.id === current.parent_id);
              } else {
                break;
              }
            }
            return false;
          });

          if (institutionalLedUnits.length > 0) {
            setIsInstitutionalHead(true);
            setLedUnitIds(institutionalLedUnits.map(u => u.id));
          } else {
            setIsInstitutionalHead(false);
            setLedUnitIds([]);
          }
        }
      } catch (err) {
        console.error("Error loading employee profile", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();

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
            setEmployeeData(payload.new);
          }
        )
        .subscribe();
    }

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [user]);
  
  const fetchNotifications = async (employeeId) => {
    if (!employeeId) return;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('created_at', sevenDaysAgo)
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
    if (employeeData?.id) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('employee_id', employeeData.id)
        .eq('is_read', false);
    }
  };

  const handleStartEdit = () => {
    setEditedData(JSON.parse(JSON.stringify(employeeData)));
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
      const sanitizedEditedData = Object.fromEntries(
        Object.entries(editedData).map(([key, value]) => [
          key,
          value === "" ? null : value
        ])
      );

      const requestedChanges = buildRequestedChanges(employeeData, sanitizedEditedData);
      if (Object.keys(requestedChanges).length === 0) {
        toast("No changes to submit", {
          description: "Update at least one field before submitting for approval.",
        });
        return;
      }

      const { error } = await supabase
        .from('employee_update_requests')
        .insert({
          employee_id: employeeData.id,
          requested_changes: requestedChanges,
          status: 'pending'
        });

      if (error) throw error;

      await supabase.from('notifications').insert({
        employee_id: employeeData.id,
        type: 'info',
        title: 'Profile Update Submitted',
        message: 'Your profile update request has been submitted and is pending HR review. You will be notified once it has been reviewed.'
      });

      await supabase.from('admin_activity_log').insert({
        actor_type: 'employee',
        actor_name: `${employeeData.first_name} ${employeeData.last_name}`,
        action: 'employee_submitted_update',
        description: `${employeeData.first_name} ${employeeData.last_name} submitted a profile update request`,
        employee_id: employeeData.id
      });

      toast.success("Changes Submitted", {
        description: "Your updates have been sent for HR approval.",
      });
      setIsEditing(false);
      setEditedData(null);
    } catch (err) {
      console.error(err);
      toast.error("Error saving changes", {
        description: err.message,
      });
    } finally {
      setIsSaving(false);
      setShowSaveDialog(false);
    }
  };

  const handleFieldChange = (name, value) => {
    if (isEditing) {
      setEditedData(prev => ({ ...prev, [name]: value }));
      if (name === 'photo_url' || name === 'signature_url') {
        setEmployeeData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setEmployeeData(prev => ({ ...prev, [name]: value }));
    }
  };

  const refreshLeaveData = async () => {
    if (!employeeData?.id) return;
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const [creditsRes, appsRes] = await Promise.all([
      supabase.from("leave_credits").select("*").eq("employee_id", employeeData.id),
      supabase.from("leave_applications").select("*").eq("employee_id", employeeData.id).gte("created_at", oneYearAgo).order("created_at", { ascending: false })
    ]);
    if (creditsRes.data) setLeaveCredits(creditsRes.data);
    if (appsRes.data) setLeaveApplications(appsRes.data);
  };

  useEffect(() => {
    if (!employeeData?.id) return;
    const leaveAppSub = supabase
      .channel(`employee_leave_apps_${employeeData.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leave_applications', filter: `employee_id=eq.${employeeData.id}` },
        () => refreshLeaveData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leave_credits', filter: `employee_id=eq.${employeeData.id}` },
        () => refreshLeaveData()
      )
      .subscribe();
    return () => leaveAppSub.unsubscribe();
  }, [employeeData?.id]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading your profile...</div>;
  }

  if (!employeeData) {
    return (
      <Card className="border-red-200 bg-red-50 text-red-800 rounded-[8px] shadow-none">
        <CardContent className="p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>Your employee profile could not be loaded. Please contact HR.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <div className="bg-[#0C005F] text-white py-3 px-4 flex justify-between items-center border-b border-white/10 shrink-0 z-10">
        <div className="flex items-center gap-3 md:gap-6">
          <img
            src="/assets/ub.png"
            alt="UB"
            className="h-8 w-8 object-contain md:hidden"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <img
            src="/assets/ub-hris-logo-white.png"
            alt="UB HRIS"
            className="hidden md:block h-10 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div>
            <h1 className="text-base md:text-xl font-bold leading-none">Personnel Information</h1>
            <p className="text-[10px] md:text-xs text-white/70 mt-1 uppercase tracking-wider">Digital 201 Form</p>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          {(() => {
            const isExec = (
              employeeData?.classification_ii?.toLowerCase() === "executive" ||
              employeeData?.position?.toLowerCase().includes("president") ||
              employeeData?.position?.toLowerCase().includes("vice president") ||
              employeeData?.position?.toLowerCase().includes("vp")
            );
            const isAcademicHead = !isExec && (
              employeeData?.employment_classification?.toLowerCase() === "academic official" ||
              employeeData?.classification_ii?.toLowerCase() === "academic official"
            );
            const isExecutiveHead = isExec || (headOfUnit !== null && !isAcademicHead);
            const canSeeApprovalsModal = isAcademicHead || isExecutiveHead;

            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-white text-[#0C005F] hover:bg-slate-100 h-9 w-9 border border-slate-200 shadow-none rounded-[8px]"
                    title="Options Menu"
                  >
                    <Menu className="w-5 h-5 text-[#0C005F]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-[8px] border-slate-200 bg-white text-slate-800 shadow-none border">
                  {!isEditing ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => setIsRequestModalOpen(true)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-800 cursor-pointer rounded-[6px] hover:bg-slate-100 focus:bg-slate-100"
                      >
                        <FileText className="w-4 h-4 text-[#0C005F] fill-[#0C005F]" />
                        <span>File a request</span>
                      </DropdownMenuItem>

                      {canSeeApprovalsModal && (
                        <DropdownMenuItem
                          onClick={() => setIsApprovalsModalOpen(true)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-800 cursor-pointer rounded-[6px] hover:bg-slate-100 focus:bg-slate-100"
                        >
                          <CheckSquare className="w-4 h-4 text-[#0C005F] fill-[#0C005F]" />
                          <span>Pending Approvals</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={handleStartEdit}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-800 cursor-pointer rounded-[6px] hover:bg-slate-100 focus:bg-slate-100"
                      >
                        <Zap className="w-4 h-4 text-[#0C005F] fill-[#0C005F]" />
                        <span>Update Information</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem disabled className="px-3 py-2 text-xs font-bold text-amber-600 uppercase">
                      Editing Mode Active
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })()}

          <Popover onOpenChange={(open) => open && handleNotificationOpen()}>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="relative bg-white text-[#0C005F] hover:bg-slate-100 h-9 w-9 border border-slate-200 shadow-none rounded-[8px]"
              >
                <Bell className="h-4 w-4 fill-current" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-2xs font-bold text-white border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[640px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden rounded-[8px] border-slate-200 shadow-none border max-h-[calc(100vh-80px)] flex flex-col" align="end">
              <div className="bg-[#0C005F] p-4 text-white shrink-0 flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Bell className="w-4 h-4" /> System Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge className="bg-amber-500 text-white border-none text-2xs font-bold px-2 py-0.5 rounded-[4px]">
                    {unreadCount} New
                  </Badge>
                )}
              </div>
              <ScrollArea className="flex-1 p-4 max-h-[460px] overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notif) => {
                      const cat = getNotificationCategory(notif.type);
                      return (
                        <div key={notif.id} className="p-3.5 bg-white border border-slate-200 rounded-[8px] space-y-1.5 hover:bg-slate-50/80 transition-colors relative group">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border ${cat.color}`}>
                              {cat.label}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                {notif.date && !isNaN(notif.date) ? format(notif.date, "MMM d, yyyy") : ""}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[4px]"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (notif.id) {
                                    await supabase.from('notifications').delete().eq('id', notif.id);
                                    setNotifications(prev => prev.filter(n => n.id !== notif.id));
                                  }
                                }}
                                title="Delete notification"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-slate-900 leading-snug uppercase tracking-tight pr-6">{notif.title}</p>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">{notif.description}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium">All caught up! No notifications.</p>
                  </div>
                )}
              </ScrollArea>
              {notifications.length > 0 && (
                <div className="p-2 border-t border-slate-200 bg-slate-50 text-center shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-2xs h-7 text-primary hover:text-primary font-bold"
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
            className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="w-full h-full flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-x-auto scrollbar-none shrink-0 mb-3">
              <TabsList className="flex w-max min-w-full bg-white border border-slate-200 shadow-none rounded-[8px] h-10 p-1 gap-1">
                <TabsTrigger value="home" className="flex-1 gap-1.5 text-xs h-8 px-3 font-semibold rounded-[6px] data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none whitespace-nowrap transition-all">
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  <span>Home</span>
                </TabsTrigger>
                <TabsTrigger value="profiling" className="flex-1 gap-1.5 text-xs h-8 px-3 font-semibold rounded-[6px] data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none whitespace-nowrap transition-all">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>Personal Data</span>
                </TabsTrigger>
                <TabsTrigger value="education" className="flex-1 gap-1.5 text-xs h-8 px-3 font-semibold rounded-[6px] data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none whitespace-nowrap transition-all">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>Educational Record</span>
                </TabsTrigger>
                <TabsTrigger value="training" className="flex-1 gap-1.5 text-xs h-8 px-3 font-semibold rounded-[6px] data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none whitespace-nowrap transition-all">
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>Trainings</span>
                </TabsTrigger>
                <TabsTrigger value="employment" className="flex-1 gap-1.5 text-xs h-8 px-3 font-semibold rounded-[6px] data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none whitespace-nowrap transition-all">
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span>Employment Info</span>
                </TabsTrigger>
                {(() => {
                  const isTeaching = employeeData?.employment_classification?.toLowerCase() === "teaching";
                  const showSemestral = isTeaching || hasTeachingLoad;
                  return showSemestral ? (
                    <TabsTrigger value="semestral" className="flex-1 gap-1.5 text-xs h-8 px-3 font-semibold rounded-[6px] data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none whitespace-nowrap transition-all">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>Semestral Records</span>
                    </TabsTrigger>
                  ) : null;
                })()}
                <TabsTrigger value="leave" className="flex-1 gap-1.5 text-xs h-8 px-3 font-semibold rounded-[6px] data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none whitespace-nowrap transition-all">
                  <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                  <span>Leave Credits</span>
                </TabsTrigger>
                <TabsTrigger value="benefits" className="flex-1 gap-1.5 text-xs h-8 px-3 font-semibold rounded-[6px] data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none whitespace-nowrap transition-all">
                  <Gift className="w-3.5 h-3.5 shrink-0" />
                  <span>Benefits</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <Suspense fallback={<ProfileSkeleton />}>
                <TabsContent value="home" className="m-0 h-full flex flex-col">
                  <HomeTab 
                    employee={employeeData} 
                    onViewProfile={() => setActiveTab("profiling")}
                    notifications={notifications}
                    leaveCredits={leaveCredits}
                    leaveApplications={leaveApplications}
                    headOfUnit={headOfUnit}
                  />
                </TabsContent>
                {/* Removed Pending Approvals Tab Content */}
                <TabsContent value="profiling" className="m-0 space-y-6">
                  <PersonalDetailsTab
                    employee={isEditing ? editedData : employeeData}
                    isReadOnly={!isEditing}
                    isEditMode={isEditing}
                    showPhotoUpload={true}
                    onChange={handleFieldChange}
                    isAdminView={false}
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
                  <EmploymentInfoTab 
                    employee={isEditing ? editedData : employeeData} 
                    isReadOnly={!isEditing} 
                    isAdminView={false}
                    onChange={handleFieldChange}
                  />
                </TabsContent>
                {(() => {
                  const isTeaching = employeeData?.employment_classification?.toLowerCase() === "teaching";
                  const showSemestral = isTeaching || hasTeachingLoad;
                  return showSemestral ? (
                    <TabsContent value="semestral" className="m-0 space-y-6">
                      <SemestralRecordsTab 
                        employee={isEditing ? editedData : employeeData} 
                        isReadOnly={true} 
                        isAdminView={false}
                        onChange={handleFieldChange}
                      />
                    </TabsContent>
                  ) : null;
                })()}
                <TabsContent value="leave" className="m-0 space-y-6">
                  <LeaveTab 
                    employee={isEditing ? editedData : employeeData} 
                    isReadOnly={true} 
                    leaveCredits={leaveCredits}
                    leaveApplications={leaveApplications}
                    onRefresh={refreshLeaveData}
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 w-[calc(100%-2rem)] max-w-xl">
          <Card className="bg-white/95 backdrop-blur-md border border-slate-300 shadow-none flex flex-wrap items-center justify-between gap-4 px-5 md:px-6 py-3.5 rounded-[8px]">
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#0C005F] uppercase tracking-widest opacity-60">Editing Profile</p>
              <p className="text-xs font-semibold text-slate-700 whitespace-nowrap">Unsaved changes will be lost on discard</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={handleDiscard}
                className="gap-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 rounded-[6px] font-bold shadow-none"
              >
                <X className="w-4 h-4" />
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#0C005F] text-white hover:bg-[#0C005F]/90 gap-2 px-6 shadow-none rounded-[6px] font-bold"
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

      {/* File Request Modal */}
      <Suspense fallback={null}>
        <FileRequestModal
          open={isRequestModalOpen}
          onOpenChange={setIsRequestModalOpen}
          employee={employeeData}
          leaveCredits={leaveCredits}
          onSuccess={refreshLeaveData}
        />
      </Suspense>

      {/* Pending Approvals Modal */}
      <Suspense fallback={null}>
        {(() => {
          const isExec = (
            employeeData?.classification_ii?.toLowerCase() === "executive" ||
            employeeData?.position?.toLowerCase().includes("president") ||
            employeeData?.position?.toLowerCase().includes("vice president") ||
            employeeData?.position?.toLowerCase().includes("vp")
          );
          const isAcademicHead = !isExec && (
            employeeData?.employment_classification?.toLowerCase() === "academic official" ||
            employeeData?.classification_ii?.toLowerCase() === "academic official"
          );
          const isExecutiveHead = isExec || (headOfUnit !== null && !isAcademicHead);

          return (
            <PendingApprovalsModal
              open={isApprovalsModalOpen}
              onOpenChange={setIsApprovalsModalOpen}
              employee={employeeData}
              ledUnitIds={ledUnitIds}
              isAcademicHead={isAcademicHead}
              isExecutiveHead={isExecutiveHead}
              onSuccess={refreshLeaveData}
            />
          );
        })()}
      </Suspense>
    </div>
  );
}
