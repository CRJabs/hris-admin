import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Download, TrendingUp, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import mockEmployees from "@/lib/mockEmployees";
import { toast } from "sonner";

const deptData = Object.entries(
  mockEmployees.reduce((acc, e) => {
    acc[e.department] = (acc[e.department] || 0) + 1;
    return acc;
  }, {})
).map(([name, count]) => ({ name, count }));

const tenureData = [
  { range: "<1 yr", count: 3 },
  { range: "1-3 yrs", count: 4 },
  { range: "3-5 yrs", count: 2 },
  { range: "5-8 yrs", count: 2 },
  { range: "8+ yrs", count: 1 },
];

const reportCards = [
  { title: "Headcount Report", desc: "Employee count by department, status, and location", icon: Users },
  { title: "Compensation Report", desc: "Salary distribution, allowances, and payroll costs", icon: DollarSign },
  { title: "Attrition Report", desc: "Turnover rates, exit reasons, and retention analysis", icon: TrendingUp },
  { title: "Compliance Report", desc: "License expirations, training gaps, and audit readiness", icon: FileText },
];

export default function Reports() {
  return (
    <div className="p-6 space-y-6 max-w-350 mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((r) => (
          <Card key={r.title} className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <r.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">{r.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 gap-1.5 text-xs p-0 h-auto text-primary"
                onClick={() => toast.success(`Generating ${r.title}...`)}
              >
                <Download className="w-3 h-3" />
                Export
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Headcount by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} stroke="hsl(215, 16%, 47%)" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)", fontSize: "12px" }} />
                <Bar dataKey="count" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tenure Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tenureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)", fontSize: "12px" }} />
                <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}