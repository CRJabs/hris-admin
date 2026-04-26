import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMemo } from "react";
import { format, subMonths } from "date-fns";

export default function HeadcountChart({ employees = [] }) {
  const data = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    
    const months = [];
    for (let i = 8; i >= 0; i--) {
      months.push(subMonths(new Date(), i));
    }
    
    return months.map(month => {
      const endOfMonthDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      let count = 0;
      employees.forEach(emp => {
        // Skip pending registrations
        if (emp.employment_status === 'Pending') return;
        
        const createdDate = new Date(emp.created_at || new Date());
        if (createdDate <= endOfMonthDate) {
           if (!emp.is_active && emp.updated_at) {
              const separatedDate = emp.separation_date ? new Date(emp.separation_date) : new Date(emp.updated_at);
              if (separatedDate <= endOfMonthDate) {
                 return; 
              }
           }
           count++;
        }
      });
      
      return {
        month: format(month, 'MMM'),
        headcount: count
      };
    });
  }, [employees]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Total Headcount Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="headcountGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)", fontSize: "12px" }}
            />
            <Area
              type="monotone"
              dataKey="headcount"
              stroke="hsl(221, 83%, 53%)"
              strokeWidth={2}
              fill="url(#headcountGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}