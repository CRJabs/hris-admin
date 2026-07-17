import { Button } from "@/components/ui/button";
import { Filter, X, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useOrgDepartments } from "@/hooks/useOrgDepartments";

const CLASSIFICATION_I_OPTIONS = ["Teaching", "Non-Teaching"];
const CLASSIFICATION_II_OPTIONS = ["Executive", "Academic Official", "Administrative Official", "Consultant"];
const CLASSIFICATION_III_OPTIONS = ["New", "Resident", "Resigned", "Retired", "Rehired"];

const tenures = ["Regular", "Probationary", "Contractual"];
const employmentStatuses = ["Fulltime", "Parttime"];
const activeStatuses = ["Active", "Inactive"];

export default function EmployeeFilters({ filters, onFilterChange, onClear, departments: departmentsProp }) {
  const [searchTerm, setSearchTerm] = useState("");
  const { executiveOffices, academicDepts, nonAcademicDepts, departments: liveDepts } = useOrgDepartments();

  const allDepts = departmentsProp && departmentsProp.length > 0 ? departmentsProp : liveDepts;

  const activeCount = 
    (filters.departments?.length || 0) + 
    (filters.statuses?.length || 0) + 
    (filters.classifications?.length || 0) +
    (filters.classificationsII?.length || 0) +
    (filters.classificationsIII?.length || 0) +
    (filters.tenures?.length || 0) +
    (filters.active !== "All" ? 1 : 0);

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  const filterListBySearch = (list) => {
    return list.filter(item => {
      const name = typeof item === 'string' ? item : item.name;
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const renderFilterGrid = (items, filterKey, currentFilters) => {
    const filtered = filterListBySearch(items);
    if (filtered.length === 0) return <p className="text-xs text-slate-400 italic">No matching items</p>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6">
        {filtered.map((item) => {
          const label = typeof item === 'string' ? item : item.name;
          return (
            <div key={label} className="flex items-center space-x-2">
              <Checkbox 
                id={`${filterKey}-${label}`} 
                checked={currentFilters?.includes(label)}
                onCheckedChange={() => onFilterChange(filterKey, toggleArrayItem(currentFilters || [], label))}
              />
              <label htmlFor={`${filterKey}-${label}`} className="text-xs font-medium leading-none cursor-pointer hover:text-primary transition-colors">
                {label}
              </label>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 shadow-sm border-slate-200">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700">Filters</span>
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 h-5 rounded-full text-[10px] bg-primary text-primary-foreground">
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[85vw] md:w-[900px] p-0 shadow-2xl border-slate-200" align="start">
          <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
             <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search filters..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 bg-white border-slate-200 focus:ring-primary"
                  />
                </div>
             </div>
             <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-slate-500 hover:text-primary gap-1.5">
                <X className="w-3.5 h-3.5" />
                Reset All
             </Button>
          </div>

          <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Departments Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-xs uppercase text-slate-800 tracking-wider">Departments / Offices</h4>
                <Badge variant="outline" className="text-[9px] font-bold text-slate-500 uppercase bg-slate-50 border-slate-200">
                  {filters.departments?.length || 0} Selected
                </Badge>
              </div>

              {/* Executive Offices */}
              {executiveOffices.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Executive Offices</h5>
                  {renderFilterGrid(executiveOffices, "departments", filters.departments)}
                </div>
              )}

              {/* Institutional Departments */}
              {academicDepts.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Institutional Departments</h5>
                  {renderFilterGrid(academicDepts, "departments", filters.departments)}
                </div>
              )}

              {/* Non-Institutional Departments */}
              {nonAcademicDepts.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Non-Institutional Departments</h5>
                  {renderFilterGrid(nonAcademicDepts, "departments", filters.departments)}
                </div>
              )}

              {/* Fallback all depts grid if hook data is loading */}
              {executiveOffices.length === 0 && academicDepts.length === 0 && nonAcademicDepts.length === 0 && (
                <div className="space-y-3">
                  <h5 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">All Departments</h5>
                  {renderFilterGrid(allDepts, "departments", filters.departments)}
                </div>
              )}
            </div>

            <Separator className="bg-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Classification I */}
               <div className="space-y-4">
                  <h4 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Classification I</h4>
                  <div className="space-y-3">
                    {filterListBySearch(CLASSIFICATION_I_OPTIONS).map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`classI-${item}`} 
                          checked={filters.classifications?.includes(item)}
                          onCheckedChange={() => onFilterChange("classifications", toggleArrayItem(filters.classifications || [], item))}
                        />
                        <label htmlFor={`classI-${item}`} className="text-xs font-medium leading-none cursor-pointer hover:text-primary transition-colors">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Classification II */}
               <div className="space-y-4">
                  <h4 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Classification II</h4>
                  <div className="space-y-3">
                    {filterListBySearch(CLASSIFICATION_II_OPTIONS).map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`classII-${item}`} 
                          checked={filters.classificationsII?.includes(item)}
                          onCheckedChange={() => onFilterChange("classificationsII", toggleArrayItem(filters.classificationsII || [], item))}
                        />
                        <label htmlFor={`classII-${item}`} className="text-xs font-medium leading-none cursor-pointer hover:text-primary transition-colors">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Classification III */}
               <div className="space-y-4">
                  <h4 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Classification III</h4>
                  <div className="space-y-3">
                    {filterListBySearch(CLASSIFICATION_III_OPTIONS).map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`classIII-${item}`} 
                          checked={filters.classificationsIII?.includes(item)}
                          onCheckedChange={() => onFilterChange("classificationsIII", toggleArrayItem(filters.classificationsIII || [], item))}
                        />
                        <label htmlFor={`classIII-${item}`} className="text-xs font-medium leading-none cursor-pointer hover:text-primary transition-colors">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Employment Status */}
               <div className="space-y-4">
                  <h4 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Employment Status</h4>
                  <div className="space-y-3">
                    {employmentStatuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`estatus-${status}`} 
                          checked={filters.statuses?.includes(status)}
                          onCheckedChange={() => onFilterChange("statuses", toggleArrayItem(filters.statuses || [], status))}
                        />
                        <label htmlFor={`estatus-${status}`} className="text-xs font-medium leading-none cursor-pointer hover:text-primary transition-colors">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Tenure */}
               <div className="space-y-4">
                  <h4 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Employment Tenure</h4>
                  <div className="space-y-3">
                    {tenures.map((tenure) => (
                      <div key={tenure} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`tenure-${tenure}`} 
                          checked={filters.tenures?.includes(tenure)}
                          onCheckedChange={() => onFilterChange("tenures", toggleArrayItem(filters.tenures || [], tenure))}
                        />
                        <label htmlFor={`tenure-${tenure}`} className="text-xs font-medium leading-none cursor-pointer hover:text-primary transition-colors">
                          {tenure}
                        </label>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Active Status */}
               <div className="space-y-4">
                  <h4 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Account Status</h4>
                  <div className="space-y-3">
                    {activeStatuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`active-${status}`} 
                          checked={filters.active === status}
                          onCheckedChange={(checked) => onFilterChange("active", checked ? status : "All")}
                        />
                        <label htmlFor={`active-${status}`} className="text-xs font-medium leading-none cursor-pointer hover:text-primary transition-colors">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-9 text-xs text-slate-500 hover:text-primary gap-1.5 transition-colors">
          <X className="w-3.5 h-3.5" />
          Clear Active
        </Button>
      )}
    </div>
  );
}