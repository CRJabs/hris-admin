import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Users } from "lucide-react";
import mockEmployees from "@/lib/mockEmployees";
import EmployeeFilters from "@/components/employees/EmployeeFilters";
import EmployeeTable from "@/components/employees/EmployeeTable";
import E201Modal from "@/components/employees/E201Modal";
import { toast } from "sonner";

export default function Employees() {
  const { globalSearch } = useOutletContext();
  const [employees, setEmployees] = useState(mockEmployees);
  const [filters, setFilters] = useState({ department: "All", status: "All", active: "All" });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ department: "All", status: "All", active: "All" });
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const search = (globalSearch || "").toLowerCase();
      const matchesSearch = !search ||
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search) ||
        emp.employee_id.toLowerCase().includes(search) ||
        emp.department.toLowerCase().includes(search) ||
        emp.position.toLowerCase().includes(search) ||
        emp.email.toLowerCase().includes(search);

      const matchesDept = filters.department === "All" || emp.department === filters.department;
      const matchesStatus = filters.status === "All" || emp.employment_status === filters.status;
      const matchesActive = filters.active === "All" ||
        (filters.active === "Active" && emp.is_active) ||
        (filters.active === "Inactive" && !emp.is_active);

      return matchesSearch && matchesDept && matchesStatus && matchesActive;
    });
  }, [employees, filters, globalSearch]);

  const handleViewE201 = (emp) => {
    setSelectedEmployee(emp);
    setModalOpen(true);
  };

  const handleToggleActive = (emp) => {
    setEmployees((prev) =>
      prev.map((e) => e.employee_id === emp.employee_id ? { ...e, is_active: !e.is_active } : e)
    );
    if (selectedEmployee?.employee_id === emp.employee_id) {
      setSelectedEmployee((prev) => prev ? { ...prev, is_active: !prev.is_active } : null);
    }
    toast.success(`${emp.first_name} ${emp.last_name} has been ${emp.is_active ? "deactivated" : "reactivated"}.`);
  };

  const handleExport = () => {
    toast.success("Exporting employee report...");
  };

  return (
    <div className="p-6 space-y-5 max-w-350 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Employee Masterlist
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm" className="gap-2 text-xs">
          <Download className="w-3.5 h-3.5" />
          Export Report
        </Button>
      </div>

      <EmployeeFilters filters={filters} onFilterChange={handleFilterChange} onClear={clearFilters} />

      <EmployeeTable
        employees={filteredEmployees}
        onViewE201={handleViewE201}
        onToggleActive={handleToggleActive}
      />

      <E201Modal
        employee={selectedEmployee}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}