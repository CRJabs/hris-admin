import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, Activity, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

function LeaveBalanceCard({ id, title, total, used, isCommutable, isReadOnly, onValueChange, isDirty }) {
  const [localTotal, setLocalTotal] = useState(total);
  const [localUsed, setLocalUsed] = useState(used);

  useEffect(() => {
    setLocalTotal(total);
    setLocalUsed(used);
  }, [total, used]);

  const handleChange = (type, val) => {
    const numVal = parseFloat(val) || 0;
    if (type === 'total') {
      setLocalTotal(numVal);
      onValueChange(id, numVal, localUsed);
    } else {
      setLocalUsed(numVal);
      onValueChange(id, localTotal, numVal);
    }
  };

  const remaining = localTotal - localUsed;
  const isLow = remaining > 0 && remaining <= 2;
  const isExhausted = remaining <= 0;

  let cardBorderClass = "border-slate-200";
  if (isDirty) cardBorderClass = "border-amber-400 ring-1 ring-amber-400/20";
  else if (isExhausted) cardBorderClass = "border-red-200 opacity-60";
  else if (isLow) cardBorderClass = "border-amber-300";

  return (
    <Card className={`shadow-none rounded-[8px] overflow-hidden relative transition-all ${cardBorderClass}`}>
      <div className={`h-1.5 w-full ${isCommutable ? "bg-amber-400" : "bg-[#0C005F]"}`} />
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-sm text-slate-800">{title}</h4>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{isCommutable ? "Commutable" : "Non-commutable"}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {isDirty && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0 border-none animate-pulse">
                Unsaved
              </Badge>
            )}
            {isExhausted && (
              <Badge variant="secondary" className="bg-red-50 text-red-500 text-[9px] font-bold px-1.5 py-0 border-none">
                Exhausted
              </Badge>
            )}
            {isLow && !isExhausted && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-600 text-[9px] font-bold px-1.5 py-0 border-none flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> Low
              </Badge>
            )}
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 border-none">
              {remaining} Available
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Allocation</label>
            {isReadOnly ? (
              <div className="h-9 w-full rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm font-bold text-slate-700 flex items-center">
                {localTotal}
              </div>
            ) : (
              <Input
                type="number"
                value={localTotal}
                onChange={(e) => handleChange('total', e.target.value)}
                className="h-9 text-sm font-bold bg-white border-slate-200 focus-visible:ring-[#0C005F]/20"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Used Credits</label>
            {isReadOnly ? (
              <div className="h-9 w-full rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm font-bold text-slate-400 flex items-center">
                {localUsed}
              </div>
            ) : (
              <Input
                type="number"
                value={localUsed}
                onChange={(e) => handleChange('used', e.target.value)}
                className="h-9 text-sm font-bold bg-white border-slate-200 focus-visible:ring-[#0C005F]/20"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeaveTab({ employee, isReadOnly = false, onChange, requestedChanges = null, leaveCredits = [], isAdminView = false, leaveApplications = [], onRefresh }) {
  const [isCommutableCollapsed, setIsCommutableCollapsed] = useState(false);
  const [isNonCommutableCollapsed, setIsNonCommutableCollapsed] = useState(false);
  const [fileLeaveOpen, setFileLeaveOpen] = useState(false);
  const [dirtyCredits, setDirtyCredits] = useState({}); // { id: { total, used } }
  const [isSaving, setIsSaving] = useState(false);

  const isTeaching = employee.employment_classification === "Teaching";

  const handleValueChange = (id, total, used) => {
    setDirtyCredits(prev => ({
      ...prev,
      [id]: { total, used }
    }));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(dirtyCredits).map(([id, values]) =>
        supabase
          .from('leave_credits')
          .update({
            total_credits: values.total,
            used_credits: values.used,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) throw errors[0].error;

      setDirtyCredits({});
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Failed to save changes: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    setDirtyCredits({});
    toast.info("Changes discarded.");
  };

  // Merge original credits with dirty state for display
  const displayCredits = leaveCredits.map(c => {
    const dirty = dirtyCredits[c.id];
    return {
      id: c.id,
      title: `${c.leave_type} Leave`,
      total: dirty ? dirty.total : parseFloat(c.total_credits),
      used: dirty ? dirty.used : parseFloat(c.used_credits),
      isCommutable: c.is_commutable,
      isDirty: !!dirty
    };
  });

  const commutable = displayCredits.filter(c => c.isCommutable);
  const nonCommutable = displayCredits.filter(c => !c.isCommutable);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-bold">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[9px] font-bold">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[9px] font-bold">Rejected</Badge>;
      default:
        return null;
    }
  };

  const hasDirty = Object.keys(dirtyCredits).length > 0;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Credits Breakdown */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex flex-col gap-6">
            {commutable.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-l-4 border-amber-400 pl-3 bg-amber-50/30 py-1 rounded-r-md">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Commutable Credits</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400"
                    onClick={() => setIsCommutableCollapsed(!isCommutableCollapsed)}
                  >
                    {isCommutableCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  </Button>
                </div>
                {!isCommutableCollapsed && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {commutable.map((leave, idx) => (
                      <LeaveBalanceCard
                        key={leave.id}
                        id={leave.id}
                        title={leave.title}
                        total={leave.total}
                        used={leave.used}
                        isCommutable={leave.isCommutable}
                        isReadOnly={isReadOnly}
                        onValueChange={handleValueChange}
                        isDirty={leave.isDirty}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {nonCommutable.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-l-4 border-[#0C005F] pl-3 bg-blue-50/30 py-1 rounded-r-md">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Non-commutable Credits</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400"
                    onClick={() => setIsNonCommutableCollapsed(!isNonCommutableCollapsed)}
                  >
                    {isNonCommutableCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  </Button>
                </div>
                {!isNonCommutableCollapsed && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {nonCommutable.map((leave, idx) => (
                      <LeaveBalanceCard
                        key={leave.id}
                        id={leave.id}
                        title={leave.title}
                        total={leave.total}
                        used={leave.used}
                        isCommutable={leave.isCommutable}
                        isReadOnly={isReadOnly}
                        onValueChange={handleValueChange}
                        isDirty={leave.isDirty}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save/Discard Batch Actions */}
          {hasDirty && !isReadOnly && (
            <div className="sticky bottom-6 bg-white p-4 rounded-xl border-2 border-amber-400 shadow-xl animate-in slide-in-from-bottom-4 z-50">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-xs font-bold text-slate-700">{Object.keys(dirtyCredits).length} pending changes</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={discardChanges}
                    disabled={isSaving}
                    className="border-slate-200 text-slate-600 font-bold"
                  >
                    Discard
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={saveChanges}
                    disabled={isSaving}
                    className="bg-[#0C005F] hover:bg-[#0C005F]/90 font-bold"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Recent Leave Activity */}
        <div className="lg:col-span-8">
          <Card className="shadow-none border border-slate-200 rounded-[8px] flex flex-col bg-white" style={{ height: "600px" }}>
            <CardHeader className="p-4 border-b bg-slate-50/50 flex flex-row items-center justify-between space-y-0 shrink-0">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-700">
                Recent Leave Activity
              </CardTitle>
              {/* Centralized filing button is now in the header actions bar */}
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {leaveApplications.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/30 m-6">
                    No recent leave applications.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {leaveApplications.map((app) => (
                      <div key={app.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold text-slate-800">{app.leave_type} Leave</p>
                              {getStatusBadge(app.status)}
                              <Badge variant="secondary" className={`text-[9px] ${app.is_commutable ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                                {app.is_commutable ? "Comm." : "Non-Comm."}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                              <CalendarDays className="w-3 h-3" />
                              {format(new Date(app.start_date + "T00:00:00"), "MMM d, yyyy")} → {format(new Date(app.end_date + "T00:00:00"), "MMM d, yyyy")}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 truncate">{app.purpose}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {format(new Date(app.created_at), "MMM d")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Centralized leave modal is handled in FileRequestModal */}
    </>
  );
}
