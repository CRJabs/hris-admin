import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.state, employees, navigate]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
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

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        if (filters.departments.length > 0 && !filters.departments.includes(emp.department)) {
          return false;
        }
        if (filters.statuses.length > 0 && !filters.statuses.includes(emp.employment_status || "Fulltime")) {
          return false;
        }
        if (filters.classifications.length > 0 && !filters.classifications.includes(emp.employment_classification)) {
          return false;
        }
        if (filters.classificationsII.length > 0 && !filters.classificationsII.includes(emp.classification_ii)) {
          return false;
        }
        if (filters.classificationsIII.length > 0 && !filters.classificationsIII.includes(emp.classification_iii)) {
          return false;
        }
        if (filters.tenures.length > 0 && !filters.tenures.includes(emp.employment_tenure || "Probationary")) {
          return false;
        }
        if (filters.active !== "All") {
          const isActive = filters.active === "Active";
          if (emp.is_active !== isActive) return false;
        }

        if (globalSearch) {
          const search = globalSearch.toLowerCase();
          const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
          const empId = (emp.employee_id || "").toLowerCase();
          const dept = (emp.department || "").toLowerCase();
          const pos = (emp.position || "").toLowerCase();
          const email = (emp.email || "").toLowerCase();

          return (
            fullName.includes(search) ||
            empId.includes(search) ||
            dept.includes(search) ||
            pos.includes(search) ||
            email.includes(search)
          );
        }

        return true;
      })
      .map(emp => {
         const empPendingRequests = pendingRequests.filter(req => req.employee_id === emp.id);
         return { ...emp, pendingRequests: empPendingRequests };
      })
      .sort((a, b) => {
        if (!sortConfig.key) return 0;
        
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';

        if (sortConfig.key === 'last_name') {
          aVal = `${a.last_name || ''} ${a.first_name || ''}`;
          bVal = `${b.last_name || ''} ${b.first_name || ''}`;
        }

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [employees, filters, globalSearch, pendingRequests, sortConfig]);

  const handleViewE201 = (emp) => {
    setSelectedEmployee(emp);
    setModalInitialTab("profiling");
    setModalInitialEdit(false);
    setModalOpen(true);
  };

  const handleDeleteEmployee = async (emp) => {
    try {
      const empName = `${emp.first_name || ''} ${emp.last_name || ''}`;
      const label = `${empName.trim() || 'Unknown Employee'} - Employee Record`;

      const { error: binError } = await supabase
        .from('bin')
        .insert({
          record_type: 'employee',
          record_id: emp.id,
          record_data: emp,
          label: label
        });

      if (binError) throw binError;

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
    <div className="p-4 w-full h-full flex flex-col gap-4">
      <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-2.5 px-4 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search employees, departments..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-9 h-9 text-xs border-slate-200 rounded-full focus-visible:ring-1 focus-visible:ring-[#0C005F]"
            />
            {globalSearch && (
              <button onClick={() => setGlobalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <EmployeeFilters filters={filters} onFilterChange={handleFilterChange} onClear={clearFilters} departments={liveDepartments} />
            <div className="text-xs font-semibold text-slate-500 shrink-0">
              {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </div>
      </Card>

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