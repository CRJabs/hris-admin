import { useState, useEffect } from "react";
import { 
  Users, UserPlus, CheckSquare, CalendarDays, 
  ArrowRight, Bell, Zap, TrendingUp, Clock, 
  ChevronRight, Activity, ShieldCheck, RefreshCw, List,
  UserX, CheckCircle2, Plane, Stethoscope, Sun
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      // Fetch alerts/activities (Transferred logic from AlertsWidget)
      const { data: updateData } = await supabase
        .from('employee_update_requests')
        .select(`*, employees ( first_name, last_name )`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const { data: regData } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'Pending')
        .order('created_at', { ascending: false });

      let combined = [];
      if (updateData) {
        combined = [...combined, ...updateData.map(req => ({
          id: `req_${req.id}`,
          type: 'update',
          user: `${req.employees?.first_name} ${req.employees?.last_name}`,
          description: 'Requested profile update',
          time: new Date(req.created_at),
          status: 'ACTION REQUIRED',
          color: 'text-amber-500'
        }))];
      }

      if (regData) {
        combined = [...combined, ...regData.map(emp => ({
          id: `reg_${emp.id}`,
          type: 'registration',
          user: `${emp.first_name} ${emp.last_name}`,
          description: 'Submitted a registration',
          time: new Date(emp.created_at),
          status: 'PENDING',
          color: 'text-blue-500'
        }))];
      }

      combined.sort((a, b) => b.time - a.time);
      setRecentActivities(combined);

    } catch (err) {
      console.error("Error fetching home data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();

    // Realtime subscriptions
    const reqSub = supabase.channel('home_requests_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_update_requests' }, fetchHomeData)
      .subscribe();

    const empSub = supabase.channel('home_employees_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchHomeData)
      .subscribe();

    return () => {
      reqSub.unsubscribe();
      empSub.unsubscribe();
    };
  }, []);

  const quickActions = [
    { label: "View Employees", icon: Users, path: "/employees", color: "bg-blue-500" },
    { label: "Review Approvals", icon: CheckSquare, path: "/approvals", color: "bg-amber-500" },
    { label: "Manage Leaves", icon: CalendarDays, path: "/leaves/applications", color: "bg-purple-500" },
    { label: "System Reports", icon: TrendingUp, path: "/reports", color: "bg-emerald-500" }
  ];

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Top Section: Hero/Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Hero & Quick Actions */}
        <div className="lg:col-span-2 space-y-8 flex flex-col">
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C005F] to-[#1a0b8c] p-8 md:p-12 text-white shadow-2xl shadow-[#0C005F]/20 flex-1 min-h-[400px] flex flex-col justify-center">
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
              {/* Buttons removed as requested */}
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-1/2 -ml-20 -mb-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px]" />
            <ShieldCheck className="absolute bottom-10 right-10 w-64 h-64 text-white/5 -rotate-12" />
          </section>

          <div className="space-y-4">
            {/* Heading removed as requested */}
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
        </div>

        {/* Right Column: Recent Activity & General Analytics */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="activity" className="h-[550px] flex flex-col">
            <Card className="border-none shadow-sm bg-white overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-center shrink-0">
                <TabsList className="bg-slate-100/50 p-1 h-9">
                  <TabsTrigger 
                    value="activity" 
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                  >
                    Recent Activity
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                  >
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="activity" className="flex-1 m-0 flex flex-col overflow-hidden outline-none">
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  <div className="divide-y divide-slate-50">
                    {recentActivities.length === 0 ? (
                      <div className="p-12 text-center">
                        <p className="text-slate-400 text-sm font-medium">No recent activities found.</p>
                      </div>
                    ) : (
                      recentActivities.map((activity) => (
                        <div key={activity.id} className="group flex items-start gap-4 p-6 hover:bg-slate-50/50 transition-colors">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                            activity.type === 'registration' ? "bg-blue-50 text-blue-600" :
                            activity.type === 'update' ? "bg-amber-50 text-amber-600" :
                            "bg-slate-50 text-slate-600"
                          )}>
                            {activity.type === 'registration' ? <UserPlus className="w-5 h-5" /> :
                             activity.type === 'update' ? <RefreshCw className="w-5 h-5" /> :
                             <Zap className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-slate-800 truncate">{activity.user}</p>
                              <span className={cn("text-[10px] font-black uppercase tracking-wider shrink-0", activity.color)}>
                                {activity.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-2">
                              {formatDistanceToNow(activity.time, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                {recentActivities.length > 0 && (
                  <div className="p-4 border-t border-slate-50">
                    <Button asChild variant="ghost" className="w-full text-slate-400 hover:text-[#0C005F] text-xs font-bold uppercase tracking-widest h-10">
                      <Link to="/approvals">View All Requests</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="flex-1 m-0 outline-none flex flex-col overflow-hidden">
                {/* Top Highlight Section - Sticky */}
                <div className="w-full bg-[#0C005F] p-6 flex items-center justify-between text-white shrink-0 z-10">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total Employees</span>
                    <p className="text-xs font-medium text-blue-200/60 tracking-wide italic">Active workforce count</p>
                  </div>
                  <span className="text-4xl font-black">{stats.totalEmployees}</span>
                </div>

                {/* Vertical Stats Stack - Scrollable */}
                <div className="divide-y divide-slate-50 overflow-y-auto flex-1">
                  {[
                    { label: "Active Today", value: 0, icon: CheckCircle2 },
                    { label: "Absentees", value: "to be added", icon: UserX },
                    { label: "On Vacation", value: 0, icon: Plane },
                    { label: "Day Off", value: 0, icon: Sun },
                    { label: "Sick Leave", value: 0, icon: Stethoscope }
                  ].map((stat, i) => (
                    <div key={i} className="p-5 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-white border border-slate-50">
                          <stat.icon className="w-5 h-5 text-[#0C005F]" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                          <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Card>
          </Tabs>
        </div>
      </div>

      {/* Bottom Section: Pending Requests Table */}
      <div className="space-y-4">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#0C005F]" />
              Pending requests
            </h2>
            <Button asChild variant="outline" size="sm" className="border-[#0C005F]/20 text-[#0C005F] font-black uppercase tracking-widest text-[10px] px-4 hover:bg-[#0C005F] hover:text-white transition-all shadow-sm">
              <Link to="/approvals">View all requests</Link>
            </Button>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Position</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentActivities.slice(0, 5).map((request) => (
                    <tr key={request.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {request.user.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{request.user}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Employee ID: CC-{request.id.split('_')[1].slice(0, 4)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-600">
                          {request.type === 'registration' ? 'New Applicant' : 'Regular Employee'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className={cn(
                          "text-[10px] font-black uppercase px-2 py-0.5",
                          request.type === 'registration' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {request.type === 'registration' ? 'Registration' : 'Profile Update'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[10px] font-bold border-amber-200 text-amber-600 bg-amber-50/30">
                          PENDING
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {request.time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 max-w-[200px] truncate">
                          {request.description}
                        </p>
                      </td>
                    </tr>
                  ))}
                  {recentActivities.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <p className="text-slate-400 text-sm font-medium">No pending requests at the moment.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
