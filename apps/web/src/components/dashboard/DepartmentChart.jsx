import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "Engineering", value: 4, color: "hsl(221, 83%, 53%)" },
  { name: "Finance", value: 2, color: "hsl(142, 71%, 45%)" },
  { name: "Human Resources", value: 2, color: "hsl(38, 92%, 50%)" },
  { name: "Marketing", value: 2, color: "hsl(262, 83%, 58%)" },
  { name: "Operations", value: 2, color: "hsl(0, 84%, 60%)" },
  { name: "Legal", value: 1, color: "hsl(200, 60%, 50%)" },
];

export default function DepartmentChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Department Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)", fontSize: "12px" }}
              formatter={(value, name) => [`${value} employees`, name]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}