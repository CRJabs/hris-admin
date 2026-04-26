import { Button } from "@/components/ui/button";
import { Filter, X, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { DEPARTMENTS } from "@/lib/constants";

const departments = DEPARTMENTS;
const statuses = ["Regular", "Probationary", "Contractual"];
const activeStatuses = ["Active", "Inactive"];

export default function EmployeeFilters({ filters, onFilterChange, onClear }) {
  const activeCount = 
    (filters.departments?.length || 0) + 
    (filters.statuses?.length || 0) + 
    (filters.active !== "All" ? 1 : 0);

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  return (
    <div className="flex items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 h-5 rounded-full text-[10px]">
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Department</h4>
              <div className="space-y-2">
                {departments.map((dept) => (
                  <div key={dept} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`dept-${dept}`} 
                      checked={filters.departments?.includes(dept)}
                      onCheckedChange={() => onFilterChange("departments", toggleArrayItem(filters.departments || [], dept))}
                    />
                    <label htmlFor={`dept-${dept}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {dept}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Status</h4>
              <div className="space-y-2">
                {statuses.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`status-${status}`} 
                      checked={filters.statuses?.includes(status)}
                      onCheckedChange={() => onFilterChange("statuses", toggleArrayItem(filters.statuses || [], status))}
                    />
                    <label htmlFor={`status-${status}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Active Status</h4>
              <div className="space-y-2">
                {activeStatuses.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`active-${status}`} 
                      checked={filters.active === status}
                      onCheckedChange={(checked) => onFilterChange("active", checked ? status : "All")}
                    />
                    <label htmlFor={`active-${status}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-9 text-xs gap-1.5">
          <X className="w-3 h-3" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}