import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Search, X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import EmployeeFilters from "@/components/employees/EmployeeFilters";
import EmployeeTable from "@/components/employees/EmployeeTable";
import E201Modal from "@/components/employees/E201Modal";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [globalSearch, setGlobalSearch] = useState("");
  const [filters, setFilters] = useState({ departments: [], statuses: [], classifications: [], active: "All" });
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'last_name', direction: 'asc' });

  const location = useLocation();
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;
      setEmployees(data || []);
      
      const { data: reqData, error: reqError } = await supabase
        .from('employee_update_requests')
        .select('*')
        .eq('status', 'pending');
        
      if (!reqError) {
        setPendingRequests(reqData || []);
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
    setFilters({ departments: [], statuses: [], classifications: [], active: "All" });
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
      const matchesClassification = !filters.classifications?.length || filters.classifications.includes(emp.employment_classification);
      const matchesActive = filters.active === "All" ||
        (filters.active === "Active" && emp.is_active) ||
        (filters.active === "Inactive" && !emp.is_active);

      return matchesSearch && matchesDept && matchesStatus && matchesClassification && matchesActive;
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
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', emp.id);

      if (error) throw error;

      setEmployees(prev => prev.filter(e => e.id !== emp.id));
      toast.success(`Records for ${emp.first_name} ${emp.last_name} have been deleted.`);
    } catch (err) {
      toast.error("Failed to delete records");
    }
  };

  const handleToggleActive = async (emp) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: !emp.is_active })
        .eq('id', emp.id);

      if (error) throw error;

      setEmployees((prev) =>
        prev.map((e) => e.id === emp.id ? { ...e, is_active: !e.is_active } : e)
      );
      if (selectedEmployee?.id === emp.id) {
        setSelectedEmployee((prev) => prev ? { ...prev, is_active: !prev.is_active } : null);
      }
      toast.success(`${emp.first_name} ${emp.last_name} has been ${emp.is_active ? "deactivated" : "reactivated"}.`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleExport = () => {
    toast.success("Exporting employee report...");
  };

  return (
    <div className="p-6 space-y-5 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees, departments..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-10 bg-background border-input focus-visible:ring-1 focus-visible:ring-primary"
            />
            {globalSearch && (
              <button onClick={() => setGlobalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <EmployeeFilters filters={filters} onFilterChange={handleFilterChange} onClear={clearFilters} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => navigate("/employees/add")} className="gap-2 text-xs bg-[#0C005F] hover:bg-[#0C005F]/90">
            <UserPlus className="w-3.5 h-3.5" />
            Add Employee
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Upload className="w-3.5 h-3.5" />
            Import Data (.csv)
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
         {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""} found
      </div>

      <EmployeeTable
        employees={filteredEmployees}
        onViewE201={handleViewE201}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteEmployee}
        isLoading={isLoading}
        onSort={handleSort}
        sortConfig={sortConfig}
      />

      <E201Modal
        employee={selectedEmployee}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onToggleActive={handleToggleActive}
        onSave={() => fetchEmployees()}
      />
    </div>
  );
}