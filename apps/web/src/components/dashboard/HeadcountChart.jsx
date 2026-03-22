import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { month: "Jul", headcount: 82 },
  { month: "Aug", headcount: 85 },
  { month: "Sep", headcount: 88 },
  { month: "Oct", headcount: 91 },
  { month: "Nov", headcount: 89 },
  { month: "Dec", headcount: 93 },
  { month: "Jan", headcount: 96 },
  { month: "Feb", headcount: 98 },
  { month: "Mar", headcount: 102 },
];

export default function HeadcountChart() {
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