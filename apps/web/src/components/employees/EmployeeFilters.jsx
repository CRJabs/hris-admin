import { Button } from "@/components/ui/button";
import { Filter, X, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { DEPARTMENTS, EMPLOYMENT_CLASSIFICATIONS } from "@/lib/constants";

const statuses = ["Regular", "Probationary", "Contractual"];
const activeStatuses = ["Active", "Inactive"];

export default function EmployeeFilters({ filters, onFilterChange, onClear }) {
  const [searchTerm, setSearchTerm] = useState("");

  const activeCount = 
    (filters.departments?.length || 0) + 
    (filters.statuses?.length || 0) + 
    (filters.classifications?.length || 0) +
    (filters.active !== "All" ? 1 : 0);

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  const filteredDepartments = useMemo(() => 
    DEPARTMENTS.filter(d => d.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );

  const filteredClassifications = useMemo(() => 
    EMPLOYMENT_CLASSIFICATIONS.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );

  const renderFilterGrid = (items, filterKey, currentFilters) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6">
        {items.map((item) => (
          <div key={item} className="flex items-center space-x-2">
            <Checkbox 
              id={`${filterKey}-${item}`} 
              checked={currentFilters?.includes(item)}
              onCheckedChange={() => onFilterChange(filterKey, toggleArrayItem(currentFilters || [], item))}
            />
            <label htmlFor={`${filterKey}-${item}`} className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer hover:text-primary transition-colors">
              {item}
            </label>
          </div>
        ))}
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
            {/* Departments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Departments</h4>
                <Badge variant="outline" className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 border-slate-200">
                  {filteredDepartments.length} {filteredDepartments.length === 1 ? 'Dept' : 'Depts'}
                </Badge>
              </div>
              {renderFilterGrid(filteredDepartments, "departments", filters.departments)}
            </div>

            <Separator className="bg-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
               {/* Employment Classification */}
               <div className="space-y-4">
                  <h4 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Employment Classification</h4>
                  <div className="space-y-3">
                    {filteredClassifications.map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`class-${item}`} 
                          checked={filters.classifications?.includes(item)}
                          onCheckedChange={() => onFilterChange("classifications", toggleArrayItem(filters.classifications || [], item))}
                        />
                        <label htmlFor={`class-${item}`} className="text-xs font-medium leading-none cursor-pointer hover:text-primary transition-colors">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Status */}
               <div className="space-y-4">
                  <h4 className="font-bold text-[11px] uppercase text-slate-400 tracking-widest">Employment Status</h4>
                  <div className="space-y-3">
                    {statuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`status-${status}`} 
                          checked={filters.statuses?.includes(status)}
                          onCheckedChange={() => onFilterChange("statuses", toggleArrayItem(filters.statuses || [], status))}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm font-medium leading-none cursor-pointer hover:text-primary transition-colors">
                          {status}
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
                        <label htmlFor={`active-${status}`} className="text-sm font-medium leading-none cursor-pointer hover:text-primary transition-colors">
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