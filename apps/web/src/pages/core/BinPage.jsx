import { useState, useEffect } from "react";
import { History, Trash2, RotateCcw, AlertTriangle, Filter, RefreshCw, Calendar, FileText, UserPlus, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import ActivityTabs from "@/components/activity/ActivityTabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function BinPage() {
  const [binItems, setBinItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [clearBinOpen, setClearBinOpen] = useState(false);
  const [restoreAllOpen, setRestoreAllOpen] = useState(false);
  const [counts, setCounts] = useState({
    profile_update: 0,
    registration: 0,
    leave_application: 0,
    employee: 0,
    all: 0,
  });

  const fetchBinItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("bin")
        .select("*")
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      const items = data || [];
      setBinItems(items);

      // Compute counts
      const newCounts = {
        profile_update: items.filter((i) => i.record_type === "profile_update").length,
        registration: items.filter((i) => i.record_type === "registration").length,
        leave_application: items.filter((i) => i.record_type === "leave_application").length,
        employee: items.filter((i) => i.record_type === "employee").length,
        all: items.length,
      };
      setCounts(newCounts);
    } catch (err) {
      console.error("Failed to load bin items:", err);
      toast.error("Failed to load deleted records from the bin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBinItems();

    const sub = supabase
      .channel("bin_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bin" },
        fetchBinItems
      )
      .subscribe();

    return () => sub.unsubscribe();
  }, []);

  const sanitizeRecord = (type, data) => {
    const sanitized = { ...data };
    
    // Always strip joined relation properties that are not column names in the destination tables
    delete sanitized.employees;
    delete sanitized.employee_credits;
    delete sanitized.leave_credits;
    delete sanitized.pendingRequests;
    
    return sanitized;
  };

  const handleRestoreItem = async (item) => {
    try {
      const now = new Date();
      const isExpired = new Date(item.expires_at) < now;
      if (isExpired) {
        toast.error("This record has expired and cannot be restored.");
        return;
      }

      let destinationTable = "";
      let insertData = sanitizeRecord(item.record_type, item.record_data);

      if (item.record_type === "profile_update") {
        destinationTable = "employee_update_requests";
      } else if (item.record_type === "registration") {
        destinationTable = "employees";
        // Registrations default to inactive & Pending
        insertData.is_active = false;
        insertData.employment_status = "Pending";
      } else if (item.record_type === "leave_application") {
        destinationTable = "leave_applications";
      } else if (item.record_type === "employee") {
        destinationTable = "employees";
        // Employee record defaults to Inactive and not active when restored
        insertData.is_active = false;
        insertData.employment_status = "Inactive";
      }

      if (!destinationTable) {
        throw new Error(`Unknown record type: ${item.record_type}`);
      }

      // Re-insert into original table
      const { error: restoreError } = await supabase
        .from(destinationTable)
        .insert(insertData);

      if (restoreError) throw restoreError;

      // Extra logic for leave application credits re-deduction
      if (
        item.record_type === "leave_application" &&
        insertData.status === "approved" &&
        insertData.leave_credit_id
      ) {
        // Fetch current credits
        const { data: creditData } = await supabase
          .from("leave_credits")
          .select("used_credits")
          .eq("id", insertData.leave_credit_id)
          .single();

        if (creditData) {
          const newUsed = parseFloat(creditData.used_credits) + 1;
          await supabase
            .from("leave_credits")
            .update({
              used_credits: newUsed,
              updated_at: new Date().toISOString(),
            })
            .eq("id", insertData.leave_credit_id);

          // Add leave transaction log
          await supabase.from("leave_transactions").insert({
            employee_id: insertData.employee_id,
            leave_credit_id: insertData.leave_credit_id,
            amount: 1,
            description: `Restored approved ${insertData.leave_type} Leave (${insertData.start_date} to ${insertData.end_date})`,
          });
        }
      }

      // Log to admin activity log
      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: "Administrator",
        action: "admin_edited_employee", // generic log action
        description: `Restored deleted record: ${item.label}`,
      });

      // Delete from bin
      const { error: deleteBinError } = await supabase
        .from("bin")
        .delete()
        .eq("id", item.id);

      if (deleteBinError) throw deleteBinError;

      toast.success(`Successfully restored "${item.label}"`);
      fetchBinItems();
    } catch (err) {
      console.error("Restore error:", err);
      toast.error(`Failed to restore record: ${err.message}`);
    }
  };

  const handlePermanentDelete = async (item) => {
    try {
      const { error } = await supabase
        .from("bin")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      toast.success(`Permanently deleted "${item.label}"`);
      fetchBinItems();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete record permanently.");
    }
  };

  const handleClearBin = async () => {
    try {
      const { error } = await supabase
        .from("bin")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all

      if (error) throw error;
      toast.success("Successfully emptied the bin.");
      setBinItems([]);
      setCounts({
        profile_update: 0,
        registration: 0,
        leave_application: 0,
        employee: 0,
        all: 0,
      });
    } catch (err) {
      console.error("Clear bin error:", err);
      toast.error("Failed to empty the bin.");
    } finally {
      setClearBinOpen(false);
    }
  };

  const handleRestoreAll = async () => {
    try {
      const now = new Date();
      // Get all non-expired items
      const restorableItems = binItems.filter((i) => new Date(i.expires_at) > now);

      if (restorableItems.length === 0) {
        toast.info("No restorable items in the bin.");
        setRestoreAllOpen(false);
        return;
      }

      let succeededCount = 0;
      let failedCount = 0;

      for (const item of restorableItems) {
        try {
          let destinationTable = "";
          let insertData = sanitizeRecord(item.record_type, item.record_data);

          if (item.record_type === "profile_update") {
            destinationTable = "employee_update_requests";
          } else if (item.record_type === "registration") {
            destinationTable = "employees";
            insertData.is_active = false;
            insertData.employment_status = "Pending";
          } else if (item.record_type === "leave_application") {
            destinationTable = "leave_applications";
          } else if (item.record_type === "employee") {
            destinationTable = "employees";
            insertData.is_active = false;
            insertData.employment_status = "Inactive";
          }

          if (destinationTable) {
            // Re-insert
            const { error: restoreError } = await supabase
              .from(destinationTable)
              .insert(insertData);

            if (restoreError) throw restoreError;

            // Extra logic for approved leaves
            if (
              item.record_type === "leave_application" &&
              insertData.status === "approved" &&
              insertData.leave_credit_id
            ) {
              const { data: creditData } = await supabase
                .from("leave_credits")
                .select("used_credits")
                .eq("id", insertData.leave_credit_id)
                .single();

              if (creditData) {
                const newUsed = parseFloat(creditData.used_credits) + 1;
                await supabase
                  .from("leave_credits")
                  .update({
                    used_credits: newUsed,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", insertData.leave_credit_id);

                await supabase.from("leave_transactions").insert({
                  employee_id: insertData.employee_id,
                  leave_credit_id: insertData.leave_credit_id,
                  amount: 1,
                  description: `Restored approved ${insertData.leave_type} Leave (${insertData.start_date} to ${insertData.end_date})`,
                });
              }
            }

            // Delete from bin
            await supabase.from("bin").delete().eq("id", item.id);
            succeededCount++;
          }
        } catch (err) {
          console.error(`Failed to restore item ${item.id}:`, err);
          failedCount++;
        }
      }

      if (succeededCount > 0) {
        toast.success(`Successfully restored ${succeededCount} records.`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to restore ${failedCount} records.`);
      }

      fetchBinItems();
    } catch (err) {
      console.error("Restore all error:", err);
      toast.error("Failed to restore all records.");
    } finally {
      setRestoreAllOpen(false);
    }
  };

  const getRecordTypeIcon = (type) => {
    switch (type) {
      case "profile_update":
        return <FileText className="w-5 h-5 text-amber-500" />;
      case "registration":
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case "leave_application":
        return <Calendar className="w-5 h-5 text-green-500" />;
      case "employee":
        return <User className="w-5 h-5 text-purple-500" />;
      default:
        return <Trash2 className="w-5 h-5 text-slate-500" />;
    }
  };

  const getRecordTypeLabel = (type) => {
    switch (type) {
      case "profile_update":
        return "Profile Update";
      case "registration":
        return "New Registration";
      case "leave_application":
        return "Leave Application";
      case "employee":
        return "Employee Record";
      default:
        return "Unknown";
    }
  };

  const getRecordTypeBadgeColor = (type) => {
    switch (type) {
      case "profile_update":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "registration":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "leave_application":
        return "bg-green-50 text-green-700 border-green-200";
      case "employee":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Filter items
  const filteredItems = binItems.filter((item) => {
    if (typeFilter === "all") return true;
    return item.record_type === typeFilter;
  });

  return (
    <div className="p-4 md:p-6 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0C005F] flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Activity History</h1>
            <p className="text-sm text-muted-foreground">
              {binItems.length} items in bin &bull; Auto-purged after 1 year
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#0C005F]/20 text-[#0C005F] hover:bg-[#0C005F] hover:text-white transition-all"
            onClick={() => setRestoreAllOpen(true)}
            disabled={binItems.filter((i) => new Date(i.expires_at) > new Date()).length === 0}
          >
            <RotateCcw className="w-4 h-4" />
            Restore All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all"
            onClick={() => setClearBinOpen(true)}
            disabled={binItems.length === 0}
          >
            <Trash2 className="w-4 h-4" />
            Clear Bin
          </Button>
        </div>
      </div>

      {/* Shared Navigation Tab Bar */}
      <ActivityTabs active="bin" binCount={binItems.length} />

      {/* Summary Counts Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-slate-100 shadow-sm bg-slate-50/50">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">All Items</span>
            <span className="text-2xl font-black text-slate-900 mt-1">{counts.all}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm bg-amber-50/20">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Updates</span>
            <span className="text-2xl font-black text-amber-700 mt-1">{counts.profile_update}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm bg-blue-50/20">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registrations</span>
            <span className="text-2xl font-black text-blue-700 mt-1">{counts.registration}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm bg-green-50/20">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leaves</span>
            <span className="text-2xl font-black text-green-700 mt-1">{counts.leave_application}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm bg-purple-50/20">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employees</span>
            <span className="text-2xl font-black text-purple-700 mt-1">{counts.employee}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Content */}
      <div className="flex justify-between items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[240px] h-10 bg-white border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <SelectValue placeholder="Filter by Record Type" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types ({counts.all})</SelectItem>
            <SelectItem value="profile_update">Profile Updates ({counts.profile_update})</SelectItem>
            <SelectItem value="registration">New Registrations ({counts.registration})</SelectItem>
            <SelectItem value="leave_application">Leave Applications ({counts.leave_application})</SelectItem>
            <SelectItem value="employee">Employee Records ({counts.employee})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-20 animate-spin" />
          <p className="text-sm font-medium">Loading bin records...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border rounded-2xl border-dashed border-slate-200 bg-slate-50/30">
          <Trash2 className="w-14 h-14 mb-4 opacity-15" />
          <p className="font-semibold text-lg text-slate-700">Bin is empty</p>
          <p className="text-sm mt-1">Deleted files and data will show up here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((item) => {
            const now = new Date();
            const expires = new Date(item.expires_at);
            const isExpired = expires < now;
            const daysLeft = differenceInDays(expires, now);
            const isExpiringSoon = !isExpired && daysLeft <= 30;

            return (
              <div
                key={item.id}
                className={`relative rounded-xl border bg-white p-5 transition-all hover:shadow-md hover:border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                  isExpired ? "opacity-60 bg-slate-50" : ""
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                    {getRecordTypeIcon(item.record_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold uppercase tracking-wider ${getRecordTypeBadgeColor(
                          item.record_type
                        )}`}
                      >
                        {getRecordTypeLabel(item.record_type)}
                      </Badge>
                      {isExpired ? (
                        <Badge variant="destructive" className="text-[9px] font-bold uppercase tracking-wider bg-red-600 text-white">
                          Expired
                        </Badge>
                      ) : isExpiringSoon ? (
                        <Badge className="text-[9px] font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white border-none">
                          Expiring Soon ({daysLeft}d left)
                        </Badge>
                      ) : null}
                    </div>
                    <h3 className="font-black text-base text-slate-900 leading-tight">
                      {item.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Deleted {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })} &bull; Expires on{" "}
                      {format(new Date(item.expires_at), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-[#0C005F]/20 text-[#0C005F] hover:bg-[#0C005F] hover:text-white transition-all disabled:opacity-50"
                    onClick={() => handleRestoreItem(item)}
                    disabled={isExpired}
                    title={isExpired ? "Cannot restore expired items" : "Restore this record"}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                    onClick={() => handlePermanentDelete(item)}
                    title="Permanently delete from bin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear Bin Confirm Dialog */}
      <AlertDialog open={clearBinOpen} onOpenChange={setClearBinOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              Empty Trash Bin
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete all{" "}
              <strong>{binItems.length}</strong> items in the bin? This will permanently erase the data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearBin}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear Bin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore All Confirm Dialog */}
      <AlertDialog open={restoreAllOpen} onOpenChange={setRestoreAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#0C005F]">
              <RotateCcw className="w-5 h-5 animate-pulse" />
              Restore All Non-Expired Records
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore all restorable records? They will be returned to their respective original sections in the portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreAll}
              className="bg-[#0C005F] hover:bg-[#080044] text-white"
            >
              Restore All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
