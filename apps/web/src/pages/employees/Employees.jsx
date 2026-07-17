import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import EmployeeFilters from "@/components/employees/EmployeeFilters";
import EmployeeTable from "@/components/employees/EmployeeTable";
import E201Modal from "@/components/employees/E201Modal";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useOrgDepartments } from "@/hooks/useOrgDepartments";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [globalSearch, setGlobalSearch] = useState("");
  const [filters, setFilters] = useState({ 
    departments: [], 
    statuses: [], 
    tenures: [], 
    classifications: [], 
    classificationsII: [], 
    classificationsIII: [], 
    active: "All" 
  });
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState("profiling");
  const [modalInitialEdit, setModalInitialEdit] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'last_name', direction: 'asc' });
  const { departments: liveDepartments } = useOrgDepartments();
  const [headEmployeeIds, setHeadEmployeeIds] = useState(new Set());

  const location = useLocation();
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;

      // Auto-transition New to Resident for employees hired >= 12 months ago
      const today = new Date();
      const updatedList = (data || []).map((emp) => {
        if ((emp.classification_iii === 'New' || !emp.classification_iii) && emp.date_hired) {
          const hired = new Date(emp.date_hired);
          const months = (today.getFullYear() - hired.getFullYear()) * 12 + (today.getMonth() - hired.getMonth());
          if (months >= 12) {
            supabase.from('employees').update({ classification_iii: 'Resident' }).eq('id', emp.id).then();
            return { ...emp, classification_iii: 'Resident' };
          }
        }
        return emp;
      });

      setEmployees(updatedList);
      
      setSelectedEmployee(prev => {
        if (!prev) return null;
        const updated = updatedList.find(e => e.id === prev.id);
        return updated || prev;
      });
      
      const { data: reqData, error: reqError } = await supabase
        .from('employee_update_requests')
        .select('*')
        .eq('status', 'pending');
        
      if (!reqError) {
        setPendingRequests(reqData || []);
      }

      // Fetch org_units to identify heads of office
      const { data: orgData } = await supabase
        .from('org_units')
        .select('head_id')
        .not('head_id', 'is', null);
      if (orgData) {
        setHeadEmployeeIds(new Set(orgData.map(u => u.head_id)));
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      toast.error("Failed to fetch employees");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (location.state?.openEmployeeId && employees.length > 0) {
      const emp = employees.find(e => e.id === location.state.openEmployeeId);
      if (emp) {
        setSelectedEmployee(emp);
        setModalOpen(true);
        // Clear state so it doesn't reopen on refresh
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.state, employees, navigate]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ 
      departments: [], 
      statuses: [], 
      tenures: [], 
      classifications: [], 
      classificationsII: [], 
      classificationsIII: [], 
      active: "All" 
    });
    setGlobalSearch("");
  };

  const filteredEmployees = useMemo(() => {
    let result = employees.filter((emp) => {
      const search = (globalSearch || "").toLowerCase();
      const matchesSearch = !search ||
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search) ||
        (emp.employee_id && emp.employee_id.toLowerCase().includes(search)) ||
        (emp.department && emp.department.toLowerCase().includes(search)) ||
        (emp.position && emp.position.toLowerCase().includes(search)) ||
        (emp.email && emp.email.toLowerCase().includes(search));

      const matchesDept = !filters.departments?.length || filters.departments.includes(emp.department);
      const matchesStatus = !filters.statuses?.length || filters.statuses.includes(emp.employment_status);
      const matchesTenure = !filters.tenures?.length || filters.tenures.includes(emp.employment_tenure);
      const matchesClassification = !filters.classifications?.length || filters.classifications.includes(emp.employment_classification);
      const matchesClassificationII = !filters.classificationsII?.length || filters.classificationsII.includes(emp.classification_ii);
      const matchesClassificationIII = !filters.classificationsIII?.length || filters.classificationsIII.includes(emp.classification_iii);
      const matchesActive = filters.active === "All" ||
        (filters.active === "Active" && emp.is_active) ||
        (filters.active === "Inactive" && !emp.is_active);

      return matchesSearch && matchesDept && matchesStatus && matchesTenure && matchesClassification && matchesClassificationII && matchesClassificationIII && matchesActive;
    }).map(emp => {
       const empPendingRequests = pendingRequests.filter(req => req.employee_id === emp.id);
       return { ...emp, pendingRequests: empPendingRequests };
    });

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [employees, filters, globalSearch, pendingRequests, sortConfig]);

  const handleViewE201 = (emp) => {
    setSelectedEmployee(emp);
    setModalInitialTab("profiling");
    setModalInitialEdit(false);
    setModalOpen(true);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDeleteEmployee = async (emp) => {
    try {
      const empName = `${emp.first_name || ''} ${emp.last_name || ''}`;
      const label = `${empName.trim() || 'Unknown Employee'} - Employee Record`;

      // 1. Snapshot employee to bin
      const { error: binError } = await supabase
        .from('bin')
        .insert({
          record_type: 'employee',
          record_id: emp.id,
          record_data: emp,
          label: label
        });

      if (binError) throw binError;

      // 2. Delete employee from database
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', emp.id);

      if (error) throw error;

      setEmployees(prev => prev.filter(e => e.id !== emp.id));
      toast.success(`Records for ${empName} have been moved to the Bin.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete records");
    }
  };

  const handleToggleActive = async (emp) => {
    if (emp.is_active) {
      try {
        const { error } = await supabase
          .from('employees')
          .update({ is_active: false })
          .eq('id', emp.id);

        if (error) throw error;

        setEmployees((prev) =>
          prev.map((e) => e.id === emp.id ? { ...e, is_active: false } : e)
        );
        if (selectedEmployee?.id === emp.id) {
          setSelectedEmployee((prev) => prev ? { ...prev, is_active: false } : null);
        }

        // Log to admin activity
        await supabase.from('admin_activity_log').insert({
          actor_type: 'admin',
          actor_name: 'Administrator',
          action: 'admin_toggled_employee_status',
          description: `Deactivated ${emp.first_name} ${emp.last_name}`,
          employee_id: emp.id
        });

        toast.success(`${emp.first_name} ${emp.last_name} has been deactivated.`);
      } catch (err) {
        toast.error("Failed to deactivate employee record.");
      }
    } else {
      setSelectedEmployee(emp);
      setModalInitialTab("employment");
      setModalInitialEdit(true);
      setModalOpen(true);
      toast.info(`Please update the current employment information to reactivate ${emp.first_name}.`);
    }
  };

  const handleExport = () => {
    toast.success("Exporting employee report...");
  };

  return (
    <div className="flex flex-col h-full min-h-0 p-4 md:p-6 gap-5 max-w-[1440px] mx-auto w-full">
      <div className="flex items-center gap-3 w-full flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employees, departments..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-10 w-full bg-background border-input focus-visible:ring-1 focus-visible:ring-primary"
          />
          {globalSearch && (
            <button onClick={() => setGlobalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <EmployeeFilters filters={filters} onFilterChange={handleFilterChange} onClear={clearFilters} departments={liveDepartments} />
        <div className="text-sm text-muted-foreground shrink-0 px-2 font-medium">
          {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""} found
        </div>
        <Button onClick={() => navigate("/employees/add")} className="gap-2 text-xs bg-[#0C005F] hover:bg-[#0C005F]/90 shrink-0">
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Employee</span>
        </Button>
      </div>

      <EmployeeTable
        employees={filteredEmployees}
        onViewE201={handleViewE201}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteEmployee}
        isLoading={isLoading}
        onSort={handleSort}
        sortConfig={sortConfig}
        headEmployeeIds={headEmployeeIds}
      />

      <E201Modal
        employee={selectedEmployee}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onToggleActive={handleToggleActive}
        onSave={() => fetchEmployees()}
        initialTab={modalInitialTab}
        initialEditMode={modalInitialEdit}
      />
    </div>
  );
}