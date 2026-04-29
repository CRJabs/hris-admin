import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, X, CalendarDays, RefreshCw, Save, Activity, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import EmployeeFilters from "@/components/employees/EmployeeFilters";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { assignDefaultLeaveCredits, DEFAULT_LEAVE_CREDITS } from "@/utils/leaveUtils";
import { cn } from "@/lib/utils";


export default function AssignLeaveCredits() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [globalSearch, setGlobalSearch] = useState("");
  const [filters, setFilters] = useState({ departments: [], statuses: [], classifications: [], active: "Active" });
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [leaveCredits, setLeaveCredits] = useState([]);
  const [isFetchingCredits, setIsFetchingCredits] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      toast.error("Failed to fetch employees");
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
    } catch (err) {
      console.error("Error fetching credits:", err);
      toast.error("Failed to fetch leave credits");
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
    setFilters({ departments: [], statuses: [], classifications: [], active: "Active" });
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
      const matchesClassification = !filters.classifications?.length || filters.classifications.includes(emp.employment_classification);
      const matchesActive = filters.active === "All" ||
        (filters.active === "Active" && emp.is_active) ||
        (filters.active === "Inactive" && !emp.is_active);

      return matchesSearch && matchesDept && matchesStatus && matchesClassification && matchesActive;
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

      toast.success("Leave credits reset to system defaults.");
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
      toast.error("Failed to reset credits: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateCredit = async (creditId, updates, creditSnapshot) => {
    // Use the passed snapshot first; fall back to current state lookup
    const creditToUpdate = creditSnapshot || leaveCredits.find(c => c.id === creditId);
    if (!creditToUpdate) return;

    // Ensure total_credits is integer and >= 0
    if (updates.total_credits !== undefined) {
      updates.total_credits = Math.max(0, Math.floor(updates.total_credits));
      
      const systemDefaults = DEFAULT_LEAVE_CREDITS[selectedEmployee.employment_classification];
      
      // Strictly apply the system default as the absolute limit for each specific leave type
      const specificDefault = systemDefaults.find(d => 
        d.leave_type === creditToUpdate.leave_type && 
        d.is_commutable === creditToUpdate.is_commutable
      );

      if (specificDefault && updates.total_credits > specificDefault.total_credits) {
        toast.error(`${creditToUpdate.leave_type} Leave (${creditToUpdate.is_commutable ? 'Commutable' : 'Non-commutable'}) cannot exceed its system default of ${specificDefault.total_credits}.`);
        return;
      }

      // Keep the commuting pool logic as well if needed, but the individual cap takes precedence now
      if (creditToUpdate.is_commutable) {
        const otherCommutableTotal = leaveCredits
          .filter(c => c.is_commutable && c.id !== creditId)
          .reduce((acc, c) => acc + c.total_credits, 0);
        
        const allowedPoolMax = systemDefaults
          .filter(c => c.is_commutable)
          .reduce((acc, c) => acc + c.total_credits, 0);

        if (otherCommutableTotal + updates.total_credits > allowedPoolMax) {
          toast.error(`Total commutable credits cannot exceed the ${allowedPoolMax} pool limit.`);
          return;
        }
      }
    }


    try {
      const { error } = await supabase
        .from('leave_credits')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', creditId);
      
      if (error) throw error;
      
      setLeaveCredits(prev => prev.map(c => c.id === creditId ? { ...c, ...updates } : c));
      toast.success("Credit updated successfully.");

      // Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: 'admin_assigned_leave_credits',
        description: `Updated ${creditToUpdate.leave_type} leave credits for ${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
        employee_id: selectedEmployee.id
      });
    } catch (err) {
      toast.error("Failed to update credit");
    }
  };


  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Employee List */}
        <div className="w-1/3 border-r bg-slate-50/50 flex flex-col overflow-hidden">
          <div className="p-4 space-y-4 border-b bg-white">
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
              <EmployeeFilters filters={filters} onFilterChange={handleFilterChange} onClear={clearFilters} />
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
                          <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
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
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
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
              <div className="p-6 border-b flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                    {selectedEmployee.photo_url ? (
                      <img src={selectedEmployee.photo_url} alt="" className="w-full h-full object-cover" />
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
                      {Math.floor(leaveCredits.reduce((acc, c) => acc + (c.total_credits - c.used_credits), 0))}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetToDefault}
                    disabled={isActionLoading}
                    className="gap-2 text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Initialize to Defaults
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6">
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
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {leaveCredits.map((credit) => (
                        <Card key={credit.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200">
                          <div className={cn(
                            "h-1.5 w-full",
                            credit.is_commutable ? "bg-amber-400" : "bg-[#0C005F]"
                          )} />
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-bold text-sm">{credit.leave_type} Leave</h3>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                  {credit.is_commutable ? "Commutable" : "Non-Commutable"}
                                </p>
                              </div>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5">
                                {Math.floor(credit.total_credits - credit.used_credits)} Available
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Total Allocation</label>
                                <div className="flex items-center gap-2">
                                  <Input 
                                    type="number" 
                                    value={credit.total_credits}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setLeaveCredits(prev => prev.map(c => c.id === credit.id ? { ...c, total_credits: val } : c));
                                    }}
                                    onBlur={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      // Pass the original snapshot from the render so validation uses correct baseline
                                      handleUpdateCredit(credit.id, { total_credits: val }, credit);
                                    }}
                                    className="h-8 text-xs font-bold focus:ring-[#0C005F]"
                                  />

                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Used Credits</label>
                                <div className="flex items-center gap-2">
                                  <Input 
                                    type="number" 
                                    value={Math.floor(credit.used_credits)}
                                    readOnly
                                    className="h-8 text-xs font-bold bg-slate-50 border-slate-100 text-slate-400"
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
