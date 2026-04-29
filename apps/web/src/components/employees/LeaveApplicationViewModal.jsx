import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Check,
  X,
  Loader2,
  User,
  Clock,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LeaveApplicationViewModal({
  open,
  onOpenChange,
  application,
  onActionComplete,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState("");

  if (!application) return null;

  const emp = application.employees || {};
  const isPending = application.status === "pending";

  const handleAction = async (action) => {
    setIsProcessing(true);
    try {
      // 1. Update the leave application status
      const updatePayload = {
        status: action,
        reviewed_at: new Date().toISOString(),
      };
      if (action === "rejected" && adminRemarks.trim()) {
        updatePayload.admin_remarks = adminRemarks.trim();
      }

      const { error: updateError } = await supabase
        .from("leave_applications")
        .update(updatePayload)
        .eq("id", application.id);

      if (updateError) throw updateError;

      // 2. If approved, deduct 1 credit and insert transaction
      if (action === "approved" && application.leave_credit_id) {
        // Fetch current credit
        const { data: creditData, error: creditFetchError } = await supabase
          .from("leave_credits")
          .select("used_credits")
          .eq("id", application.leave_credit_id)
          .single();

        if (creditFetchError) throw creditFetchError;

        const newUsed = parseFloat(creditData.used_credits) + 1;

        const { error: creditError } = await supabase
          .from("leave_credits")
          .update({
            used_credits: newUsed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", application.leave_credit_id);

        if (creditError) throw creditError;

        // Insert audit record into leave_transactions
        await supabase.from("leave_transactions").insert({
          employee_id: application.employee_id,
          leave_credit_id: application.leave_credit_id,
          amount: 1,
          description: `Approved ${application.leave_type} Leave (${application.start_date} to ${application.end_date})`,
        });
      }

      // 3. Notify the employee
      const empName = `${emp.first_name} ${emp.last_name}`;
      await supabase.from("notifications").insert({
        employee_id: application.employee_id,
        type: action === "approved" ? "approved" : "rejected",
        title: `Leave ${action === "approved" ? "Approved" : "Rejected"}`,
        message:
          action === "approved"
            ? `Your ${application.leave_type} Leave from ${application.start_date} to ${application.end_date} has been approved.`
            : `Your ${application.leave_type} Leave request was rejected.${
                adminRemarks.trim()
                  ? ` Reason: ${adminRemarks.trim()}`
                  : ""
              }`,
      });

      // 4. Log to admin activity
      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: "Administrator",
        action:
          action === "approved"
            ? "admin_approved_leave"
            : "admin_rejected_leave",
        description: `${
          action === "approved" ? "Approved" : "Rejected"
        } ${application.leave_type} Leave for ${empName} (${application.start_date} to ${application.end_date})`,
        employee_id: application.employee_id,
        metadata: { leave_application_id: application.id },
      });

      toast.success(
        `Leave application ${action} successfully.`
      );
      onOpenChange(false);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error(`Error ${action} leave:`, err);
      toast.error(`Failed to ${action} leave: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
        {/* Header */}
        <div className="bg-[#0C005F] p-6 text-white">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-white/70" />
            Leave Application Review
          </DialogTitle>
          <DialogDescription className="text-white/60 text-xs mt-1 uppercase tracking-widest font-medium">
            {application.leave_type} Leave •{" "}
            {application.is_commutable ? "Commutable" : "Non-commutable"}
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200">
              {emp.photo_url ? (
                <img
                  src={emp.photo_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-800">
                {emp.first_name} {emp.last_name}
              </p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {emp.employee_id} • {emp.department} •{" "}
                {emp.position}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`shrink-0 text-[10px] font-bold uppercase ${
                application.status === "pending"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : application.status === "approved"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {application.status}
            </Badge>
          </div>

          {/* Leave Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Leave Type
              </p>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {application.leave_type} Leave
                <Badge
                  variant="secondary"
                  className={`text-[9px] ${
                    application.is_commutable
                      ? "bg-amber-50 text-amber-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {application.is_commutable ? "Comm." : "Non-Comm."}
                </Badge>
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Status
              </p>
              <p className="text-sm font-bold text-slate-800 capitalize">
                {application.status}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Start Date
              </p>
              <p className="text-sm font-bold text-slate-800">
                {format(new Date(application.start_date + "T00:00:00"), "MMMM d, yyyy")}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                End Date
              </p>
              <p className="text-sm font-bold text-slate-800">
                {format(new Date(application.end_date + "T00:00:00"), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Purpose of Leave
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
              {application.purpose}
            </div>
          </div>

          {/* Filed date */}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <Clock className="w-3 h-3" />
            Filed on{" "}
            {format(
              new Date(application.created_at),
              "MMMM d, yyyy 'at' h:mm a"
            )}
          </div>

          {/* Admin remarks for rejection */}
          {isPending && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Admin Remarks (optional — shown to employee on rejection)
              </Label>
              <Textarea
                placeholder="Add a reason for rejection if applicable..."
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                rows={2}
                className="bg-white border-slate-200 focus-visible:ring-[#0C005F]/20 resize-none text-sm"
              />
            </div>
          )}

          {/* Show remarks if already rejected */}
          {application.status === "rejected" && application.admin_remarks && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                Rejection Reason
              </p>
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                {application.admin_remarks}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {isPending && (
          <DialogFooter className="p-6 pt-0 gap-2 border-t bg-slate-50/50">
            <div className="flex w-full items-center justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => handleAction("rejected")}
                disabled={isProcessing}
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <X className="w-4 h-4" /> Reject
              </Button>
              <Button
                onClick={() => handleAction("approved")}
                disabled={isProcessing}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 px-8"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve Leave
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
