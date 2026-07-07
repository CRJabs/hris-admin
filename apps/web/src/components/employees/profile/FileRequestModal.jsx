import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { 
  CalendarDays, AlertTriangle, Loader2, Send, Info, 
  ChevronLeft, FileText, RefreshCw, LogOut, Award 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { resolveCommutationApprovers } from "@/utils/leaveUtils";

const getFridayTwoWeeksAfter = (baseDate = new Date()) => {
  const targetDate = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const dayOfWeek = targetDate.getDay();
  const daysToFriday = 5 - dayOfWeek;
  targetDate.setDate(targetDate.getDate() + daysToFriday);
  return targetDate.toISOString().split('T')[0];
};

const computeAge = (birthdate) => {
  if (!birthdate) return 0;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export default function FileRequestModal({ open, onOpenChange, employee, leaveCredits = [], onSuccess }) {
  const [activeForm, setActiveForm] = useState("select"); // select, leave, commutation, resignation, retirement
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Leave Form States
  const [leaveType, setLeaveType] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leavePurpose, setLeavePurpose] = useState("");
  const [leaveOverlapError, setLeaveOverlapError] = useState("");

  // Resignation/Retirement statement state
  const [statement, setStatement] = useState("");

  // Commutation Form States
  const [commutationTotalDays, setCommutationTotalDays] = useState("");
  const [commutationHoursPerDay, setCommutationHoursPerDay] = useState("");
  const [commutationTeachingDays, setCommutationTeachingDays] = useState("");
  const [allEmployees, setAllEmployees] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const employeeAge = employee ? computeAge(employee.birthdate) : 0;
  const isRetirementEligible = employeeAge >= 60;

  // Reset form when modal opens or activeForm changes
  useEffect(() => {
    if (open) {
      if (activeForm === "select") {
        setLeaveType("");
        setLeaveStartDate("");
        setLeaveEndDate("");
        setLeavePurpose("");
        setLeaveOverlapError("");
        setStatement("");
        setCommutationTotalDays("");
        setCommutationHoursPerDay("");
        setCommutationTeachingDays("");
      }
    } else {
      setActiveForm("select");
    }
  }, [open, activeForm]);

  // Load commutation metadata and calculate default days
  useEffect(() => {
    const fetchCommutationMetadata = async () => {
      if (activeForm !== "commutation" || !employee?.id) return;
      setLoadingMetadata(true);
      try {
        const [empsRes, semsRes] = await Promise.all([
          supabase.from("employees").select("id, first_name, last_name, employee_id, position, department, employment_classification, classification_ii, date_hired, org_unit_id"),
          supabase.from("employee_semesters").select("*").eq("employee_id", employee.id)
        ]);

        if (empsRes.data) setAllEmployees(empsRes.data);
        if (semsRes.data) setSemesters(semsRes.data);

        // Precompute default commutation days
        // Group leave credits by leave type
        const sickCreds = leaveCredits.filter(c => c.leave_type === "Sick" && c.is_commutable);
        const vacCreds = leaveCredits.filter(c => c.leave_type === "Vacation" && c.is_commutable);
        
        let unusedSick = 0;
        sickCreds.forEach(c => {
          unusedSick += Math.max(0, parseFloat(c.total_credits) - parseFloat(c.used_credits));
        });
        
        let unusedVac = 0;
        vacCreds.forEach(c => {
          unusedVac += Math.max(0, parseFloat(c.total_credits) - parseFloat(c.used_credits));
        });

        const totalUnusedCommutable = unusedSick + unusedVac;
        setCommutationTotalDays(totalUnusedCommutable.toString());
      } catch (err) {
        console.error("Error fetching metadata for commutation:", err);
      } finally {
        setLoadingMetadata(false);
      }
    };
    fetchCommutationMetadata();
  }, [activeForm, employee?.id, leaveCredits]);

  // Leave credit parsing
  const selectedCredit = leaveCredits.find((c) => `${c.id}` === leaveType);
  const remainingCredits = selectedCredit ? selectedCredit.total_credits - selectedCredit.used_credits : null;

  // Overlap check for leaves
  useEffect(() => {
    const checkOverlap = async () => {
      if (activeForm !== "leave" || !leaveStartDate || !leaveEndDate || !employee?.id) {
        setLeaveOverlapError("");
        return;
      }
      const { data, error } = await supabase
        .from("leave_applications")
        .select("id, leave_type, start_date, end_date, status")
        .eq("employee_id", employee.id)
        .in("status", ["pending", "approved"])
        .lte("start_date", leaveEndDate)
        .gte("end_date", leaveStartDate);

      if (!error && data && data.length > 0) {
        const overlap = data[0];
        setLeaveOverlapError(
          `You already have a ${overlap.status} ${overlap.leave_type} leave from ${overlap.start_date} to ${overlap.end_date} that overlaps.`
        );
      } else {
        setLeaveOverlapError("");
      }
    };
    checkOverlap();
  }, [leaveStartDate, leaveEndDate, employee?.id, activeForm]);

  const isLeaveValid =
    leaveType &&
    leaveStartDate &&
    leaveEndDate &&
    leavePurpose.trim() &&
    remainingCredits > 0 &&
    !leaveOverlapError &&
    new Date(leaveEndDate) >= new Date(leaveStartDate);

  const handleFileLeave = async () => {
    if (!isLeaveValid || !selectedCredit || !employee?.id) return;
    setIsSubmitting(true);
    try {
      let initialStatus = "pending";
      let approvedByDeptHead = false;

      // Check department head
      const { data: deptHeadCheck } = await supabase
        .from("org_units")
        .select("head_id")
        .eq("id", employee.org_unit_id || "")
        .maybeSingle();

      if (deptHeadCheck && deptHeadCheck.head_id) {
        if (deptHeadCheck.head_id === employee.id) {
          approvedByDeptHead = true;
          initialStatus = "pending";
        } else {
          initialStatus = "pending_dept_head";
        }
      }

      const { error: insertError } = await supabase
        .from("leave_applications")
        .insert({
          employee_id: employee.id,
          leave_credit_id: selectedCredit.id,
          leave_type: selectedCredit.leave_type,
          is_commutable: selectedCredit.is_commutable,
          start_date: leaveStartDate,
          end_date: leaveEndDate,
          purpose: leavePurpose,
          status: initialStatus,
          approved_by_dept_head: approvedByDeptHead
        });

      if (insertError) throw insertError;

      // Notifications
      await supabase.from("notifications").insert({
        employee_id: employee.id,
        type: "info",
        title: "Leave Application Filed",
        message: `Your request for ${selectedCredit.leave_type} Leave has been submitted and is currently ${initialStatus.replace("_", " ")}.`
      });

      // Admin log
      await supabase.from("admin_activity_log").insert({
        actor_type: "employee",
        actor_name: `${employee.first_name} ${employee.last_name}`,
        action: "employee_filed_leave",
        description: `${employee.first_name} ${employee.last_name} filed a leave application for ${selectedCredit.leave_type} Leave`,
        employee_id: employee.id
      });

      toast.success("Leave application submitted successfully!");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to file leave: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileCommutation = async () => {
    setIsSubmitting(true);
    try {
      // Resolve approvers using server RPC
      const result = await resolveCommutationApprovers(employee.id);

      const ra = result.ra_id ? allEmployees.find(e => e.id === result.ra_id) : null;
      const notedBy = result.noted_by_id ? allEmployees.find(e => e.id === result.noted_by_id) : null;
      const approvedBy = result.approved_by_id ? allEmployees.find(e => e.id === result.approved_by_id) : null;
      const conditionName = result.condition_name;

      const initialStatus = ra ? "pending_ra" : "pending_hr_forward";

      // Compute grid snapshot to freeze the table
      const isTeaching = employee?.employment_classification?.toLowerCase() === "teaching";
      
      const getLeaveValues = (type) => {
        const matching = leaveCredits.filter(c => c.leave_type === type);
        const commutable = matching.filter(c => c.is_commutable);
        const nonComm = matching.filter(c => !c.is_commutable);
        
        const allocated = matching.reduce((sum, c) => sum + parseFloat(c.total_credits || 0), 0);
        const nonCommutableDays = nonComm.reduce((sum, c) => sum + parseFloat(c.total_credits || 0), 0);
        const commutableDays = commutable.reduce((sum, c) => sum + parseFloat(c.total_credits || 0), 0);
        const used = matching.reduce((sum, c) => sum + parseFloat(c.used_credits || 0), 0);
        const unused = Math.max(0, allocated - used);
        
        return { allocated, nonCommutableDays, commutableDays, used, unused };
      };

      const sickVals = getLeaveValues("Sick");
      const vacVals = getLeaveValues("Vacation");
      const famVals = getLeaveValues("Family");
      
      const snapshot = {
        sick: sickVals,
        vacation: vacVals,
        family: famVals,
        total: {
          allocated: sickVals.allocated + vacVals.allocated + famVals.allocated,
          nonCommutableDays: sickVals.nonCommutableDays + vacVals.nonCommutableDays + famVals.nonCommutableDays,
          commutableDays: sickVals.commutableDays + vacVals.commutableDays + famVals.commutableDays,
          used: sickVals.used + vacVals.used + famVals.used,
          unused: sickVals.unused + vacVals.unused + famVals.unused
        }
      };

      const { error } = await supabase
        .from("commutation_requests")
        .insert({
          employee_id: employee.id,
          status: initialStatus,
          total_days: parseFloat(commutationTotalDays) || 0,
          hours_per_day: commutationHoursPerDay ? parseFloat(commutationHoursPerDay) : null,
          teaching_days: commutationTeachingDays ? parseFloat(commutationTeachingDays) : null,
          ra_id: ra?.id || null,
          noted_by_id: notedBy?.id || null,
          approved_by_id: approvedBy?.id || null,
          commutation_snapshot: snapshot
        });

      if (error) throw error;

      await supabase.from("notifications").insert({
        employee_id: employee.id,
        type: "info",
        title: "Commutation Request Filed",
        message: ra 
          ? `Your commutation request has been submitted and is awaiting recommending approval from ${ra.first_name} ${ra.last_name}.`
          : "Your commutation request has been submitted and is pending HR review."
      });

      await supabase.from("admin_activity_log").insert({
        actor_type: "employee",
        actor_name: `${employee.first_name} ${employee.last_name}`,
        action: "employee_submitted_update",
        description: `${employee.first_name} ${employee.last_name} submitted a Commutation Request (Condition: ${conditionName})`,
        employee_id: employee.id
      });

      toast.success("Commutation request submitted successfully!");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to submit request: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileResignation = async () => {
    if (!statement.trim()) {
      toast.error("Please enter a Statement of Resignation.");
      return;
    }
    setIsSubmitting(true);
    try {
      const finalWorkDay = getFridayTwoWeeksAfter();
      const { error } = await supabase
        .from("resignation_requests")
        .insert({
          employee_id: employee.id,
          statement: statement,
          final_work_day: finalWorkDay,
          status: "pending"
        });

      if (error) throw error;

      await supabase.from("notifications").insert({
        employee_id: employee.id,
        type: "info",
        title: "Resignation Notice Filed",
        message: `Your Resignation request has been filed with final work day set to ${finalWorkDay}.`
      });

      await supabase.from("admin_activity_log").insert({
        actor_type: "employee",
        actor_name: `${employee.first_name} ${employee.last_name}`,
        action: "employee_submitted_update",
        description: `${employee.first_name} ${employee.last_name} filed a Resignation Request`,
        employee_id: employee.id
      });

      toast.success("Resignation notice submitted!");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to submit resignation: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileRetirement = async () => {
    if (!statement.trim()) {
      toast.error("Please enter a Statement of Retirement.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("retirement_requests")
        .insert({
          employee_id: employee.id,
          statement: statement,
          status: "pending"
        });

      if (error) throw error;

      await supabase.from("notifications").insert({
        employee_id: employee.id,
        type: "info",
        title: "Retirement Request Filed",
        message: "Your Retirement request has been filed and is pending HR review."
      });

      await supabase.from("admin_activity_log").insert({
        actor_type: "employee",
        actor_name: `${employee.first_name} ${employee.last_name}`,
        action: "employee_submitted_update",
        description: `${employee.first_name} ${employee.last_name} filed a Retirement Request`,
        employee_id: employee.id
      });

      toast.success("Retirement request submitted!");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to submit retirement: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[85vh] overflow-y-auto rounded-2xl transition-all duration-300 ${activeForm === "commutation" ? "max-w-4xl" : "max-w-xl"}`}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {activeForm !== "select" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setActiveForm("select")}
                className="-ml-2 h-8 w-8 rounded-full"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </Button>
            )}
            <DialogTitle className="text-xl font-bold text-slate-800">
              {activeForm === "select" && "File a Request"}
              {activeForm === "leave" && "File Leave Application"}
              {activeForm === "commutation" && "Commute Leave Credits"}
              {activeForm === "resignation" && "File Resignation Notice"}
              {activeForm === "retirement" && "File Retirement Request"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            {activeForm === "select" && "Select the type of request you would like to submit to HR."}
            {activeForm === "leave" && "Submit a new leave application. Subject to department head approval."}
            {activeForm === "commutation" && "Apply to commute your remaining commutable leave balance into pay."}
            {activeForm === "resignation" && "Enter details for your formal statement of resignation."}
            {activeForm === "retirement" && "Enter details for your formal statement of retirement."}
          </DialogDescription>
        </DialogHeader>

        {activeForm === "select" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveForm("leave")}
              className="flex flex-col items-center justify-center p-6 h-36 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/30 rounded-2xl transition-all gap-3 text-center"
            >
              <CalendarDays className="w-8 h-8 text-indigo-600" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">Leave Request</p>
                <p className="text-[10px] text-slate-400 font-medium">Sick, Vacation, or Force Leave</p>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveForm("commutation")}
              className="flex flex-col items-center justify-center p-6 h-36 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/30 rounded-2xl transition-all gap-3 text-center"
            >
              <RefreshCw className="w-8 h-8 text-amber-500" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">Commutation</p>
                <p className="text-[10px] text-slate-400 font-medium">Convert credits into pay</p>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveForm("resignation")}
              className="flex flex-col items-center justify-center p-6 h-36 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/30 rounded-2xl transition-all gap-3 text-center"
            >
              <LogOut className="w-8 h-8 text-red-500" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">Resignation</p>
                <p className="text-[10px] text-slate-400 font-medium">Formal resignation notice</p>
              </div>
            </Button>

            {isRetirementEligible && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveForm("retirement")}
                className="flex flex-col items-center justify-center p-6 h-36 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/30 rounded-2xl transition-all gap-3 text-center animate-in fade-in"
              >
                <Award className="w-8 h-8 text-emerald-600" />
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-800">Retirement</p>
                  <p className="text-[10px] text-slate-400 font-medium">File for official retirement</p>
                </div>
              </Button>
            )}
          </div>
        )}

        {activeForm === "leave" && (
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Leaves</SelectLabel>
                    {leaveCredits.map((credit) => {
                      const remaining = credit.total_credits - credit.used_credits;
                      return (
                        <SelectItem 
                          key={credit.id} 
                          value={`${credit.id}`}
                          disabled={remaining <= 0}
                        >
                          {credit.leave_type} Leave ({credit.is_commutable ? "Commutable" : "Non-commutable"}) — {remaining} left
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase">Start Date</Label>
                <Input
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  className="h-10 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase">End Date</Label>
                <Input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="h-10 border-slate-200"
                />
              </div>
            </div>

            {leaveOverlapError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{leaveOverlapError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Purpose / Remarks</Label>
              <Textarea
                value={leavePurpose}
                onChange={(e) => setLeavePurpose(e.target.value)}
                placeholder="Briefly explain the reason for your leave request..."
                className="min-h-[90px] border-slate-200"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                onClick={handleFileLeave}
                disabled={isSubmitting || !isLeaveValid}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 rounded-lg"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Application
              </Button>
            </DialogFooter>
          </div>
        )}

        {activeForm === "commutation" && (() => {
          const isTeaching = employee?.employment_classification?.toLowerCase() === "teaching";
          const activeSems = semesters.filter(s => s.employee_id === employee?.id && s.is_active === true);
          const hasTeachingLoad = !isTeaching && activeSems.some(s => s.teaching_load && parseFloat(s.teaching_load) > 0);

          // Compute leave credits values dynamically for display
          const getLeaveValues = (type) => {
            const matching = leaveCredits.filter(c => c.leave_type === type);
            const commutable = matching.filter(c => c.is_commutable);
            const nonComm = matching.filter(c => !c.is_commutable);
            
            const allocated = matching.reduce((sum, c) => sum + parseFloat(c.total_credits || 0), 0);
            const nonCommutableDays = nonComm.reduce((sum, c) => sum + parseFloat(c.total_credits || 0), 0);
            const commutableDays = commutable.reduce((sum, c) => sum + parseFloat(c.total_credits || 0), 0);
            const used = matching.reduce((sum, c) => sum + parseFloat(c.used_credits || 0), 0);
            const unused = Math.max(0, allocated - used);
            
            return { allocated, nonCommutableDays, commutableDays, used, unused };
          };

          const sick = getLeaveValues("Sick");
          const vacation = getLeaveValues("Vacation");
          const family = getLeaveValues("Family");
          
          const total = {
            allocated: sick.allocated + vacation.allocated + family.allocated,
            nonCommutableDays: sick.nonCommutableDays + vacation.nonCommutableDays + family.nonCommutableDays,
            commutableDays: sick.commutableDays + vacation.commutableDays + family.commutableDays,
            used: sick.used + vacation.used + family.used,
            unused: sick.unused + vacation.unused + family.unused
          };



          return (
            <div className="space-y-6 py-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="text-center font-semibold text-slate-700 text-xs tracking-wide">
                <span className="font-extrabold text-[#0C005F]">{employee.first_name} {employee.middle_name ? employee.middle_name + " " : ""}{employee.last_name}</span> of <span className="font-extrabold text-[#0C005F]">{employee.department}</span> hereby applies for the commutation of unused sick/vacation/forced leave benefits.
              </div>

              {loadingMetadata ? (
                <div className="flex flex-col items-center justify-center p-8 gap-2 text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0C005F]" />
                  <span>Loading classification details...</span>
                </div>
              ) : (
                <>
                  {/* Commutation Table Grid */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-center">
                          <th className="p-2 text-left w-1/3"></th>
                          <th className="p-2 border-l border-slate-200">Sick Leave</th>
                          <th className="p-2 border-l border-slate-200">
                            {isTeaching ? "Vacation Leave (Teaching)" : "Vacation Leave (Non-Teaching)"}
                          </th>
                          <th className="p-2 border-l border-slate-200">
                            {isTeaching ? "Family Leave (Teaching)" : "Family Leave (Non-teaching)"}
                          </th>
                          <th className="p-2 border-l border-slate-200 font-extrabold text-[#0C005F]">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-center">
                        <tr>
                          <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Days Allocated</td>
                          <td className="p-2 border-l border-slate-100">{sick.allocated}</td>
                          <td className="p-2 border-l border-slate-100">{vacation.allocated}</td>
                          <td className="p-2 border-l border-slate-100">{family.allocated}</td>
                          <td className="p-2 border-l border-slate-100 font-bold text-slate-800 bg-slate-50/20">{total.allocated}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Non-Commutable Days</td>
                          <td className="p-2 border-l border-slate-100">{sick.nonCommutableDays}</td>
                          <td className="p-2 border-l border-slate-100">{vacation.nonCommutableDays}</td>
                          <td className="p-2 border-l border-slate-100">{family.nonCommutableDays}</td>
                          <td className="p-2 border-l border-slate-100 font-bold text-slate-800 bg-slate-50/20">{total.nonCommutableDays}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Days Commutable</td>
                          <td className="p-2 border-l border-slate-100 text-amber-600 font-bold">{sick.commutableDays}</td>
                          <td className="p-2 border-l border-slate-100 text-amber-600 font-bold">{vacation.commutableDays}</td>
                          <td className="p-2 border-l border-slate-100 text-amber-600 font-bold">{family.commutableDays}</td>
                          <td className="p-2 border-l border-slate-100 font-bold text-amber-700 bg-slate-50/20">{total.commutableDays}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Used Leave</td>
                          <td className="p-2 border-l border-slate-100">{sick.used}</td>
                          <td className="p-2 border-l border-slate-100">{vacation.used}</td>
                          <td className="p-2 border-l border-slate-100">{family.used}</td>
                          <td className="p-2 border-l border-slate-100 font-bold text-slate-800 bg-slate-50/20">{total.used}</td>
                        </tr>
                        <tr className="border-b-2 border-slate-200">
                          <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Unused Leave</td>
                          <td className="p-2 border-l border-slate-100 text-emerald-600 font-bold">{sick.unused}</td>
                          <td className="p-2 border-l border-slate-100 text-emerald-600 font-bold">{vacation.unused}</td>
                          <td className="p-2 border-l border-slate-100 text-emerald-600 font-bold">{family.unused}</td>
                          <td className="p-2 border-l border-slate-100 font-bold text-emerald-700 bg-slate-50/20">{total.unused}</td>
                        </tr>
                        <tr className="bg-slate-50/50 font-bold text-left">
                          <td className="p-2 text-slate-800">Total Number of Days of Commutation</td>
                          <td colSpan="4" className="p-1 border-l border-slate-100">
                            <Input
                              type="number"
                              value={commutationTotalDays}
                              onChange={(e) => setCommutationTotalDays(e.target.value)}
                              className="h-8 text-xs font-bold text-slate-800 focus-visible:ring-[#0C005F]/20 border-slate-200 w-full max-w-[120px] ml-1"
                            />
                          </td>
                        </tr>
                        {isTeaching && (
                          <tr className="bg-slate-50/50 font-bold text-left">
                            <td className="p-2 text-slate-800">Hours Per Day</td>
                            <td colSpan="4" className="p-1 border-l border-slate-100">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 5.70"
                                value={commutationHoursPerDay}
                                onChange={(e) => setCommutationHoursPerDay(e.target.value)}
                                className="h-8 text-xs font-bold text-slate-800 focus-visible:ring-[#0C005F]/20 border-slate-200 w-full max-w-[120px] ml-1"
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Teaching Load Section for Non-Teaching with teaching load */}
                  {hasTeachingLoad && (
                    <div className="p-4 border border-slate-200 bg-slate-50/30 rounded-xl space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">For Teaching Load</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Hours Per Day</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 5.70"
                            value={commutationHoursPerDay}
                            onChange={(e) => setCommutationHoursPerDay(e.target.value)}
                            className="h-9 text-xs font-bold border-slate-200"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Total No. of Days (For Commutation)</Label>
                          <Input
                            type="number"
                            placeholder="Days for teaching load"
                            value={commutationTeachingDays}
                            onChange={(e) => setCommutationTeachingDays(e.target.value)}
                            className="h-9 text-xs font-bold border-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Removed Approval Flow Preview box */}
                </>
              )}

              <DialogFooter className="pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={handleFileCommutation}
                  disabled={isSubmitting || loadingMetadata || !commutationTotalDays}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 rounded-lg border-none w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Commutation Request
                </Button>
              </DialogFooter>
            </div>
          );
        })()}

        {activeForm === "resignation" && (
          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Employee ID</Label>
                <Input value={employee.employee_id || "—"} disabled className="h-9 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Full Name</Label>
                <Input value={`${employee.first_name} ${employee.last_name}`} disabled className="h-9 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Email</Label>
                <Input value={employee.contact_email || "—"} disabled className="h-9 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Phone Number</Label>
                <Input value={employee.contact_phone || "—"} disabled className="h-9 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Filing Date</Label>
                <Input value={todayStr} disabled className="h-9 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Final Work Day</Label>
                <Input value={getFridayTwoWeeksAfter()} disabled className="h-9 bg-slate-50 text-indigo-600 font-bold" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Statement of Resignation</Label>
              <Textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Input your formal statement explaining your reason for resigning..."
                className="min-h-[120px] border-slate-200 text-sm"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                onClick={handleFileResignation}
                disabled={isSubmitting || !statement.trim()}
                className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2 rounded-lg border-none"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Resignation
              </Button>
            </DialogFooter>
          </div>
        )}

        {activeForm === "retirement" && (
          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Employee ID</Label>
                <Input value={employee.employee_id || "—"} disabled className="h-9 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Full Name</Label>
                <Input value={`${employee.first_name} ${employee.last_name}`} disabled className="h-9 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Email</Label>
                <Input value={employee.contact_email || "—"} disabled className="h-9 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Phone Number</Label>
                <Input value={employee.contact_phone || "—"} disabled className="h-9 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Filing Date</Label>
                <Input value={todayStr} disabled className="h-9 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Employee Age</Label>
                <Input value={`${employeeAge} Years Old`} disabled className="h-9 bg-slate-50 text-emerald-600 font-bold" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Statement of Retirement</Label>
              <Textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Input your formal statement explaining your retirement notice..."
                className="min-h-[120px] border-slate-200 text-sm"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                onClick={handleFileRetirement}
                disabled={isSubmitting || !statement.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-lg border-none"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Retirement
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
