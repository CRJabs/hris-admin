import { useState, useEffect } from "react";
import {
  Users, UserPlus, CheckSquare, CalendarDays,
  TrendingUp, Clock, Activity, ShieldCheck, RefreshCw,
  UserX, CheckCircle2, Plane, Stethoscope, Sun,
  XCircle, Edit3, ToggleRight, Zap, List, Gift
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ACTION_CONFIG = {
  employee_submitted_update: { icon: RefreshCw, color: "bg-amber-50 text-amber-600", label: "Profile Update Request" },
  employee_submitted_registration: { icon: UserPlus, color: "bg-blue-50 text-blue-600", label: "New Registration" },
  admin_approved_update: { icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", label: "Update Approved" },
  admin_rejected_update: { icon: XCircle, color: "bg-red-50 text-red-600", label: "Update Rejected" },
  admin_approved_registration: { icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", label: "Registration Approved" },
  admin_rejected_registration: { icon: XCircle, color: "bg-red-50 text-red-600", label: "Registration Rejected" },
  admin_edited_employee: { icon: Edit3, color: "bg-purple-50 text-purple-600", label: "Employee Edited" },
  admin_added_employee: { icon: UserPlus, color: "bg-blue-50 text-blue-600", label: "Employee Added" },
  admin_assigned_leave_credits: { icon: CalendarDays, color: "bg-purple-50 text-purple-600", label: "Leave Credits" },
  admin_toggled_employee_status: { icon: ToggleRight, color: "bg-slate-100 text-slate-600", label: "Status Changed" },
  employee_filed_leave: { icon: CalendarDays, color: "bg-amber-50 text-amber-600", label: "Leave Filed" },
  admin_approved_leave: { icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", label: "Leave Approved" },
  admin_rejected_leave: { icon: XCircle, color: "bg-red-50 text-red-600", label: "Leave Rejected" },
  benefit_eligible_employee: { icon: Gift, color: "bg-pink-50 text-pink-600", label: "Benefit Eligible" },
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalEmployees: 0, pendingRegistrations: 0, pendingUpdates: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [leaveStats, setLeaveStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchHomeData = async () => {
    setIsLoading(true);
    try {
      const [empRes, regRes, updRes] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact', head: true }),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'Pending'),
        supabase.from('employee_update_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      setStats({ totalEmployees: empRes.count || 0, pendingRegistrations: regRes.count || 0, pendingUpdates: updRes.count || 0 });

      const { data: activityData } = await supabase
        .from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(6);
      setRecentActivities(activityData || []);

      const [updateReqRes, regReqRes, leaveReqRes] = await Promise.all([
        supabase.from('employee_update_requests')
          .select(`*, employees ( id, first_name, last_name, employee_id, position, department, employment_status, photo_url )`)
          .eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('employees').select('*').eq('employment_status', 'Pending').order('created_at', { ascending: false }),
        supabase.from('leave_applications')
          .select(`*, employees ( id, first_name, last_name, employee_id, position, department, photo_url )`)
          .eq('status', 'pending').order('created_at', { ascending: false }),
      ]);

      let combined = [];
      if (updateReqRes.data) combined = [...combined, ...updateReqRes.data.map(req => ({
        id: `upd_${req.id}`, name: `${req.employees?.first_name || ''} ${req.employees?.last_name || ''}`.trim(),
        employeeId: req.employees?.employee_id || '—', position: req.employees?.position || req.employees?.department || '—',
        photoUrl: req.employees?.photo_url || null, type: 'Profile Update', status: req.status,
        date: new Date(req.created_at), notes: '—', requestType: 'update',
      }))];
      if (regReqRes.data) combined = [...combined, ...regReqRes.data.map(emp => ({
        id: `reg_${emp.id}`, name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        employeeId: emp.employee_id || '—', position: emp.position || emp.department || 'New Applicant',
        photoUrl: emp.photo_url || null, type: 'Registration', status: emp.employment_status,
        date: new Date(emp.created_at), notes: '—', requestType: 'registration',
      }))];
      if (leaveReqRes.data) combined = [...combined, ...leaveReqRes.data.map(app => ({
        id: `leave_${app.id}`, name: `${app.employees?.first_name || ''} ${app.employees?.last_name || ''}`.trim(),
        employeeId: app.employees?.employee_id || '—', position: app.employees?.position || app.employees?.department || '—',
        photoUrl: app.employees?.photo_url || null, type: 'Leave Application', status: app.status,
        date: new Date(app.created_at), notes: `${app.leave_type} Leave (${app.start_date} to ${app.end_date})`,
        requestType: 'leave',
      }))];
      combined.sort((a, b) => b.date - a.date);
      setPendingRequests(combined.slice(0, 10));

      const todayStr = new Date().toISOString().split('T')[0];
      const { data: activeLeaves } = await supabase
        .from('leave_applications').select('leave_type').eq('status', 'approved')
        .lte('start_date', todayStr).gte('end_date', todayStr);
      const leaveCounts = {};
      (activeLeaves || []).forEach(l => { leaveCounts[l.leave_type] = (leaveCounts[l.leave_type] || 0) + 1; });
      setLeaveStats(leaveCounts);
    } catch (err) {
      console.error("Error fetching home data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
    const activitySub = supabase.channel('home_activity_log')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_activity_log' }, fetchHomeData).subscribe();
    const reqSub = supabase.channel('home_requests_pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_update_requests' }, fetchHomeData).subscribe();
    const empSub = supabase.channel('home_employees_pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchHomeData).subscribe();
    const leaveSub = supabase.channel('home_leave_apps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_applications' }, fetchHomeData).subscribe();
    return () => { activitySub.unsubscribe(); reqSub.unsubscribe(); empSub.unsubscribe(); leaveSub.unsubscribe(); };
  }, []);

  const totalOnLeave = Object.values(leaveStats).reduce((a, b) => a + b, 0);
  const analyticsRows = [
    { label: "Active Today", value: stats.totalEmployees - totalOnLeave, icon: CheckCircle2 },
    { label: "Total On Leave", value: totalOnLeave, icon: CalendarDays },
    { label: "Vacation Leave", value: leaveStats['Vacation'] || 0, icon: Plane },
    { label: "Sick Leave", value: leaveStats['Sick'] || 0, icon: Stethoscope },
    { label: "Family Leave", value: leaveStats['Family'] || 0, icon: Users },
    { label: "Bereavement Leave", value: leaveStats['Bereavement'] || 0, icon: UserX },
    { label: "Force Leave", value: leaveStats['Force'] || 0, icon: Sun },
  ];

  // Shared pending table JSX
  const PendingTable = () => (
    <Card className="border-none shadow-sm bg-white overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-50 flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-[#0C005F]" />
          Pending Requests
        </h2>
        <Button asChild variant="outline" size="sm" className="border-[#0C005F]/20 text-[#0C005F] font-black uppercase tracking-widest text-[10px] px-4 hover:bg-[#0C005F] hover:text-white transition-all shadow-sm">
          <Link to="/approvals">View all</Link>
        </Button>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[560px]">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-4">Name</th>
                <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Position</th>
                <th className="px-4 md:px-6 py-4">Type</th>
                <th className="px-4 md:px-6 py-4">Status</th>
                <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Date</th>
                <th className="px-4 md:px-6 py-4 hidden md:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pendingRequests.map((req) => (
                <tr key={req.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => navigate(req.requestType === 'update' ? '/approvals/updates' : req.requestType === 'leave' ? '/approvals/leaves' : '/approvals/registrations')}>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                      {req.photoUrl
                        ? <img key={req.photoUrl} src={req.photoUrl} alt={req.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        : <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">{req.name.split(' ').map(n => n[0]).join('')}</div>
                      }
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{req.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{req.employeeId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 hidden sm:table-cell"><span className="text-xs font-medium text-slate-600">{req.position}</span></td>
                  <td className="px-4 md:px-6 py-4">
                    <Badge variant="secondary" className={cn("text-[10px] font-black uppercase px-2 py-0.5",
                      req.requestType === 'registration' ? "bg-blue-50 text-blue-600" :
                      req.requestType === 'leave' ? "bg-purple-50 text-purple-600" : "bg-amber-50 text-amber-600")}>
                      {req.type}
                    </Badge>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <Badge variant="outline" className="text-[10px] font-bold border-amber-200 text-amber-600 bg-amber-50/30">
                      {req.status?.toUpperCase() || 'PENDING'}
                    </Badge>
                  </td>
                  <td className="px-4 md:px-6 py-4 hidden sm:table-cell text-xs font-medium text-slate-500">
                    {req.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 md:px-6 py-4 hidden md:table-cell"><p className="text-xs text-slate-500">{req.notes}</p></td>
                </tr>
              ))}
              {pendingRequests.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-12 text-center"><p className="text-slate-400 text-sm font-medium">No pending requests at the moment.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto animate-in fade-in duration-700 flex flex-col gap-6 md:gap-8">

      {/* ① Hero — always first */}
      <section className="order-1 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C005F] to-[#1a0b8c] p-6 md:p-12 text-white shadow-2xl shadow-[#0C005F]/20 min-h-[200px] md:min-h-[320px] flex flex-col justify-center">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-4 py-1 text-xs font-bold uppercase tracking-widest">
            Administrator Portal
          </Badge>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">{user?.first_name || "Admin"}</span>!
            </h1>
            <p className="text-blue-100/70 text-base md:text-xl font-medium">
              You have <span className="text-white font-bold">{stats.pendingRegistrations + stats.pendingUpdates} pending tasks</span> that require your immediate attention.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -ml-20 -mb-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px]" />
        <ShieldCheck className="absolute bottom-10 right-10 w-64 h-64 text-white/5 -rotate-12" />
      </section>

      {/* ② Pending Requests — order-2 on mobile (right after hero), order-3 on lg (below analytics grid) */}
      <div className="order-2 lg:order-3">
        <PendingTable />
      </div>

      {/* ③ Analytics Stats + Recent Activity grid — order-3 on mobile, order-2 on lg */}
      <div className="order-3 lg:order-2 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

        {/* Analytics Stats Table */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden flex flex-col">
          {/* Header row — Total Employees */}
          <div className="bg-[#0C005F] px-6 py-5 flex items-center justify-between text-white">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total Employees</span>
              <p className="text-xs font-medium text-blue-200/60 italic">Active workforce count</p>
            </div>
            <span className="text-4xl font-black">{stats.totalEmployees}</span>
          </div>
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-slate-50 flex-1">
            {analyticsRows.map((row, i) => (
              <div key={i} className="px-4 py-3 flex flex-col items-start gap-1.5 hover:bg-slate-50/50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm bg-white border border-slate-100">
                  <row.icon className="w-4 h-4 text-[#0C005F]" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{row.label}</p>
                <span className="text-3xl font-black text-slate-900 tracking-tight">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="lg:col-span-1 border-none shadow-sm bg-white overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-50 shrink-0 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0C005F]" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Recent Activity</h2>
          </div>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[280px]">
            <div className="divide-y divide-slate-50">
              {recentActivities.length === 0 ? (
                <div className="p-12 text-center"><p className="text-slate-400 text-sm font-medium">No recent activities found.</p></div>
              ) : (
                recentActivities.map((activity) => {
                  const config = ACTION_CONFIG[activity.action] || { icon: Zap, color: "bg-slate-50 text-slate-600", label: activity.action };
                  const IconComponent = config.icon;
                  const [bgClass, textClass] = config.color.split(' ');
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-4 hover:bg-slate-50/50 transition-colors">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", bgClass, textClass)}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-800 truncate">{activity.actor_name}</p>
                          <span className={cn("text-[10px] font-black uppercase tracking-wider shrink-0", textClass)}>{config.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{activity.description}</p>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
          {recentActivities.length > 0 && (
            <div className="p-4 border-t border-slate-50 shrink-0">
              <Button asChild variant="ghost" className="w-full text-slate-400 hover:text-[#0C005F] text-xs font-bold uppercase tracking-widest h-9">
                <Link to="/approvals">View All Requests</Link>
              </Button>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
