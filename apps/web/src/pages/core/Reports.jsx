import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, TrendingUp, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
    </div>
  );
}