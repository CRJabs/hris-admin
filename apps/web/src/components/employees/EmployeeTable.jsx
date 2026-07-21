import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, Eye, Archive, UserCheck, AlertCircle, 
  Trash2, ArrowUpDown, Crown, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

const statusStyles = {
  Regular: "bg-green-50 text-green-700 border-green-200",
  Probationary: "bg-amber-50 text-amber-700 border-amber-200",
  Contractual: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function EmployeeTable({ employees, onViewE201, onToggleActive, onDelete, isLoading, onSort, sortConfig, headEmployeeIds = new Set() }) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const ROWS_PER_PAGE = 25;
  const totalPages = Math.max(1, Math.ceil(employees.length / ROWS_PER_PAGE));

  useEffect(() => {
    setPage(1);
    setPageInput('1');
  }, [employees.length]);

  const paginated = employees.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const goTo = (p) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setPage(clamped);
    setPageInput(String(clamped));
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(pageInput, 10);
      if (!isNaN(parsed)) goTo(parsed);
    }
  };

  const SortButton = ({ column, label }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onSort?.(column); }}
      className="flex items-center gap-1 hover:text-white/80 transition-colors group"
    >
      {label}
      <ArrowUpDown className={cn(
        "w-3 h-3 transition-colors",
        sortConfig?.key === column ? "text-white" : "text-white/50 group-hover:text-white/70"
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
    <div className="flex flex-col min-h-0 flex-1 rounded-xl border border-slate-200 bg-white shadow-none overflow-hidden">
      <div className="overflow-auto flex-1">
      <table className="w-full caption-bottom text-xs min-w-[700px]">
        <TableHeader className="sticky top-0 z-10 shadow-none bg-[#0C005F]">
          <TableRow className="bg-[#0C005F] hover:bg-[#0C005F]">
            <TableHead className="text-2xs font-bold uppercase tracking-wider w-25 border-x border-[#0a0050] text-white py-2.5">
              <SortButton column="employee_id" label="ID" />
            </TableHead>
            <TableHead className="text-2xs font-bold uppercase tracking-wider border-x border-[#0a0050] text-white py-2.5">
              <SortButton column="last_name" label="EMPLOYEE NAME" />
            </TableHead>
            <TableHead className="text-2xs font-bold uppercase tracking-wider border-x border-[#0a0050] text-white py-2.5">
              <SortButton column="department" label="DEPARTMENT/OFFICE" />
            </TableHead>
            <TableHead className="text-2xs font-bold uppercase tracking-wider hidden sm:table-cell border-x border-[#0a0050] text-white py-2.5">
              <SortButton column="position" label="POSITION" />
            </TableHead>
            <TableHead className="text-2xs font-bold uppercase tracking-wider border-x border-[#0a0050] text-white py-2.5">
              <SortButton column="employment_status" label="STATUS" />
            </TableHead>
            <TableHead className="text-2xs font-bold uppercase tracking-wider hidden sm:table-cell border-x border-[#0a0050] text-white py-2.5">
              <SortButton column="employment_tenure" label="TENURE" />
            </TableHead>
            <TableHead className="text-2xs font-bold uppercase tracking-wider text-center w-15 border-x border-[#0a0050] text-white py-2.5">ACTIVE</TableHead>
            <TableHead className="text-2xs font-bold uppercase tracking-wider w-15 border-x border-[#0a0050] text-white py-2.5"></TableHead>
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
              <TableCell colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                No employees found matching your criteria.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((emp) => (
              <TableRow
                key={emp.id || emp.employee_id}
                className="cursor-pointer hover:bg-slate-50/70 transition-colors border-b border-slate-100"
                onClick={() => onViewE201(emp)}
              >
                <TableCell className="font-mono text-xs text-slate-500 font-medium">
                  {emp.employee_id}
                  {emp.pendingRequests?.length > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-amber-600 font-medium" title="Pending profile updates">
                       <AlertCircle className="w-3 h-3" />
                       <span className="text-2xs uppercase tracking-wider">Updates</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 border border-slate-200">
                      <AvatarImage key={emp.photo_url} src={emp.photo_url} alt={emp.first_name} />
                      <AvatarFallback className="text-xs bg-slate-100 text-[#0C005F] font-bold">
                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">{emp.last_name}, {emp.first_name} {emp.middle_name?.[0]}.</p>
                        {headEmployeeIds.has(emp.id) && (
                          <Badge className="h-4 text-2xs px-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 gap-1 font-bold uppercase tracking-wider">
                            <Crown className="w-2.5 h-2.5" /> Head
                          </Badge>
                        )}
                        {emp.classification_iii?.toLowerCase() === 'resigned' && (
                          <Badge className="h-4 text-2xs px-1.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold uppercase tracking-wider">
                            Resigned
                          </Badge>
                        )}
                        {emp.classification_iii?.toLowerCase() === 'retired' && (
                          <Badge className="h-4 text-2xs px-1.5 bg-purple-50 text-purple-700 border border-purple-200 font-bold uppercase tracking-wider">
                            Retired
                          </Badge>
                        )}
                        {(!emp.date_hired || !emp.department || !emp.position || !emp.employment_classification || !emp.classification_ii) && (
                          <Badge className="h-4 text-2xs px-1.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold uppercase tracking-wider">
                            Incomplete Info
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{emp.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-700 font-medium">{emp.department}</TableCell>
                <TableCell className="text-xs text-slate-700 font-medium hidden sm:table-cell">{emp.position}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-2xs font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border-slate-200">
                    {emp.employment_status || "Fulltime"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className={`text-2xs font-bold uppercase tracking-wider ${statusStyles[emp.employment_tenure] || ""}`}>
                    {emp.employment_tenure || "Probationary"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className={`w-2.5 h-2.5 rounded-full mx-auto ${emp.is_active ? "bg-emerald-500" : "bg-rose-400"}`} />
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
      </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/80 rounded-b-xl mt-auto gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Showing{' '}
          <span className="font-semibold text-foreground">
            {((page - 1) * ROWS_PER_PAGE) + (employees.length > 0 ? 1 : 0)}–{Math.min(page * ROWS_PER_PAGE, employees.length)}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-foreground">{employees.length}</span>{' '}
          {employees.length !== 1 ? 'entries' : 'entry'}
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Page</span>
            <Input
              className="h-7 w-12 text-center text-xs px-1"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handlePageInputKeyDown}
              onBlur={() => {
                const parsed = parseInt(pageInput, 10);
                if (!isNaN(parsed)) goTo(parsed);
                else setPageInput(String(page));
              }}
            />
            <span>of {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

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