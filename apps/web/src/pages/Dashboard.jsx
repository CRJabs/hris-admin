import { useState, useEffect } from "react";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import HeadcountChart from "@/components/dashboard/HeadcountChart";
import DepartmentChart from "@/components/dashboard/DepartmentChart";
import AttritionChart from "@/components/dashboard/AttritionChart";
import AlertsWidget from "@/components/dashboard/AlertsWidget";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    departments: 0,
    regular: 0,
    probationary: 0,
    separated: 0
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
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
    };
    fetchStats();
  }, []);

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
          <HeadcountChart employees={employees} />
        </div>
        <AlertsWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentChart employees={employees} />
        <AttritionChart employees={employees} />
      </div>
    </div>
  );
}