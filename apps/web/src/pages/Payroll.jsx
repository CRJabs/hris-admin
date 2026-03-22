import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import mockEmployees from "@/lib/mockEmployees";

function formatPHP(amount) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount || 0);
}

const activeEmployees = mockEmployees.filter(e => e.is_active);
const totalPayroll = activeEmployees.reduce((sum, e) => sum + (e.monthly_rate || 0), 0);
const avgSalary = totalPayroll / activeEmployees.length;

export default function Payroll() {
  return (
    <div className="p-6 space-y-6 max-w-350 mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          Payroll & Bonuses
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Monthly payroll overview and bonus tracking</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Monthly Payroll</p>
            <p className="text-2xl font-bold mt-1">{formatPHP(totalPayroll)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Avg. Salary</p>
            <p className="text-2xl font-bold mt-1">{formatPHP(avgSalary)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Active Employees</p>
            <p className="text-2xl font-bold mt-1">{activeEmployees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Next Payroll Date</p>
            <p className="text-2xl font-bold mt-1">Apr 15</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Employee Compensation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Employee</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Monthly Rate</TableHead>
                  <TableHead className="text-xs">Allowances</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Total Gross</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEmployees.map((emp) => {
                  const allowances = (emp.rice_allowance || 0) + (emp.transportation_allowance || 0) + (emp.clothing_allowance || 0);
                  return (
                    <TableRow key={emp.employee_id}>
                      <TableCell className="text-sm font-medium">{emp.last_name}, {emp.first_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.department}</TableCell>
                      <TableCell className="text-sm">{formatPHP(emp.monthly_rate)}</TableCell>
                      <TableCell className="text-sm">{formatPHP(allowances)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[11px] ${
                          emp.employment_status === "Regular" ? "bg-green-50 text-green-700 border-green-200" :
                          emp.employment_status === "Probationary" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>{emp.employment_status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">{formatPHP(emp.monthly_rate + allowances)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}