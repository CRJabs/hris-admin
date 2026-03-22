import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Gift } from "lucide-react";

function formatPHP(amount) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount || 0);
}

export default function CompensationTab({ employee }) {
  const bonusTypes = ["Summer Pay", "3 Years Bonus", "Mid-Year Bonus", "13th Month Pay", "Birthday Bonus"];
  const bonusMap = {};
  (employee.bonuses || []).forEach(b => { bonusMap[b.type] = b; });

  return (
    <div className="space-y-6">
      {/* Current Compensation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Monthly Rate</p>
                <p className="text-xl font-bold text-primary">{formatPHP(employee.monthly_rate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Daily Rate</p>
            <p className="text-xl font-bold">{formatPHP(employee.daily_rate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Allowances</p>
            <p className="text-xl font-bold">
              {formatPHP((employee.rice_allowance || 0) + (employee.transportation_allowance || 0) + (employee.clothing_allowance || 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Allowances Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Allowances
            {employee.employment_status === "Probationary" && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Probationary Rates</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-[11px] text-muted-foreground">Rice Allowance</p>
              <p className="text-sm font-semibold mt-1">{formatPHP(employee.rice_allowance)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-[11px] text-muted-foreground">Transportation</p>
              <p className="text-sm font-semibold mt-1">{formatPHP(employee.transportation_allowance)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-[11px] text-muted-foreground">Clothing</p>
              <p className="text-sm font-semibold mt-1">{formatPHP(employee.clothing_allowance || 0)}</p>
              {employee.employment_status === "Probationary" && (
                <p className="text-[10px] text-amber-600 mt-0.5">Not eligible (Probationary)</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Salary Increments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(employee.salary_history || []).slice().reverse().map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{s.date}</TableCell>
                  <TableCell className="text-sm font-medium">{formatPHP(s.amount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bonus Tracker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Bonus Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Bonus Type</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonusTypes.map((type) => {
                const bonus = bonusMap[type];
                const statusBadge = {
                  Paid: "bg-green-50 text-green-700 border-green-200",
                  Pending: "bg-amber-50 text-amber-700 border-amber-200",
                  Upcoming: "bg-blue-50 text-blue-700 border-blue-200",
                  Prorated: "bg-purple-50 text-purple-700 border-purple-200",
                };
                return (
                  <TableRow key={type}>
                    <TableCell className="text-sm font-medium">{type}</TableCell>
                    <TableCell className="text-sm">{bonus ? formatPHP(bonus.amount) : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{bonus?.date || "—"}</TableCell>
                    <TableCell>
                      {bonus ? (
                        <Badge variant="outline" className={`text-[11px] ${statusBadge[bonus.status] || ""}`}>
                          {bonus.status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not eligible</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}