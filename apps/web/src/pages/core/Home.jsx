import { useState, useEffect } from "react";
import {
  Users, UserPlus, CheckSquare, CalendarDays,
  TrendingUp, Clock, Activity, ShieldCheck, RefreshCw,
  UserX, CheckCircle2, Plane, Stethoscope, Sun,
  XCircle, Edit3, ToggleRight, Zap, List, Gift,
  X, Plus, Loader2
} from "lucide-react";
import { formatDistanceToNow, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, format, addMonths, subMonths } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

      {/* ① Hero + Recent Activity side by side */}
      <section className="order-1 flex flex-col lg:flex-row gap-6">
        {/* Hero Banner */}
        <div className="flex-1 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C005F] to-[#1a0b8c] p-6 md:p-10 text-white shadow-2xl shadow-[#0C005F]/20 min-h-[180px] md:min-h-[260px] flex flex-col justify-center">
          <div className="relative z-10 space-y-4 max-w-xl">
            <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Administrator Portal
            </Badge>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">{user?.first_name || "Admin"}</span>!
              </h1>
              <p className="text-blue-100/70 text-base md:text-lg font-medium">
                You have <span className="text-white font-bold">{stats.pendingRegistrations + stats.pendingUpdates} pending tasks</span> that require your immediate attention.
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 -ml-20 -mb-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px]" />
          <ShieldCheck className="absolute bottom-6 right-6 w-48 h-48 text-white/5 -rotate-12" />
        </div>

        {/* Recent Activity Feed */}
        <Card className="lg:w-[340px] shrink-0 border-none shadow-sm bg-white overflow-hidden flex flex-col">
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
      </section>

      {/* ② Pending Requests */}
      <div className="order-2 lg:order-3">
        <PendingTable />
      </div>

      {/* ③ Analytics Stats + Calendar grid — 40/60 split */}
      <div className="order-3 lg:order-2 grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">

        {/* Analytics Stats Table */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden flex flex-col">
          {/* Header row — Total Employees */}
          <div className="bg-[#0C005F] px-6 h-[79px] flex items-center justify-between text-white shrink-0">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total Employees</span>
              <p className="text-xs font-medium text-blue-200/60 italic">Active workforce count</p>
            </div>
            <span className="text-4xl font-black">{stats.totalEmployees}</span>
          </div>
          {/* Stats grid — 2 columns to fit narrower card */}
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-50 flex-1">
            {analyticsRows.map((row, i) => (
              <div key={i} className="px-5 py-5 flex flex-col justify-between hover:bg-slate-50/50 transition-colors h-full">
                <div className="flex flex-row items-center gap-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center border border-slate-100 shadow-sm bg-white">
                    <row.icon className="w-3.5 h-3.5 text-[#0C005F]" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{row.label}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <span className="text-4xl font-black text-slate-900 tracking-tight leading-none">{row.value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Calendar Panel — 60% width (3 of 5 cols) */}
        <Card className="lg:col-span-3 border-none shadow-sm bg-white overflow-visible flex flex-col rounded-xl">
          <CardContent className="p-0 flex-1 flex flex-col">
            <MonthGridCalendar />
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EVENT_STYLES = {
  pending_leave:    { bg: 'bg-amber-100 text-amber-800 border border-amber-200',     dot: 'bg-amber-400',   label: 'Pending Leave' },
  approved_leave:   { bg: 'bg-emerald-100 text-emerald-800 border border-emerald-200', dot: 'bg-emerald-400', label: 'Approved Leave' },
  birthday:         { bg: 'bg-pink-100 text-pink-800 border border-pink-200',         dot: 'bg-pink-400',    label: 'Birthday' },
  expiring_license: { bg: 'bg-orange-100 text-orange-800 border border-orange-200',   dot: 'bg-orange-400',  label: 'Expiring License' },
  custom:           { bg: 'bg-indigo-100 text-indigo-800 border border-indigo-200',   dot: 'bg-indigo-400',  label: 'Event' },
};

function MonthGridCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventMap, setEventMap] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, date }
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventName, setEventName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [overflowDay, setOverflowDay] = useState(null); // dateStr of open overflow popover

  const currentYear = new Date().getFullYear();

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCalendarData = async () => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd   = endOfMonth(currentMonth);
      const monthStartStr = format(monthStart, 'yyyy-MM-dd');
      const monthEndStr   = format(monthEnd,   'yyyy-MM-dd');
      const viewedYear    = currentMonth.getFullYear();

      try {
        const [leavesRes, employeesRes, customRes] = await Promise.all([
          supabase
            .from('leave_applications')
            .select('start_date, leave_type, status, employees(first_name, last_name)')
            .in('status', ['pending', 'approved'])
            .gte('start_date', monthStartStr)
            .lte('start_date', monthEndStr),
          supabase
            .from('employees')
            .select('id, first_name, last_name, birthdate, licenses')
            .neq('employment_status', 'Inactive'),
          supabase
            .from('calendar_events')
            .select('*')
            .gte('event_date', monthStartStr)
            .lte('event_date', monthEndStr),
        ]);

        const map = {};
        const addEvent = (dateStr, event) => {
          if (!map[dateStr]) map[dateStr] = [];
          map[dateStr].push(event);
        };

        // Leave events — start date only
        (leavesRes.data || []).forEach(leave => {
          addEvent(leave.start_date, {
            type:  leave.status === 'pending' ? 'pending_leave' : 'approved_leave',
            label: `${leave.employees?.first_name || '?'} – ${leave.leave_type} Leave`,
          });
        });

        // Birthday events — year-agnostic (match by month/day in the viewed month)
        (employeesRes.data || []).forEach(emp => {
          if (!emp.birthdate) return;
          try {
            const bdate = new Date(emp.birthdate + 'T00:00:00');
            const thisYearBirthday = new Date(viewedYear, bdate.getMonth(), bdate.getDate());
            if (isSameMonth(thisYearBirthday, currentMonth)) {
              addEvent(format(thisYearBirthday, 'yyyy-MM-dd'), {
                type:  'birthday',
                label: `${emp.first_name} ${emp.last_name}'s Birthday`,
              });
            }
          } catch (_e) { /* skip invalid date */ }
        });

        // Expiring license events — current calendar year only
        (employeesRes.data || []).forEach(emp => {
          if (!Array.isArray(emp.licenses)) return;
          emp.licenses.forEach(lic => {
            if (!lic.expiry || typeof lic.expiry !== 'string') return;
            try {
              const expiryDate = new Date(lic.expiry + 'T00:00:00');
              if (isNaN(expiryDate.getTime())) return;
              if (expiryDate.getFullYear() !== currentYear) return;
              if (!isSameMonth(expiryDate, currentMonth)) return;
              addEvent(format(expiryDate, 'yyyy-MM-dd'), {
                type:  'expiring_license',
                label: `${emp.first_name} – ${lic.name || 'License'} Expires`,
              });
            } catch (_e) { /* skip invalid date */ }
          });
        });

        // Custom calendar events
        (customRes.data || []).forEach(evt => {
          addEvent(evt.event_date, {
            type:  'custom',
            label: evt.title,
          });
        });

        setEventMap(map);
      } catch (err) {
        console.error('Error fetching calendar data:', err);
      }
    };

    fetchCalendarData();
  }, [currentMonth, currentYear, refreshKey]);

  // ── Close context menu on outside mousedown ───────────────────────────────
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [contextMenu]);

  // ── Close overflow popover on outside mousedown ───────────────────────────
  useEffect(() => {
    if (!overflowDay) return;
    const close = () => setOverflowDay(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [overflowDay]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleContextMenu = (e, day) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, date: day });
  };

  const openAddEvent = () => {
    setSelectedDate(contextMenu.date);
    setContextMenu(null);
    setEventName('');
    setAddEventOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventName.trim() || !selectedDate) return;
    setIsSaving(true);
    try {
      const dateStr       = format(selectedDate, 'yyyy-MM-dd');
      const formattedDate = format(selectedDate, 'MMMM d, yyyy');

      await supabase.from('calendar_events').insert({
        event_date: dateStr,
        title:      eventName.trim(),
      });

      // Notify all active employees
      const { data: activeEmps } = await supabase
        .from('employees')
        .select('id')
        .neq('employment_status', 'Inactive');

      if (activeEmps?.length) {
        await supabase.from('notifications').insert(
          activeEmps.map(emp => ({
            employee_id: emp.id,
            type:        'info',
            title:       'Upcoming Event',
            message:     `${eventName.trim()} will happen on ${formattedDate}.`,
          }))
        );
      }

      setAddEventOpen(false);
      setEventName('');
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Error saving event:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Calendar grid ─────────────────────────────────────────────────────────
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 1 });
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks      = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="bg-[#0C005F] px-6 h-[79px] flex items-center justify-between text-white shrink-0 rounded-tl-xl rounded-tr-xl">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Activity Calendar</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-white/90">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="w-6 h-6 flex items-center justify-center rounded-md border border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="w-6 h-6 flex items-center justify-center rounded-md border border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b border-slate-100 shrink-0">
        {DAY_NAMES.map(day => (
          <div
            key={day}
            className="py-2 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-100 last:border-r-0"
          >
            {day.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Day cells grid */}
      <div className="flex flex-col flex-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 flex-1" style={{ minHeight: '64px' }}>
            {week.map((day, di) => {
              const inMonth     = isSameMonth(day, currentMonth);
              const todayFlag   = isToday(day);
              const dateStr     = format(day, 'yyyy-MM-dd');
              const dayEvents   = eventMap[dateStr] || [];
              const visibleEvts = dayEvents.slice(0, 2);
              const overflow    = dayEvents.length - 2;
              const isOvOpen    = overflowDay === dateStr;

              return (
                <div
                  key={di}
                  className={cn(
                    'border-r border-b border-slate-100 last:border-r-0 p-1 relative flex flex-col gap-0.5 hover:bg-slate-50/80 transition-colors cursor-default',
                    !inMonth && 'bg-slate-50/50',
                    todayFlag  && 'bg-blue-50/40'
                  )}
                  onContextMenu={(e) => handleContextMenu(e, day)}
                >
                  {/* Day number */}
                  <span
                    className={cn(
                      'text-[11px] font-bold leading-none self-start mb-0.5',
                      todayFlag
                        ? 'w-5 h-5 flex items-center justify-center rounded-full bg-[#0C005F] text-white'
                        : inMonth ? 'text-slate-700' : 'text-slate-300'
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Visible event pills (max 2) */}
                  {visibleEvts.map((evt, ei) => {
                    const s = EVENT_STYLES[evt.type] || EVENT_STYLES.custom;
                    return (
                      <div
                        key={ei}
                        title={evt.label}
                        className={cn('text-[9px] font-bold px-1 py-0.5 rounded truncate leading-tight', s.bg)}
                      >
                        {evt.label}
                      </div>
                    );
                  })}

                  {/* Overflow "+N more" button */}
                  {overflow > 0 && (
                    <button
                      className="text-[9px] font-bold text-slate-400 hover:text-[#0C005F] text-left transition-colors"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setOverflowDay(isOvOpen ? null : dateStr); }}
                    >
                      +{overflow} more
                    </button>
                  )}

                  {/* Overflow popover */}
                  {isOvOpen && (
                    <div
                      className="absolute top-full left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 min-w-[200px] space-y-1 animate-in fade-in zoom-in-95 duration-150"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-100">
                        {format(day, 'MMMM d')} · All Events
                      </p>
                      <div className="space-y-1 pt-0.5">
                        {dayEvents.map((evt, ei) => {
                          const s = EVENT_STYLES[evt.type] || EVENT_STYLES.custom;
                          return (
                            <div key={ei} className={cn('text-[10px] font-bold px-2 py-1 rounded-md truncate', s.bg)}>
                              {evt.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/40 flex flex-wrap gap-x-4 gap-y-1 shrink-0 rounded-bl-xl rounded-br-xl">
        {Object.entries(EVENT_STYLES).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full shrink-0', style.dot)} />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{style.label}</span>
          </div>
        ))}
      </div>

      {/* Right-click context menu (fixed position to avoid clipping) */}
      {contextMenu && (
        <div
          className="fixed z-[60] bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 min-w-[220px] max-w-[280px] animate-in fade-in zoom-in-95 duration-150"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Date header */}
          <div className="px-3 py-1.5 border-b border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {format(contextMenu.date, 'MMMM d, yyyy')}
            </p>
          </div>

          {/* Events on this day */}
          {(() => {
            const dateStr = format(contextMenu.date, 'yyyy-MM-dd');
            const dayEvents = eventMap[dateStr] || [];
            if (dayEvents.length === 0) return null;
            return (
              <div className="px-2 pt-1.5 pb-1 space-y-1">
                {dayEvents.map((evt, ei) => {
                  const s = EVENT_STYLES[evt.type] || EVENT_STYLES.custom;
                  return (
                    <div key={ei} className={cn('text-[10px] font-bold px-2 py-1 rounded-md truncate', s.bg)}>
                      {evt.label}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Add Event action */}
          <div className="border-t border-slate-100 mt-1">
            <button
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={openAddEvent}
            >
              <div className="w-5 h-5 rounded-md bg-[#0C005F] flex items-center justify-center shrink-0">
                <Plus className="w-3 h-3 text-white" />
              </div>
              Add Event
            </button>
          </div>
        </div>
      )}


      {/* Add Event Modal */}
      {addEventOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-[#0C005F] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-white tracking-tight">Add Event</h2>
                <p className="text-[10px] text-white/50 mt-0.5 font-medium">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
                </p>
              </div>
              <button
                onClick={() => setAddEventOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                <div className="h-9 px-3 flex items-center bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600">
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Name *</label>
                <input
                  autoFocus
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && eventName.trim()) handleSaveEvent(); }}
                  placeholder="e.g. Company Outing, Team Meeting..."
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C005F]/20 focus:border-[#0C005F]/40 transition-all placeholder:text-slate-300"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2">
                💡 All active employees will receive a notification about this event.
              </p>
            </div>

            {/* Modal footer */}
            <div className="px-6 pb-6 flex gap-2 justify-end">
              <button
                onClick={() => setAddEventOpen(false)}
                className="px-4 h-9 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={isSaving || !eventName.trim()}
                className="px-5 h-9 text-sm font-bold text-white bg-[#0C005F] rounded-lg hover:bg-[#0C005F]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-[#0C005F]/20"
              >
                {isSaving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</>
                ) : (
                  <><Plus className="w-3.5 h-3.5" />Add Event</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}

