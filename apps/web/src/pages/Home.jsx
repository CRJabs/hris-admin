import { useState, useEffect } from "react";
import { 
  Users, UserPlus, CheckSquare, CalendarDays, 
  ArrowRight, Bell, Zap, TrendingUp, Clock, 
  ChevronRight, Activity, ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingRegistrations: 0,
    pendingUpdates: 0,
    activeLeaves: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        // Fetch stats
        const [empRes, regRes, updRes] = await Promise.all([
          supabase.from('employees').select('id', { count: 'exact', head: true }),
          supabase.from('employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'Pending'),
          supabase.from('employee_update_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        ]);

        setStats({
          totalEmployees: empRes.count || 0,
          pendingRegistrations: regRes.count || 0,
          pendingUpdates: updRes.count || 0,
          activeLeaves: 5 // Placeholder for now
        });

        // Mock recent activities for landing page aesthetics
        setRecentActivities([
          { id: 1, type: 'registration', user: 'Maria Santos', time: '2 hours ago', status: 'Pending' },
          { id: 2, type: 'update', user: 'Juan Dela Cruz', time: '4 hours ago', status: 'Approved' },
          { id: 3, type: 'leave', user: 'Ana Reyes', time: 'Yesterday', status: 'Applied' },
          { id: 4, type: 'system', user: 'System Update', time: '2 days ago', status: 'Completed' }
        ]);

      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const quickActions = [
    { label: "Add Employee", icon: UserPlus, path: "/employees/add", color: "bg-blue-500" },
    { label: "Review Approvals", icon: CheckSquare, path: "/approvals", color: "bg-amber-500" },
    { label: "Assign Credits", icon: CalendarDays, path: "/leaves/assign", color: "bg-purple-500" },
    { label: "System Reports", icon: TrendingUp, path: "/reports", color: "bg-emerald-500" }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C005F] to-[#1a0b8c] p-8 md:p-12 text-white shadow-2xl shadow-[#0C005F]/20">
        <div className="relative z-10 space-y-6 max-w-2xl">
          <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-4 py-1 text-xs font-bold uppercase tracking-widest">
            Administrator Portal
          </Badge>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">{user?.first_name || "Admin"}</span>!
            </h1>
            <p className="text-blue-100/70 text-lg md:text-xl font-medium">
              You have <span className="text-white font-bold">{stats.pendingRegistrations + stats.pendingUpdates} pending tasks</span> that require your immediate attention.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button asChild className="bg-white text-[#0C005F] hover:bg-blue-50 font-bold px-8 h-12 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95">
              <Link to="/approvals">
                Go to Approvals <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white font-bold px-8 h-12 rounded-xl backdrop-blur-md transition-all">
              View Insights
            </Button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -ml-20 -mb-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px]" />
        <ShieldCheck className="absolute bottom-10 right-10 w-64 h-64 text-white/5 -rotate-12" />
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick Actions & Stats */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 px-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.path} className="group">
                  <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5 transition-transform group-hover:scale-110", action.color)}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-600 group-hover:text-[#0C005F] transition-colors">{action.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-white overflow-hidden group">
              <CardContent className="p-8 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Workforce</p>
                  <p className="text-3xl font-black text-slate-900">{stats.totalEmployees}</p>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                    <Activity className="w-3.5 h-3.5" />
                    +2.5% vs last month
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white overflow-hidden group">
              <CardContent className="p-8 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Tasks</p>
                  <p className="text-3xl font-black text-slate-900">{stats.pendingRegistrations + stats.pendingUpdates}</p>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    Requiring review
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bell className="w-8 h-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Preview / Charts Link */}
          <Card className="border-none shadow-xl bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-50" />
            <CardContent className="p-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#0C005F]">Workforce Analytics</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  View detailed reports on headcount, attrition, and department distribution in the analytics dashboard.
                </p>
              </div>
              <Button asChild variant="secondary" className="bg-[#0C005F] text-white hover:bg-[#0C005F]/90 font-bold rounded-xl px-6">
                <Link to="/dashboard">
                  Open Dashboard <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 px-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="group relative flex items-start gap-4 p-4 rounded-2xl bg-white border border-transparent hover:border-slate-100 hover:shadow-lg transition-all duration-300">
                <div className={cn(
                  "mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  activity.type === 'registration' ? "bg-blue-50 text-blue-600" :
                  activity.type === 'update' ? "bg-amber-50 text-amber-600" :
                  activity.type === 'leave' ? "bg-purple-50 text-purple-600" :
                  "bg-slate-50 text-slate-600"
                )}>
                  {activity.type === 'registration' ? <UserPlus className="w-5 h-5" /> :
                   activity.type === 'update' ? <CheckSquare className="w-5 h-5" /> :
                   activity.type === 'leave' ? <CalendarDays className="w-5 h-5" /> :
                   <Zap className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{activity.user}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activity.type === 'registration' ? 'Submitted a registration' :
                     activity.type === 'update' ? 'Requested profile update' :
                     activity.type === 'leave' ? 'Applied for leave' :
                     'System operation performed'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-medium text-slate-400">{activity.time}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-tighter",
                      activity.status === 'Approved' ? "text-emerald-500" :
                      activity.status === 'Pending' ? "text-amber-500" :
                      "text-blue-500"
                    )}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-slate-400 hover:text-[#0C005F] text-xs font-bold uppercase tracking-widest h-12">
              View All Activity
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
