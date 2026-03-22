import { Users, UserCheck, UserX, Clock } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import HeadcountChart from "@/components/dashboard/HeadcountChart";
import DepartmentChart from "@/components/dashboard/DepartmentChart";
import AttritionChart from "@/components/dashboard/AttritionChart";
import AlertsWidget from "@/components/dashboard/AlertsWidget";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 max-w-350 mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HR Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value="102" subtitle="12 departments" icon={Users} trend="+4.1% from last month" trendUp />
        <StatCard title="Regular" value="87" subtitle="85.3% of workforce" icon={UserCheck} trend="+2 this quarter" trendUp />
        <StatCard title="Probationary" value="10" subtitle="Pending regularization" icon={Clock} trend="3 due this month" />
        <StatCard title="Separated/Inactive" value="5" subtitle="YTD attrition" icon={UserX} trend="1.9% attrition rate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HeadcountChart />
        </div>
        <AlertsWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentChart />
        <AttritionChart />
      </div>
    </div>
  );
}