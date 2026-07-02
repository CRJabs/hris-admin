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
      }
    } else {
      setActiveForm("select");
    }
  }, [open, activeForm]);

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
      const { error } = await supabase
        .from("commutation_requests")
        .insert({
          employee_id: employee.id,
          status: "pending"
        });

      if (error) throw error;

      await supabase.from("notifications").insert({
        employee_id: employee.id,
        type: "info",
        title: "Commutation Request Filed",
        message: "Your request for Commutation of Leave Credits has been submitted and is pending review."
      });

      await supabase.from("admin_activity_log").insert({
        actor_type: "employee",
        actor_name: `${employee.first_name} ${employee.last_name}`,
        action: "employee_submitted_update", // general action fallback
        description: `${employee.first_name} ${employee.last_name} submitted a Commutation Request`,
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
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl">
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

        {activeForm === "commutation" && (
          <div className="space-y-4 py-3">
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                Commutation requests will evaluate your remaining commutable leave balance and convert them into monetary compensation according to standard school guidelines. Form generation depends on classification details. Click submit below to lodge your request.
              </span>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                onClick={handleFileCommutation}
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 rounded-lg border-none"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                File Commutation
              </Button>
            </DialogFooter>
          </div>
        )}

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
