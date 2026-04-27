import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, Eye, Archive, UserCheck, AlertCircle, 
  Trash2, ArrowUpDown 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const statusStyles = {
  Regular: "bg-green-50 text-green-700 border-green-200",
  Probationary: "bg-amber-50 text-amber-700 border-amber-200",
  Contractual: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function EmployeeTable({ employees, onViewE201, onToggleActive, onDelete, isLoading, onSort, sortConfig }) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const SortButton = ({ column, label }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onSort?.(column); }}
      className="flex items-center gap-1 hover:text-foreground transition-colors group"
    >
      {label}
      <ArrowUpDown className={cn(
        "w-3 h-3 transition-colors",
        sortConfig?.key === column ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground"
      )} />
    </button>
  );

  const handleDeleteClick = (e, emp) => {
    e.stopPropagation();
    setEmployeeToDelete(emp);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      onDelete?.(employeeToDelete);
    }
    setDeleteConfirmOpen(false);
    setEmployeeToDelete(null);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-25">
              <SortButton column="employee_id" label="ID" />
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">
              <SortButton column="last_name" label="Employee" />
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">
              <SortButton column="department" label="Department" />
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">
              <SortButton column="position" label="Position" />
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">
              <SortButton column="employment_status" label="Status" />
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-center w-15">Active</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-15"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-2.5 w-2.5 rounded-full mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                No employees found matching your criteria.
              </TableCell>
            </TableRow>
          ) : (
            employees.map((emp) => (
              <TableRow
                key={emp.id || emp.employee_id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onViewE201(emp)}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {emp.employee_id}
                  {emp.pendingRequests?.length > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-amber-600 font-medium" title="Pending profile updates">
                       <AlertCircle className="w-3 h-3" />
                       <span className="text-[9px] uppercase tracking-wider">Updates</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={emp.photo_url} alt={emp.first_name} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{emp.last_name}, {emp.first_name} {emp.middle_name?.[0]}.</p>
                      <p className="text-[11px] text-muted-foreground">{emp.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{emp.department}</TableCell>
                <TableCell className="text-sm">{emp.position}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[11px] ${statusStyles[emp.employment_status] || ""}`}>
                    {emp.employment_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className={`w-2.5 h-2.5 rounded-full mx-auto ${emp.is_active ? "bg-green-500" : "bg-red-400"}`} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewE201(emp); }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleActive(emp); }}>
                        {emp.is_active ? (
                          <><Archive className="w-4 h-4 mr-2" />Archive / Deactivate</>
                        ) : (
                          <><UserCheck className="w-4 h-4 mr-2" />Reactivate</>
                        )}
                      </DropdownMenuItem>
                      <div className="h-px bg-muted my-1" />
                      <DropdownMenuItem 
                        onClick={(e) => handleDeleteClick(e, emp)}
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Records
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Confirm Record Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the records of <strong>{employeeToDelete?.first_name} {employeeToDelete?.last_name}</strong>? 
              This action is permanent and will completely remove all associated employee data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.stopPropagation(); confirmDelete(); }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}