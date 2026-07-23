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

  const computeYearsInService = (dateHired) => {
    if (!dateHired) return 0;
    const start = new Date(dateHired);
    const ref = new Date();
    if (isNaN(start.getTime())) return 0;
    let years = ref.getFullYear() - start.getFullYear();
    const m = ref.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < start.getDate())) years--;
    return Math.max(0, years);
  };

  const getApproverDetails = (id, fallbackRole) => {
    if (!id) return { name: "_____", position: fallbackRole };
    const found = allEmployees.find(e => e.id === id);
    if (!found) return { name: "_____", position: fallbackRole };
    return {
      name: `${found.first_name} ${found.last_name}`,
      position: found.position || fallbackRole
    };
  };

  const employeeAge = employee ? computeAge(employee.birthdate) : 0;
  const employeeYearsInService = employee ? computeYearsInService(employee.date_hired) : 0;
  const [dbRetirementEligible, setDbRetirementEligible] = useState(false);

  useEffect(() => {
    const checkRetirementBenefit = async () => {
      if (!employee?.id || !open) return;
      const currentYear = new Date().getFullYear();
      const { data } = await supabase
        .from('employee_benefits')
        .select('is_eligible')
        .eq('employee_id', employee.id)
        .eq('benefit_key', 'retirement')
        .eq('eligibility_year', currentYear)
        .maybeSingle();

      if (data?.is_eligible) {
        setDbRetirementEligible(true);
      } else {
        setDbRetirementEligible(false);
      }
    };
    checkRetirementBenefit();
  }, [employee?.id, open]);

  const isRetirementEligible = dbRetirementEligible || (employeeAge >= 60 && employeeYearsInService >= 5);

  useEffect(() => {
    if (open) {
      setActiveForm("select");
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
  }, [open]);

  const [resolvedApprovers, setResolvedApprovers] = useState(null);

  useEffect(() => {
    async function loadMetadata() {
      if (open && activeForm === "commutation" && employee?.id) {
        setLoadingMetadata(true);
        try {
          const [empRes, semRes, apprvRes] = await Promise.all([
            supabase.from("employees").select("id, first_name, last_name, position, department"),
            supabase.from("employee_semesters").select("*"),
            supabase.rpc('resolve_commutation_approvers', { emp_id: employee.id })
          ]);
          if (empRes.data) setAllEmployees(empRes.data);
          if (semRes.data) setSemesters(semRes.data);
          if (apprvRes.data) setResolvedApprovers(apprvRes.data);
        } catch (err) {
          console.error("Error loading commutation metadata", err);
        } finally {
          setLoadingMetadata(false);
        }
      }
    }
    loadMetadata();
  }, [open, activeForm, employee?.id]);

  useEffect(() => {
    async function checkOverlap() {
      if (!leaveStartDate || !leaveEndDate || !employee?.id) {
        setLeaveOverlapError("");
        return;
      }
      if (leaveStartDate > leaveEndDate) {
        setLeaveOverlapError("Start date cannot be after end date.");
        return;
      }
      const { data: overlapping } = await supabase
        .from("leave_applications")
        .select("id, start_date, end_date, status")
        .eq("employee_id", employee.id)
        .neq("status", "rejected")
        .lte("start_date", leaveEndDate)
        .gte("end_date", leaveStartDate);

      if (overlapping && overlapping.length > 0) {
        setLeaveOverlapError("You already have a leave request covering these dates.");
      } else {
        setLeaveOverlapError("");
      }
    }
    checkOverlap();
  }, [leaveStartDate, leaveEndDate, employee?.id]);

  const selectedCredit = leaveCredits.find(c => `${c.id}` === leaveType);
  const isLeaveValid = leaveType && leaveStartDate && leaveEndDate && !leaveOverlapError && leaveStartDate <= leaveEndDate;

  const handleFileLeave = async () => {
    if (!isLeaveValid || !employee?.id) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("leave_applications").insert({
        employee_id: employee.id,
        leave_credit_id: selectedCredit.id,
        leave_type: selectedCredit.leave_type,
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        purpose: leavePurpose || null,
        status: "pending_dept_head"
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        employee_id: employee.id,
        type: 'info',
        title: 'Leave Application Submitted',
        message: `Your application for ${selectedCredit.leave_type} Leave (${leaveStartDate} to ${leaveEndDate}) has been filed and is pending department head approval.`
      });

      toast.success("Leave application submitted successfully!");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to submit leave application: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileCommutation = async () => {
    if (!employee?.id || !commutationTotalDays) return;
    setIsSubmitting(true);
    try {
      const totalDaysNum = parseFloat(commutationTotalDays);
      const isTeaching = employee?.employment_classification?.toLowerCase() === "teaching";
      const hoursPerDayNum = commutationHoursPerDay ? parseFloat(commutationHoursPerDay) : null;
      const teachingDaysNum = commutationTeachingDays ? parseFloat(commutationTeachingDays) : null;

      const { error } = await supabase.from("commutation_requests").insert({
        employee_id: employee.id,
        total_days_commuted: totalDaysNum,
        hours_per_day: hoursPerDayNum,
        teaching_days_commuted: teachingDaysNum,
        status: "pending_dept_head",
        filed_date: new Date().toISOString().split("T")[0]
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        employee_id: employee.id,
        type: 'info',
        title: 'Commutation Request Filed',
        message: `Your commutation request for ${totalDaysNum} day(s) has been submitted for approval.`
      });

      toast.success("Commutation request submitted successfully!");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to submit commutation: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileResignation = async () => {
    if (!employee?.id || !statement.trim()) return;
    setIsSubmitting(true);
    try {
      const filingDate = new Date().toISOString().split("T")[0];
      const effectiveDate = getFridayTwoWeeksAfter();

      const { error } = await supabase.from("resignation_requests").insert({
        employee_id: employee.id,
        filing_date: filingDate,
        effective_date: effectiveDate,
        statement: statement.trim(),
        status: "pending_hr"
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        employee_id: employee.id,
        type: 'warning',
        title: 'Resignation Filed',
        message: `Your resignation notice (effective ${effectiveDate}) has been submitted to HR.`
      });

      toast.success("Resignation notice submitted to HR!");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to submit resignation: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileRetirement = async () => {
    if (!employee?.id || !statement.trim()) return;
    setIsSubmitting(true);
    try {
      const filingDate = new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("retirement_requests").insert({
        employee_id: employee.id,
        filing_date: filingDate,
        statement: statement.trim(),
        status: "pending_hr"
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        employee_id: employee.id,
        type: 'info',
        title: 'Retirement Application Submitted',
        message: `Your application for official retirement has been submitted to HR.`
      });

      toast.success("Retirement application submitted to HR!");
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
      <DialogContent className={`max-h-[85vh] overflow-y-auto bg-white text-slate-800 border border-slate-200 shadow-none rounded-[8px] transition-all duration-300 ${activeForm === "commutation" ? "max-w-4xl" : "max-w-xl"}`}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {activeForm !== "select" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setActiveForm("select")}
                className="-ml-2 h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <DialogTitle className="text-xl font-bold text-[#0C005F]">
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
              className="flex flex-col items-center justify-center p-6 h-36 bg-white hover:bg-slate-50 border-slate-200 rounded-[8px] shadow-none transition-all gap-3 text-center text-slate-800"
            >
              <CalendarDays className="w-8 h-8 text-[#0C005F]" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">Leave Request</p>
                <p className="text-[10px] text-slate-500 font-medium">Sick, Vacation, or Force Leave</p>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveForm("commutation")}
              className="flex flex-col items-center justify-center p-6 h-36 bg-white hover:bg-slate-50 border-slate-200 rounded-[8px] shadow-none transition-all gap-3 text-center text-slate-800"
            >
              <RefreshCw className="w-8 h-8 text-[#0C005F]" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">Commutation</p>
                <p className="text-[10px] text-slate-500 font-medium">Convert credits into pay</p>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveForm("resignation")}
              className="flex flex-col items-center justify-center p-6 h-36 bg-white hover:bg-slate-50 border-slate-200 rounded-[8px] shadow-none transition-all gap-3 text-center text-slate-800"
            >
              <LogOut className="w-8 h-8 text-[#0C005F]" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">Resignation</p>
                <p className="text-[10px] text-slate-500 font-medium">Formal resignation notice</p>
              </div>
            </Button>

            {isRetirementEligible && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveForm("retirement")}
                className="flex flex-col items-center justify-center p-6 h-36 bg-white hover:bg-slate-50 border-slate-200 rounded-[8px] shadow-none transition-all gap-3 text-center text-slate-800"
              >
                <Award className="w-8 h-8 text-[#0C005F]" />
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-800">Retirement</p>
                  <p className="text-[10px] text-slate-500 font-medium">File for official retirement</p>
                </div>
              </Button>
            )}
          </div>
        )}

        {activeForm === "leave" && (
          <div className="space-y-4 py-3 text-slate-800">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="h-10 bg-white border-slate-200 text-slate-800 rounded-[8px] shadow-none focus-visible:ring-[#0C005F]">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-800 border-slate-200 rounded-[8px]">
                  {leaveCredits.some(c => c.is_commutable) && (
                    <SelectGroup>
                      <SelectLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Commutable Leaves</SelectLabel>
                      {leaveCredits.filter(c => c.is_commutable).map((credit) => {
                        const remaining = credit.total_credits - credit.used_credits;
                        return (
                          <SelectItem 
                            key={credit.id} 
                            value={`${credit.id}`}
                            disabled={remaining <= 0}
                            className="text-slate-800 focus:bg-slate-100 focus:text-slate-900"
                          >
                            {credit.leave_type} Leave — {remaining} left
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  )}
                  {leaveCredits.some(c => !c.is_commutable) && (
                    <SelectGroup className="mt-2 border-t border-slate-100 pt-2">
                      <SelectLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Non-Commutable Leaves</SelectLabel>
                      {leaveCredits.filter(c => !c.is_commutable).map((credit) => {
                        const remaining = credit.total_credits - credit.used_credits;
                        return (
                          <SelectItem 
                            key={credit.id} 
                            value={`${credit.id}`}
                            disabled={remaining <= 0}
                            className="text-slate-800 focus:bg-slate-100 focus:text-slate-900"
                          >
                            {credit.leave_type} Leave — {remaining} left
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  )}
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
                  className="h-10 bg-white border-slate-200 text-slate-800 rounded-[8px] shadow-none focus-visible:ring-[#0C005F]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase">End Date</Label>
                <Input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="h-10 bg-white border-slate-200 text-slate-800 rounded-[8px] shadow-none focus-visible:ring-[#0C005F]"
                />
              </div>
            </div>

            {leaveOverlapError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[8px] flex items-start gap-2 shadow-none">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{leaveOverlapError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Purpose / Remarks</Label>
              <Textarea
                value={leavePurpose}
                onChange={(e) => setLeavePurpose(e.target.value)}
                placeholder="Briefly explain the reason for your leave request..."
                className="min-h-[90px] resize-none bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-[8px] shadow-none focus-visible:ring-[#0C005F]"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                onClick={handleFileLeave}
                disabled={isSubmitting || !isLeaveValid}
                className="bg-[#0C005F] hover:bg-[#0C005F]/90 text-white font-bold gap-2 rounded-[8px] shadow-none"
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
          const force = getLeaveValues("Force");
          
          const yearsInService = employee?.date_hired ? (new Date() - new Date(employee.date_hired)) / (365.25 * 86400 * 1000) : 0;
          const includeForce = !isTeaching && (leaveCredits.some(c => c.leave_type === "Force") || yearsInService >= 3);

          const total = {
            allocated: sick.allocated + vacation.allocated + family.allocated + (includeForce ? force.allocated : 0),
            nonCommutableDays: sick.nonCommutableDays + vacation.nonCommutableDays + family.nonCommutableDays + (includeForce ? force.nonCommutableDays : 0),
            commutableDays: sick.commutableDays + vacation.commutableDays + family.commutableDays + (includeForce ? force.commutableDays : 0),
            used: sick.used + vacation.used + family.used + (includeForce ? force.used : 0),
            unused: sick.unused + vacation.unused + family.unused + (includeForce ? force.unused : 0)
          };

          const colSpanCount = includeForce ? 5 : 4;
          const isPresident = employee?.position?.toLowerCase()?.includes("university president") || employee?.department?.toLowerCase()?.includes("university president");

          return (
            <div className="space-y-6 py-3 max-h-[70vh] overflow-y-auto pr-1 text-slate-800">
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
                  <div className="border border-slate-200 rounded-[8px] overflow-hidden shadow-none bg-white">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-center">
                          <th className="p-2 text-left w-1/4"></th>
                          <th className="p-2 border-l border-slate-200">Sick Leave</th>
                          <th className="p-2 border-l border-slate-200">
                            {isTeaching ? "Vacation Leave (Teaching)" : "Vacation Leave (Non-Teaching)"}
                          </th>
                          <th className="p-2 border-l border-slate-200">
                            {isTeaching ? "Family Leave (Teaching)" : "Family Leave (Non-teaching)"}
                          </th>
                          {includeForce && (
                            <th className="p-2 border-l border-slate-200">
                              Force Leave (Non-Teaching)
                            </th>
                          )}
                          <th className="p-2 border-l border-slate-200 font-extrabold text-[#0C005F]">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-center">
                        <tr>
                          <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Days Allocated</td>
                          <td className="p-2 border-l border-slate-100">{sick.allocated}</td>
                          <td className="p-2 border-l border-slate-100">{vacation.allocated}</td>
                          <td className="p-2 border-l border-slate-100">{family.allocated}</td>
                          {includeForce && <td className="p-2 border-l border-slate-100">{force.allocated}</td>}
                          <td className="p-2 border-l border-slate-100 font-bold text-slate-800 bg-slate-50/20">{total.allocated}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Non-Commutable Days</td>
                          <td className="p-2 border-l border-slate-100">{sick.nonCommutableDays}</td>
                          <td className="p-2 border-l border-slate-100">{vacation.nonCommutableDays}</td>
                          <td className="p-2 border-l border-slate-100">{family.nonCommutableDays}</td>
                          {includeForce && <td className="p-2 border-l border-slate-100">{force.nonCommutableDays}</td>}
                          <td className="p-2 border-l border-slate-100 font-bold text-slate-800 bg-slate-50/20">{total.nonCommutableDays}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Days Commutable</td>
                          <td className="p-2 border-l border-slate-100 text-[#0C005F] font-bold">{sick.commutableDays}</td>
                          <td className="p-2 border-l border-slate-100 text-[#0C005F] font-bold">{vacation.commutableDays}</td>
                          <td className="p-2 border-l border-slate-100 text-[#0C005F] font-bold">{family.commutableDays}</td>
                          {includeForce && <td className="p-2 border-l border-slate-100 text-[#0C005F] font-bold">{force.commutableDays}</td>}
                          <td className="p-2 border-l border-slate-100 font-bold text-[#0C005F] bg-slate-50/20">{total.commutableDays}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Used Leave</td>
                          <td className="p-2 border-l border-slate-100">{sick.used}</td>
                          <td className="p-2 border-l border-slate-100">{vacation.used}</td>
                          <td className="p-2 border-l border-slate-100">{family.used}</td>
                          {includeForce && <td className="p-2 border-l border-slate-100">{force.used}</td>}
                          <td className="p-2 border-l border-slate-100 font-bold text-slate-800 bg-slate-50/20">{total.used}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 text-left font-bold text-slate-600 bg-slate-50/50">Number of Unused Leave</td>
                          <td className="p-2 border-l border-slate-100 text-emerald-600 font-bold">{sick.unused}</td>
                          <td className="p-2 border-l border-slate-100 text-emerald-600 font-bold">{vacation.unused}</td>
                          <td className="p-2 border-l border-slate-100 text-emerald-600 font-bold">{family.unused}</td>
                          {includeForce && <td className="p-2 border-l border-slate-100 text-emerald-600 font-bold">{force.unused}</td>}
                          <td className="p-2 border-l border-slate-100 font-bold text-emerald-700 bg-slate-50/20">{total.unused}</td>
                        </tr>
                        <tr className="bg-slate-50/50 font-bold text-left">
                          <td className="p-2 text-slate-800">Total Number of Days of Commutation</td>
                          <td colSpan={colSpanCount} className="p-1 border-l border-slate-100">
                            <Input
                              type="number"
                              value={commutationTotalDays}
                              onChange={(e) => setCommutationTotalDays(e.target.value)}
                              className="h-8 text-xs font-bold text-slate-800 bg-white border-slate-200 w-full max-w-[120px] ml-1 rounded-[6px] shadow-none focus-visible:ring-[#0C005F]"
                            />
                          </td>
                        </tr>
                        {isTeaching && (
                          <tr className="bg-slate-50/50 font-bold text-left">
                            <td className="p-2 text-slate-800">Hours Per Day</td>
                            <td colSpan={colSpanCount} className="p-1 border-l border-slate-100">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 5.70"
                                value={commutationHoursPerDay}
                                onChange={(e) => setCommutationHoursPerDay(e.target.value)}
                                className="h-8 text-xs font-bold text-slate-800 bg-white border-slate-200 w-full max-w-[120px] ml-1 rounded-[6px] shadow-none focus-visible:ring-[#0C005F]"
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Teaching Load Section for Non-Teaching with teaching load ONLY */}
                  {hasTeachingLoad && (
                    <div className="p-4 border border-slate-200 bg-slate-50/50 rounded-[8px] space-y-3 shadow-none">
                      <h4 className="text-[10px] font-black uppercase text-[#0C005F] tracking-wider">For Teaching Load</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Hours Per Day</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 5.70"
                            value={commutationHoursPerDay}
                            onChange={(e) => setCommutationHoursPerDay(e.target.value)}
                            className="h-9 text-xs font-bold bg-white border-slate-200 text-slate-800 rounded-[6px] shadow-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Total No. of Days (For Commutation)</Label>
                          <Input
                            type="number"
                            placeholder="Days for teaching load"
                            value={commutationTeachingDays}
                            onChange={(e) => setCommutationTeachingDays(e.target.value)}
                            className="h-9 text-xs font-bold bg-white border-slate-200 text-slate-800 rounded-[6px] shadow-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Signature Blocks Preview */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-6 text-[11px] text-slate-600 font-medium justify-between items-end">
                    {!isPresident && (
                      <div className="text-center shrink-0">
                        <div className="w-40 border-b border-slate-300 mb-1 pb-1 font-bold text-slate-800 text-xs">
                          {employee.first_name} {employee.last_name}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Employee's Signature</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-6 ml-auto justify-end text-center">
                      {resolvedApprovers?.ra_id && (() => {
                        const approver = getApproverDetails(resolvedApprovers.ra_id, "Dean / Office Head");
                        return (
                          <div className="shrink-0">
                            <div className="w-44 border-b border-slate-300 mb-1 pb-1 font-bold text-slate-800 text-xs">
                              {approver.name}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                              {approver.position}
                            </span>
                            <span className="text-[9px] text-[#0C005F] font-bold uppercase tracking-wider block">(Recommending Approval)</span>
                          </div>
                        );
                      })()}

                      {resolvedApprovers?.noted_by_id && (() => {
                        const approver = getApproverDetails(resolvedApprovers.noted_by_id, "VP for Administration");
                        return (
                          <div className="shrink-0">
                            <div className="w-44 border-b border-slate-300 mb-1 pb-1 font-bold text-slate-800 text-xs">
                              {approver.name}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                              {approver.position}
                            </span>
                            <span className="text-[9px] text-[#0C005F] font-bold uppercase tracking-wider block">(Noted By)</span>
                          </div>
                        );
                      })()}

                      {resolvedApprovers?.approved_by_id && (() => {
                        const approver = getApproverDetails(resolvedApprovers.approved_by_id, "University President");
                        return (
                          <div className="shrink-0">
                            <div className="w-44 border-b border-slate-300 mb-1 pb-1 font-bold text-slate-800 text-xs">
                              {approver.name}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                              {approver.position}
                            </span>
                            <span className="text-[9px] text-[#0C005F] font-bold uppercase tracking-wider block">(Approved By)</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}

              <DialogFooter className="pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  onClick={handleFileCommutation}
                  disabled={isSubmitting || loadingMetadata || !commutationTotalDays}
                  className="bg-[#0C005F] hover:bg-[#0C005F]/90 text-white font-bold gap-2 rounded-[8px] border-none shadow-none w-full sm:w-auto"
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
          <div className="space-y-4 py-3 text-slate-800">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Employee ID</Label>
                <Input value={employee.employee_id || "—"} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-800 rounded-[6px]" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Full Name</Label>
                <Input value={`${employee.first_name} ${employee.last_name}`} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-800 rounded-[6px]" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Email</Label>
                <Input value={employee.contact_email || "—"} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-800 rounded-[6px]" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Phone Number</Label>
                <Input value={employee.contact_phone || "—"} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-800 rounded-[6px]" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Filing Date</Label>
                <Input value={todayStr} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-800 rounded-[6px]" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Final Work Day</Label>
                <Input value={getFridayTwoWeeksAfter()} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-500 font-medium rounded-[6px]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Statement of Resignation</Label>
              <Textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Input your formal statement explaining your reason for resigning..."
                className="min-h-[120px] bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm rounded-[8px] shadow-none focus-visible:ring-[#0C005F]"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                onClick={handleFileResignation}
                disabled={isSubmitting || !statement.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 rounded-[8px] border-none shadow-none"
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
          <div className="space-y-4 py-3 text-slate-800">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Employee ID</Label>
                <Input value={employee.employee_id || "—"} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-800 rounded-[6px]" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Full Name</Label>
                <Input value={`${employee.first_name} ${employee.last_name}`} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-800 rounded-[6px]" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Email</Label>
                <Input value={employee.contact_email || "—"} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-800 rounded-[6px]" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Phone Number</Label>
                <Input value={employee.contact_phone || "—"} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-800 rounded-[6px]" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Filing Date</Label>
                <Input value={todayStr} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-800 rounded-[6px]" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-500 uppercase">Employee Age</Label>
                <Input value={`${employeeAge} Years Old`} disabled className="h-9 bg-slate-50 border-slate-200 text-slate-500 font-medium rounded-[6px]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Statement of Retirement</Label>
              <Textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Input your formal statement explaining your retirement notice..."
                className="min-h-[120px] bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm rounded-[8px] shadow-none focus-visible:ring-[#0C005F]"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                onClick={handleFileRetirement}
                disabled={isSubmitting || !statement.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-[8px] border-none shadow-none"
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
