import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMemo } from "react";
import { format, subMonths, isSameMonth } from "date-fns";

export default function AttritionChart({ employees = [] }) {
  const data = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(subMonths(new Date(), i));
    }
    
    return months.map(month => {
      const endOfMonthDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      let headcount = 0;
      let separations = 0;
      
      employees.forEach(emp => {
        if (emp.employment_status === 'Pending') return;
        
        const createdDate = new Date(emp.created_at || new Date());
        
        if (createdDate <= endOfMonthDate) {
           let separatedThisMonth = false;
           if (!emp.is_active && emp.updated_at) {
              const separatedDate = emp.separation_date ? new Date(emp.separation_date) : new Date(emp.updated_at);
              if (separatedDate <= endOfMonthDate) {
                 if (isSameMonth(separatedDate, month)) {
                    separatedThisMonth = true;
                    separations++;
                 } else {
                    return; 
                 }
              }
           }
           
           if (!separatedThisMonth) {
              headcount++;
           }
        }
      });
      
      const rate = headcount > 0 ? (separations / (headcount + separations)) * 100 : 0;
      
      return {
        month: format(month, 'MMM'),
        rate: Number(rate.toFixed(1))
      };
    });
  }, [employees]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Monthly Attrition Rate (%)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" unit="%" />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)", fontSize: "12px" }}
              formatter={(value) => [`${value}%`, "Attrition Rate"]}
            />
            <Bar dataKey="rate" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}