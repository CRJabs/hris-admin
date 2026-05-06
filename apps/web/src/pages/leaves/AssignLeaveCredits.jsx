import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, X, CalendarDays, RefreshCw, Save, Activity, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import EmployeeFilters from "@/components/employees/EmployeeFilters";
// import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { assignDefaultLeaveCredits, DEFAULT_LEAVE_CREDITS } from "@/utils/leaveUtils";
import { cn } from "@/lib/utils";
import { useOrgDepartments } from "@/hooks/useOrgDepartments";


export default function AssignLeaveCredits() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [globalSearch, setGlobalSearch] = useState("");
  const [filters, setFilters] = useState({ departments: [], statuses: [], tenures: [], classifications: [], active: "Active" });
  const { departments: liveDepartments } = useOrgDepartments();

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [leaveCredits, setLeaveCredits] = useState([]);
  const [isFetchingCredits, setIsFetchingCredits] = useState(false);
  const [dirtyCredits, setDirtyCredits] = useState({}); // { id: { total_credits } }
  const [isSaving, setIsSaving] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaveCredits = async (empId) => {
    if (!empId) return;
    setIsFetchingCredits(true);
    try {
      const { data, error } = await supabase
        .from('leave_credits')
        .select('*')
        .eq('employee_id', empId)
        .order('leave_type', { ascending: true });

      if (error) throw error;
      setLeaveCredits(data || []);
      setDirtyCredits({}); // Clear dirty state when switching employees
    } catch (err) {
      console.error("Error fetching credits:", err);
    } finally {
      setIsFetchingCredits(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchLeaveCredits(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ departments: [], statuses: [], tenures: [], classifications: [], active: "Active" });
    setGlobalSearch("");
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const search = (globalSearch || "").toLowerCase();
      const matchesSearch = !search ||
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search) ||
        (emp.employee_id && emp.employee_id.toLowerCase().includes(search));

      const matchesDept = !filters.departments?.length || filters.departments.includes(emp.department);
      const matchesStatus = !filters.statuses?.length || filters.statuses.includes(emp.employment_status);
      const matchesTenure = !filters.tenures?.length || filters.tenures.includes(emp.employment_tenure);
      const matchesClassification = !filters.classifications?.length || filters.classifications.includes(emp.employment_classification);
      const matchesActive = filters.active === "All" ||
        (filters.active === "Active" && emp.is_active) ||
        (filters.active === "Inactive" && !emp.is_active);

      return matchesSearch && matchesDept && matchesStatus && matchesTenure && matchesClassification && matchesActive;
    });
  }, [employees, filters, globalSearch]);

  const handleResetToDefault = async () => {
    if (!selectedEmployee) return;
    setIsActionLoading(true);
    try {
      // Delete existing credits first
      const { error: deleteError } = await supabase
        .from('leave_credits')
        .delete()
        .eq('employee_id', selectedEmployee.id);

      if (deleteError) throw deleteError;

      // Assign defaults
      const res = await assignDefaultLeaveCredits(selectedEmployee.id, selectedEmployee.employment_classification);
      if (!res.success) throw res.error;

      fetchLeaveCredits(selectedEmployee.id);

      // Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: 'admin_assigned_leave_credits',
        description: `Reset leave credits to defaults for ${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
        employee_id: selectedEmployee.id
      });
    } catch (err) {
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleValueChange = (id, val) => {
    const numVal = parseInt(val) || 0;
    setDirtyCredits(prev => ({
      ...prev,
      [id]: { total_credits: numVal }
    }));
  };

  const saveChanges = async () => {
    if (!selectedEmployee) return;
    setIsSaving(true);
    try {
      const updates = Object.entries(dirtyCredits).map(([id, values]) => {
        const creditToUpdate = leaveCredits.find(c => c.id === id);
        if (!creditToUpdate) return null;

        // Validation logic
        let finalVal = Math.max(0, Math.floor(values.total_credits));
        const systemDefaults = DEFAULT_LEAVE_CREDITS[selectedEmployee.employment_classification];
        const specificDefault = systemDefaults.find(d =>
          d.leave_type === creditToUpdate.leave_type &&
          d.is_commutable === creditToUpdate.is_commutable
        );

        if (specificDefault && finalVal > specificDefault.total_credits) {
          throw new Error(`${creditToUpdate.leave_type} Leave (${creditToUpdate.is_commutable ? 'Commutable' : 'Non-commutable'}) cannot exceed its system default of ${specificDefault.total_credits}.`);
        }

        return supabase
          .from('leave_credits')
          .update({ total_credits: finalVal, updated_at: new Date().toISOString() })
          .eq('id', id);
      }).filter(Boolean);

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;

      // Batch Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: 'admin_assigned_leave_credits',
        description: `Updated leave credits for ${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
        employee_id: selectedEmployee.id
      });


      setDirtyCredits({});
      fetchLeaveCredits(selectedEmployee.id);
    } catch (err) {
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    setDirtyCredits({});
  };

  const displayCredits = leaveCredits.map(c => {
    const dirty = dirtyCredits[c.id];
    return {
      ...c,
      total_credits: dirty ? dirty.total_credits : c.total_credits,
      isDirty: !!dirty
    };
  });

  const commutable = displayCredits.filter(c => c.is_commutable);
  const nonCommutable = displayCredits.filter(c => !c.is_commutable);

  const hasDirty = Object.keys(dirtyCredits).length > 0;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Employee List */}
        <div className="w-1/3 border-r bg-slate-50/50 flex flex-col overflow-hidden">
          <div className="h-[105px] p-4 flex flex-col justify-center gap-3 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <div className="flex items-center justify-between">
              <EmployeeFilters filters={filters} onFilterChange={handleFilterChange} onClear={clearFilters} departments={liveDepartments} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                {filteredEmployees.length} Found
              </span>
            </div>


          </div>

          <ScrollArea className="flex-1">
            <div className="divide-y">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-xs">Loading employees...</p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs italic">
                  No employees found matching filters.
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={cn(
                      "p-4 cursor-pointer transition-all duration-200",
                      selectedEmployee?.id === emp.id
                        ? "bg-[#0C005F]/5 border-l-4 border-[#0C005F] shadow-inner"
                        : "bg-transparent hover:bg-slate-100/50"
                    )}
                  >

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200">
                        {emp.photo_url ? (
                          <img key={emp.photo_url} src={emp.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 uppercase">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate leading-tight">
                          {emp.last_name}, {emp.first_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">
                          {emp.employee_id} • {emp.employment_classification}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Leave Credit Table */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
          {!selectedEmployee ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <CalendarDays className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-bold text-lg">No Employee Selected</p>
              <p className="text-sm max-w-xs">Select an employee from the list to view and manage their leave credits.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="h-[105px] px-6 py-4 border-b flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                    {selectedEmployee.photo_url ? (
                      <img key={selectedEmployee.photo_url} src={selectedEmployee.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-[#0C005F] uppercase">
                        {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{selectedEmployee.first_name} {selectedEmployee.last_name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] h-5 bg-slate-50">{selectedEmployee.department}</Badge>
                      <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200 font-bold uppercase">{selectedEmployee.employment_classification}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Available Credits</p>
                    <p className="text-xl font-black text-[#0C005F]">
                      {Math.floor(displayCredits.reduce((acc, c) => acc + (c.total_credits - c.used_credits), 0))}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetToDefault}
                    disabled={isActionLoading || isSaving}
                    className="gap-2 text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Initialize to Defaults
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6 pb-24">
                {isFetchingCredits ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0C005F]" />
                    <p className="text-sm text-muted-foreground font-medium">Fetching credits...</p>
                  </div>
                ) : leaveCredits.length === 0 ? (
                  <Card className="border-dashed border-2 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                      <Activity className="w-10 h-10 mb-4 opacity-20" />
                      <p className="font-bold">No Leave Credits Found</p>
                      <p className="text-xs max-w-xs mt-1 mb-6">This employee hasn't been assigned any leave credits yet. Initialize them to system defaults to get started.</p>
                      <Button onClick={handleResetToDefault} disabled={isActionLoading} className="bg-[#0C005F] hover:bg-[#0C005F]/90 shadow-lg shadow-[#0C005F]/20">
                        {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Initialize Credits Now
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-10">
                    {/* Commutable Section */}
                    {commutable.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 border-l-4 border-amber-400 pl-4 py-1 bg-amber-50/30 rounded-r-xl">
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Commutable Credits</h3>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          {commutable.map((credit) => (
                            <CreditCard
                              key={credit.id}
                              credit={credit}
                              onValueChange={handleValueChange}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Non-Commutable Section */}
                    {nonCommutable.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 border-l-4 border-[#0C005F] pl-4 py-1 bg-blue-50/30 rounded-r-xl">
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Non-Commutable Credits</h3>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          {nonCommutable.map((credit) => (
                            <CreditCard
                              key={credit.id}
                              credit={credit}
                              onValueChange={handleValueChange}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Batch Actions Bar */}
              {hasDirty && (
                <div className="fixed bottom-10 left-[66.6%] -translate-x-1/2 max-w-xl w-[calc(66.6%-4rem)] bg-white/95 backdrop-blur-md p-5 rounded-3xl border-2 border-amber-400/50 shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-10 duration-500 z-[100] ring-1 ring-amber-400/10">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{Object.keys(dirtyCredits).length} pending changes</p>
                        <p className="text-[10px] text-slate-400 font-medium">Click save to apply to employee record</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={discardChanges}
                        disabled={isSaving}
                        className="h-9 px-4 border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                      >
                        Discard
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={saveChanges}
                        disabled={isSaving}
                        className="h-9 px-6 bg-[#0C005F] hover:bg-[#0C005F]/90 font-bold shadow-lg shadow-[#0C005F]/20"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreditCard({ credit, onValueChange }) {
  const [localVal, setLocalVal] = useState(credit.total_credits);

  useEffect(() => {
    setLocalVal(credit.total_credits);
  }, [credit.total_credits]);

  return (
    <Card className={cn(
      "overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-slate-200",
      credit.isDirty && "border-amber-400 shadow-amber-100 ring-1 ring-amber-400/20"
    )}>
      <div className={cn(
        "h-1.5 w-full",
        credit.is_commutable ? "bg-amber-400" : "bg-[#0C005F]"
      )} />
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-800">{credit.leave_type} Leave</h3>
              {credit.isDirty && (
                <Badge className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0 border-none animate-pulse">
                  Unsaved
                </Badge>
              )}
            </div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
              {credit.is_commutable ? "Commutable" : "Non-Commutable"}
            </p>
          </div>
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 border-none">
            {Math.floor(localVal - credit.used_credits)} Available
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Allocation</label>
            <Input
              type="number"
              value={localVal}
              onChange={(e) => {
                const val = e.target.value;
                setLocalVal(val);
                onValueChange(credit.id, val);
              }}
              className="h-9 text-sm font-bold focus-visible:ring-[#0C005F]/20 border-slate-200 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Used Credits</label>
            <div className="h-9 w-full rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm font-bold text-slate-400 flex items-center">
              {Math.floor(credit.used_credits)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
