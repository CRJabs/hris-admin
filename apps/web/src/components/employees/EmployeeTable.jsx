import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Archive, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const statusStyles = {
  Regular: "bg-green-50 text-green-700 border-green-200",
  Probationary: "bg-amber-50 text-amber-700 border-amber-200",
  Contractual: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function EmployeeTable({ employees, onViewE201, onToggleActive }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-25">ID</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Employee</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Department</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Position</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-center w-15">Active</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-15"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
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
                <TableCell className="font-mono text-xs text-muted-foreground">{emp.employee_id}</TableCell>
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
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewE201(emp); }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View E201
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleActive(emp); }}>
                        {emp.is_active ? (
                          <><Archive className="w-4 h-4 mr-2" />Archive / Deactivate</>
                        ) : (
                          <><UserCheck className="w-4 h-4 mr-2" />Reactivate</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}