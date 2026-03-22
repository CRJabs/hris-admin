import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

const departments = ["All", "Engineering", "Finance", "Human Resources", "Marketing", "Operations", "Legal"];
const statuses = ["All", "Regular", "Probationary", "Contractual"];
const activeStatuses = ["All", "Active", "Inactive"];

export default function EmployeeFilters({ filters, onFilterChange, onClear }) {
  const hasFilters = filters.department !== "All" || filters.status !== "All" || filters.active !== "All";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span className="font-medium">Filters:</span>
      </div>

      <Select value={filters.department} onValueChange={(v) => onFilterChange("department", v)}>
        <SelectTrigger className="w-40 h-9 text-xs">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          {departments.map((d) => (
            <SelectItem key={d} value={d}>{d === "All" ? "All Departments" : d}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(v) => onFilterChange("status", v)}>
        <SelectTrigger className="w-40 h-9 text-xs">
          <SelectValue placeholder="Employment Status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>{s === "All" ? "All Statuses" : s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.active} onValueChange={(v) => onFilterChange("active", v)}>
        <SelectTrigger className="w-35 h-9 text-xs">
          <SelectValue placeholder="Active Status" />
        </SelectTrigger>
        <SelectContent>
          {activeStatuses.map((s) => (
            <SelectItem key={s} value={s}>{s === "All" ? "All Records" : s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-9 text-xs gap-1.5">
          <X className="w-3 h-3" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}