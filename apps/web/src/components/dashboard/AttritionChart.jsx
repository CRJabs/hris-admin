import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { month: "Oct", rate: 2.1 },
  { month: "Nov", rate: 1.8 },
  { month: "Dec", rate: 3.2 },
  { month: "Jan", rate: 2.5 },
  { month: "Feb", rate: 1.9 },
  { month: "Mar", rate: 1.2 },
];

export default function AttritionChart() {
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