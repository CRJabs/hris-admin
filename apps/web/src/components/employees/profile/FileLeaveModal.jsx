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
} from "@/components/ui/select";
import { CalendarDays, AlertTriangle, Loader2, Send, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function FileLeaveModal({ open, onOpenChange, employee, leaveCredits = [], onSuccess }) {
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overlapError, setOverlapError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setLeaveType("");
      setStartDate("");
      setEndDate("");
      setPurpose("");
      setOverlapError("");
    }
  }, [open]);

  // Parse selected credit
  const selectedCredit = leaveCredits.find(
    (c) => `${c.id}` === leaveType
  );
  const remaining = selectedCredit
    ? selectedCredit.total_credits - selectedCredit.used_credits
    : null;

  // Check for overlapping leaves when dates change
  useEffect(() => {
    const checkOverlap = async () => {
      if (!startDate || !endDate || !employee?.id) {
        setOverlapError("");
        return;
      }

      const { data, error } = await supabase
        .from("leave_applications")
        .select("id, leave_type, start_date, end_date, status")
        .eq("employee_id", employee.id)
        .in("status", ["pending", "approved"])
        .lte("start_date", endDate)
        .gte("end_date", startDate);

      if (!error && data && data.length > 0) {
        const overlap = data[0];
        setOverlapError(
          `You already have a ${overlap.status} ${overlap.leave_type} leave from ${overlap.start_date} to ${overlap.end_date} that overlaps with these dates.`
        );
      } else {
        setOverlapError("");
      }
    };

    checkOverlap();
  }, [startDate, endDate, employee?.id]);

  const isFormValid =
    leaveType &&
    startDate &&
    endDate &&
    purpose.trim() &&
    remaining > 0 &&
    !overlapError &&
    new Date(endDate) >= new Date(startDate);

  const handleSubmit = async () => {
    if (!isFormValid || !selectedCredit || !employee?.id) return;

    setIsSubmitting(true);
    try {
      // Insert leave application
      const { error: insertError } = await supabase
        .from("leave_applications")
        .insert({
          employee_id: employee.id,
          leave_credit_id: selectedCredit.id,
          leave_type: selectedCredit.leave_type,
          is_commutable: selectedCredit.is_commutable,
          start_date: startDate,
          end_date: endDate,
          purpose: purpose.trim(),
          status: "pending",
        });

      if (insertError) throw insertError;

      // Notify employee (self-confirmation)
      await supabase.from("notifications").insert({
        employee_id: employee.id,
        type: "info",
        title: "Leave Application Submitted",
        message: `Your ${selectedCredit.leave_type} Leave application from ${startDate} to ${endDate} has been submitted and is pending HR approval.`,
      });

      // Log to admin activity
      await supabase.from("admin_activity_log").insert({
        actor_type: "employee",
        actor_name: `${employee.first_name} ${employee.last_name}`,
        action: "employee_filed_leave",
        description: `${employee.first_name} ${employee.last_name} filed a ${selectedCredit.leave_type} Leave application (${startDate} to ${endDate})`,
        employee_id: employee.id,
      });

      toast.success("Leave application submitted successfully!");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error filing leave:", err);
      toast.error("Failed to submit leave application: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-none shadow-2xl">
        {/* Header */}
        <div className="bg-[#0C005F] p-6 text-white">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-white/70" />
            File Leave Application
          </DialogTitle>
          <DialogDescription className="text-white/60 text-xs mt-1 uppercase tracking-widest font-medium">
            Submit a leave request for HR approval
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6">
          {/* Leave Type */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Leave Type
            </Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className="h-11 bg-white border-slate-200 focus:ring-[#0C005F]/20">
                <SelectValue placeholder="Select leave type..." />
              </SelectTrigger>
              <SelectContent>
                {leaveCredits.map((credit) => {
                  const avail = credit.total_credits - credit.used_credits;
                  const isExhausted = avail <= 0;
                  return (
                    <SelectItem
                      key={credit.id}
                      value={`${credit.id}`}
                      disabled={isExhausted}
                      className="py-3"
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className={isExhausted ? "text-slate-400 line-through" : ""}>
                          {credit.leave_type} Leave
                          <span className="text-muted-foreground text-[10px] ml-1">
                            ({credit.is_commutable ? "Comm." : "Non-comm."})
                          </span>
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold ml-2 shrink-0 ${
                            isExhausted
                              ? "bg-red-50 text-red-500"
                              : avail <= 2
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {avail} left
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Credit warning */}
            {selectedCredit && remaining !== null && remaining <= 2 && remaining > 0 && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Low credits! Only {remaining} {selectedCredit.leave_type} Leave credit{remaining > 1 ? "s" : ""} remaining.</span>
              </div>
            )}
            {selectedCredit && remaining !== null && remaining <= 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>No credits remaining for {selectedCredit.leave_type} Leave. You cannot file this type.</span>
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                From
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="h-11 bg-white border-slate-200 focus-visible:ring-[#0C005F]/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                To
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split("T")[0]}
                className="h-11 bg-white border-slate-200 focus-visible:ring-[#0C005F]/20"
              />
            </div>
          </div>

          {/* Overlap error */}
          {overlapError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{overlapError}</span>
            </div>
          )}

          {/* Purpose */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Purpose of Leave
            </Label>
            <Textarea
              placeholder="Please describe the reason for your leave..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              className="bg-white border-slate-200 focus-visible:ring-[#0C005F]/20 resize-none"
            />
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-600 text-[11px]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This request will be sent to HR for approval. 1 credit will be deducted from your{" "}
              {selectedCredit ? `${selectedCredit.leave_type} Leave` : "selected leave type"} balance upon approval.
            </span>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="bg-[#0C005F] hover:bg-[#0C005F]/90 gap-2 px-6 shadow-lg shadow-[#0C005F]/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
