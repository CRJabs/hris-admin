import { useState, useEffect, lazy, Suspense } from "react";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { ChartSkeleton } from "@/components/dashboard/ChartSkeleton";
const HeadcountChart = lazy(() => import("@/components/dashboard/HeadcountChart"));
const DepartmentChart = lazy(() => import("@/components/dashboard/DepartmentChart"));
const AttritionChart = lazy(() => import("@/components/dashboard/AttritionChart"));
const AlertsWidget = lazy(() => import("@/components/dashboard/AlertsWidget"));
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    departments: 0,
    regular: 0,
    probationary: 0,
    separated: 0
  });
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('employees').select('*');
      if (!error && data) {
        setEmployees(data);
        const total = data.length;
        const uniqueDepts = new Set(data.map(e => e.department).filter(Boolean)).size;
        const regular = data.filter(e => e.employment_status === 'Regular').length;
        const probationary = data.filter(e => e.employment_status === 'Probationary').length;
        const separated = data.filter(e => !e.is_active && e.employment_status !== 'Pending').length;
        
        setStats({ total, departments: uniqueDepts, regular, probationary, separated });
      }
      setIsLoading(false);
    };
    fetchStats();
  }, []);

  if (isLoading && !employees.length) {
    return (
      <div className="p-6 space-y-6 max-w-350 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-350 mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={stats.total} subtitle={`${stats.departments} departments`} icon={Users} trendUp />
        <StatCard title="Regular" value={stats.regular} subtitle={`${((stats.regular/stats.total)*100 || 0).toFixed(1)}% of workforce`} icon={UserCheck} trendUp />
        <StatCard title="Probationary" value={stats.probationary} subtitle="Pending regularization" icon={Clock} />
        <StatCard title="Separated/Inactive" value={stats.separated} subtitle="Inactive employees" icon={UserX} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <HeadcountChart employees={employees} />
          </Suspense>
        </div>
        <Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
          <AlertsWidget />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <DepartmentChart employees={employees} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <AttritionChart employees={employees} />
        </Suspense>
      </div>
    </div>
  );
}