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
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Cake, AlertTriangle } from "lucide-react";

const ACTION_CONFIG = {
  employee_submitted_update: { icon: RefreshCw, color: "bg-blue-50/50 text-[#0C005F]", label: "Profile Update Request" },
  employee_submitted_registration: { icon: UserPlus, color: "bg-blue-50/50 text-[#0C005F]", label: "New Registration" },
  admin_approved_update: { icon: CheckCircle2, color: "bg-blue-50 text-blue-700", label: "Update Approved" },
  admin_rejected_update: { icon: XCircle, color: "bg-blue-100/50 text-blue-800", label: "Update Rejected" },
  admin_approved_registration: { icon: CheckCircle2, color: "bg-blue-50 text-blue-700", label: "Registration Approved" },
  admin_rejected_registration: { icon: XCircle, color: "bg-blue-100/50 text-blue-800", label: "Registration Rejected" },
  admin_edited_employee: { icon: Edit3, color: "bg-blue-50 text-[#0C005F]", label: "Employee Edited" },
  admin_added_employee: { icon: UserPlus, color: "bg-blue-50 text-blue-700", label: "Employee Added" },
  admin_assigned_leave_credits: { icon: CalendarDays, color: "bg-blue-50 text-[#0C005F]", label: "Leave Credits" },
  admin_toggled_employee_status: { icon: ToggleRight, color: "bg-blue-50/30 text-blue-600", label: "Status Changed" },
  employee_filed_leave: { icon: CalendarDays, color: "bg-blue-50/50 text-[#0C005F]", label: "Leave Filed" },
  admin_approved_leave: { icon: CheckCircle2, color: "bg-blue-50 text-blue-700", label: "Leave Approved" },
  admin_rejected_leave: { icon: XCircle, color: "bg-blue-100/50 text-blue-800", label: "Leave Rejected" },
  benefit_eligible_employee: { icon: Gift, color: "bg-blue-50 text-[#0C005F]", label: "Benefit Eligible" },
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalEmployees: 0, pendingRegistrations: 0, pendingUpdates: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [leaveStats, setLeaveStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("leaves");
  const [workforceStats, setWorkforceStats] = useState({
    tenure: { Regular: 0, Probationary: 0, Contractual: 0 },
    classification: { Teaching: 0, 'Non-Teaching': 0 },
    classificationII: {},
    workload: { 'Full-Time': 0, 'Part-Time': 0 }
  });

  const fetchHomeData = async () => {
    setIsLoading(true);
    try {
      const [empRes, regRes, updRes, empDataRes] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact', head: true }),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'Pending'),
        supabase.from('employee_update_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('employees').select('employment_tenure, employment_classification, classification_ii, employment_status').eq('is_active', true)
      ]);
      setStats({ totalEmployees: empRes.count || 0, pendingRegistrations: regRes.count || 0, pendingUpdates: updRes.count || 0 });

      // Compute workforce stats breakdown
      let tenureCounts = { Regular: 0, Probationary: 0, Contractual: 0 };
      let classCounts = { Teaching: 0, 'Non-Teaching': 0 };
      let classIICounts = {};
      let workloadCounts = { 'Full-Time': 0, 'Part-Time': 0 };

      (empDataRes.data || []).forEach(emp => {
        // Tenure normalization
        let tenure = emp.employment_tenure || 'Regular';
        if (tenure.toLowerCase().includes('prob')) tenure = 'Probationary';
        else if (tenure.toLowerCase().includes('contract')) tenure = 'Contractual';
        else tenure = 'Regular';
        tenureCounts[tenure] = (tenureCounts[tenure] || 0) + 1;

        // Classification I
        let classI = emp.employment_classification || 'Non-Teaching';
        if (classI.toLowerCase() === 'teaching') classI = 'Teaching';
        else classI = 'Non-Teaching';
        classCounts[classI] = (classCounts[classI] || 0) + 1;

        // Classification II
        const classII = emp.classification_ii;
        if (classII) {
          classIICounts[classII] = (classIICounts[classII] || 0) + 1;
        }

        // Workload
        const status = emp.employment_status || 'Full-time';
        const workload = status.toLowerCase() === 'part-time' ? 'Part-Time' : 'Full-Time';
        workloadCounts[workload] = (workloadCounts[workload] || 0) + 1;
      });

      setWorkforceStats({
        tenure: tenureCounts,
        classification: classCounts,
        classificationII: classIICounts,
        workload: workloadCounts
      });

      const { data: activityData } = await supabase
        .from('admin_activity_log')
        .select('*, employees(photo_url, first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(6);
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
      setStats(prev => ({
        ...prev,
        pendingRegistrations: regReqRes.data?.length || 0,
        pendingUpdates: updateReqRes.data?.length || 0,
        pendingLeaves: leaveReqRes.data?.length || 0,
        totalPendingRequests: combined.length
      }));

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

  // Shared pending table / list card JSX
  const PendingTable = () => (
    <Card className="border border-slate-200 shadow-none bg-white overflow-hidden flex flex-col h-full rounded-[8px]">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Pending Requests</h2>
        </div>
        <Button asChild variant="outline" size="sm" className="border-[#0C005F]/20 text-[#0C005F] font-black uppercase tracking-widest text-xs px-3 h-8 hover:bg-[#0C005F] hover:text-white transition-all shadow-sm">
          <Link to="/approvals">View all</Link>
        </Button>
      </div>
      <CardContent className="p-0 flex-1 overflow-y-auto min-h-0">
        <div className="divide-y divide-slate-50">
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer flex items-center justify-between gap-3"
              onClick={() => navigate(req.requestType === 'update' ? '/approvals/updates' : req.requestType === 'leave' ? '/approvals/leaves' : '/approvals/registrations')}
            >
              <div className="flex items-center gap-3 min-w-0">
                {req.photoUrl
                  ? <img key={req.photoUrl} src={req.photoUrl} alt={req.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{req.name.split(' ').map(n => n[0]).join('')}</div>
                }
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 truncate">{req.name}</span>
                  <span className="text-xs text-slate-400 font-medium truncate">{req.position || req.employeeId}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant="secondary" className={cn("text-2xs font-black uppercase px-2 py-0.5",
                  req.requestType === 'registration' ? "bg-blue-50 text-blue-600" :
                  req.requestType === 'leave' ? "bg-purple-50 text-purple-600" : "bg-amber-50 text-amber-600")}>
                  {req.type}
                </Badge>
                <span className="text-xs font-medium text-slate-400">
                  {req.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
          {pendingRequests.length === 0 && (
            <div className="p-12 text-center"><p className="text-slate-400 text-sm font-medium">No pending requests at the moment.</p></div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 w-full animate-in fade-in duration-700 flex flex-col gap-4 min-h-full">

      {/* ① Full-width Welcome Card (Hero Banner) - rounded 8px, title font size +8px */}
      <div className="w-full relative overflow-hidden rounded-[8px] bg-gradient-to-br from-[#0C005F] to-[#1a0b8c] p-6 md:p-8 text-white shadow-2xl shadow-[#0C005F]/20 h-[170px] shrink-0 flex flex-col justify-center">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">{user?.first_name || "Admin"}</span>!
          </h1>
          <p className="text-blue-100/70 text-sm md:text-base font-medium">
            You have <span className="text-white font-bold">{stats.totalPendingRequests ?? (stats.pendingRegistrations + stats.pendingUpdates)} pending {stats.totalPendingRequests === 1 ? 'task' : 'tasks'}</span> that require your immediate attention.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -ml-20 -mb-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px]" />
        <ShieldCheck className="absolute bottom-4 right-6 w-36 h-36 text-white/5 -rotate-12" />
      </div>

      {/* ② Lower Section: Left (Activity Calendar + Recent Activity) & Right (Pending Requests) */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* Left Column: Activity Calendar + Recent Activity stacked (512px height each) */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Top: Activity Calendar Card (Fixed 512px height) */}
          <Card className="h-[512px] shrink-0 border border-slate-200 shadow-none bg-white overflow-hidden flex flex-col rounded-[8px]">
            <CardContent className="p-0 flex-1 flex flex-col h-full overflow-hidden">
              <MonthGridCalendar />
            </CardContent>
          </Card>

          {/* Bottom: Recent Activity Card (Fixed 512px height) */}
          <Card className="h-[512px] shrink-0 border border-slate-200 shadow-none bg-white overflow-hidden flex flex-col rounded-[8px]">
            <div className="px-6 py-4 border-b border-slate-50 shrink-0">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Recent Activity</h2>
            </div>
            <CardContent className="p-0 flex-1 overflow-y-auto min-h-0">
              <div className="divide-y divide-slate-50">
                {recentActivities.length === 0 ? (
                  <div className="p-8 text-center"><p className="text-slate-400 text-sm font-medium">No recent activities found.</p></div>
                ) : (
                  recentActivities.map((activity) => {
                    const config = ACTION_CONFIG[activity.action] || { color: "bg-slate-50 text-slate-600", label: activity.action };
                    const [, textClass] = config.color.split(' ');
                    const isAdmin = activity.actor_type === 'admin' || activity.actor_name?.toLowerCase().includes('admin') || activity.actor_name?.includes('@');
                    const displayName = isAdmin ? 'Administrator' : (activity.actor_name || 'System');
                    const isSystem = activity.actor_type === 'system' || displayName === 'System';
                    const empPhoto = Array.isArray(activity.employees) ? activity.employees[0]?.photo_url : activity.employees?.photo_url;
                    const photoUrl = (isAdmin || isSystem) ? '/assets/ub.png' : (empPhoto || null);
                    const initials = displayName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-4 hover:bg-slate-50/50 transition-colors">
                        {/* Avatar: ub.png for admin/system, employee photo or grey initials fallback */}
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={displayName}
                            className={cn(
                              "w-8 h-8 rounded-full object-cover shrink-0",
                              (isAdmin || isSystem) ? "border border-[#0C005F]/20 bg-white p-0.5" : "border border-slate-100"
                            )}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-2xs font-bold text-slate-500 shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
                            <span className={cn("text-2xs font-black uppercase tracking-wider shrink-0", textClass)}>{config.label}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{activity.description}</p>
                          <p className="text-xs font-medium text-slate-400 mt-1">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
            <div className="px-4 py-3 border-t border-slate-50 shrink-0">
              <Button asChild variant="ghost" className="w-full text-slate-400 hover:text-[#0C005F] text-xs font-bold uppercase tracking-widest h-8">
                <Link to="/activity">View Recent Activity</Link>
              </Button>
            </div>
          </Card>

        </div>

        {/* Right Column: Pending Requests Card (Height adjusted to 1040px to match 512px + 512px + 16px gap) */}
        <div className="lg:w-[420px] shrink-0 h-[1040px]">
          <PendingTable />
        </div>

      </div>

      {/* Hidden for now - Total Employees / Analytics Stats Card (kept for relocation/reuse) */}
      {/* 
      <Card className="hidden lg:col-span-2 border-none shadow-sm bg-white overflow-hidden flex-col rounded-[32px]">
        <div className="bg-[#0C005F] px-6 h-[79px] flex items-center justify-between text-white shrink-0">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total Employees</span>
            <p className="text-xs font-medium text-blue-200/60 italic">Active workforce count</p>
          </div>
          <span className="text-4xl font-black">{stats.totalEmployees}</span>
        </div>
      </Card>
      */}

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
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); // event detail modal

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
          const empName = `${leave.employees?.first_name || ''} ${leave.employees?.last_name || ''}`.trim() || 'Employee';
          addEvent(leave.start_date, {
            type:  leave.status === 'pending' ? 'pending_leave' : 'approved_leave',
            label: `${leave.employees?.first_name || '?'} – ${leave.leave_type} Leave`,
            title: `${leave.leave_type} Leave Application`,
            employeeName: empName,
            leaveType: leave.leave_type,
            status: leave.status,
            date: format(new Date(leave.start_date + 'T00:00:00'), 'MMMM d, yyyy'),
          });
        });

        // Birthday events — year-agnostic (match by month/day in the viewed month)
        (employeesRes.data || []).forEach(emp => {
          if (!emp.birthdate) return;
          try {
            const bdate = new Date(emp.birthdate + 'T00:00:00');
            const thisYearBirthday = new Date(viewedYear, bdate.getMonth(), bdate.getDate());
            if (isSameMonth(thisYearBirthday, currentMonth)) {
              const dateStr = format(thisYearBirthday, 'yyyy-MM-dd');
              const empName = `${emp.first_name} ${emp.last_name}`;
              addEvent(dateStr, {
                type:  'birthday',
                label: `${empName}'s Birthday`,
                title: 'Birthday Celebration',
                employeeName: empName,
                date: format(thisYearBirthday, 'MMMM d'),
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
              const dateStr = format(expiryDate, 'yyyy-MM-dd');
              const empName = `${emp.first_name} ${emp.last_name}`;
              addEvent(dateStr, {
                type:  'expiring_license',
                label: `${emp.first_name} – ${lic.name || 'License'} Expires`,
                title: 'License Expiry Warning',
                employeeName: empName,
                licenseName: lic.name || 'Professional License',
                date: format(expiryDate, 'MMMM d, yyyy'),
              });
            } catch (_e) { /* skip invalid date */ }
          });
        });

        // Custom calendar events
        (customRes.data || []).forEach(evt => {
          addEvent(evt.event_date, {
            type:  'custom',
            label: evt.title,
            title: evt.title,
            date: format(new Date(evt.event_date + 'T00:00:00'), 'MMMM d, yyyy'),
          });
        });

        setEventMap(map);
      } catch (err) {
        console.error('Error fetching calendar data:', err);
      }
    };

    fetchCalendarData();
  }, [currentMonth, currentYear, refreshKey]);

  // ── Close context menu & overflow popover on outside mousedown ───────────
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [contextMenu]);

  useEffect(() => {
    if (!overflowDay) return;
    const close = () => setOverflowDay(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [overflowDay]);

  // ── Close context menu & overflow popover on scroll ───────────────────────
  useEffect(() => {
    if (!contextMenu && !overflowDay) return;
    const closeOnScroll = () => {
      setContextMenu(null);
      setOverflowDay(null);
    };
    window.addEventListener('scroll', closeOnScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', closeOnScroll, { capture: true });
  }, [contextMenu, overflowDay]);

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
      {/* Header - Reverted to white background consistent with all other cards */}
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Activity Calendar</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-700">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Body: Left Legend Sidebar + Calendar Grid */}
      <div className="flex flex-1 min-h-0">
        {/* Legend Sidebar on Left (Collapsible) */}
        <div className={cn(
          "shrink-0 border-r border-slate-200 bg-slate-50/40 transition-all duration-300 flex flex-col justify-start overflow-hidden",
          legendCollapsed ? "w-10 p-2 items-center" : "w-36 p-3 space-y-2"
        )}>
          {legendCollapsed ? (
            <>
              <button
                onClick={() => setLegendCollapsed(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors mb-2"
                title="Expand Legend"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center gap-2.5 pt-1">
                {Object.entries(EVENT_STYLES).map(([key, style]) => (
                  <span
                    key={key}
                    title={style.label}
                    className={cn('w-2.5 h-2.5 rounded-full shrink-0 cursor-help', style.dot)}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <p className="text-2xs font-black text-slate-400 uppercase tracking-widest">Legend</p>
                <button
                  onClick={() => setLegendCollapsed(true)}
                  className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                  title="Collapse Legend"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 pt-0.5">
                {Object.entries(EVENT_STYLES).map(([key, style]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', style.dot)} />
                    <span className="text-xs font-bold text-slate-600 truncate">{style.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Day name headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 shrink-0">
            {DAY_NAMES.map(day => (
              <div
                key={day}
                className="py-1.5 text-center text-2xs font-black uppercase tracking-widest text-slate-400 border-r border-slate-200 last:border-r-0"
              >
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Day cells grid */}
          <div className="flex flex-col flex-1 min-h-0">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 flex-1 min-h-[64px]">
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
                        'border-r border-b border-slate-200 last:border-r-0 p-1 relative flex flex-col gap-0.5 hover:bg-slate-50/80 transition-colors cursor-default',
                        !inMonth && 'bg-slate-50/50',
                        todayFlag  && 'bg-blue-50/40'
                      )}
                      onContextMenu={(e) => handleContextMenu(e, day)}
                    >
                      {/* Day number */}
                      <span
                        className={cn(
                          'text-xs font-bold leading-none self-start mb-0.5',
                          todayFlag
                            ? 'w-4 h-4 flex items-center justify-center rounded-full bg-[#0C005F] text-white text-2xs'
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
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                            className={cn('text-2xs font-bold px-1 py-0.5 rounded truncate leading-tight cursor-pointer hover:opacity-85 transition-opacity', s.bg)}
                          >
                            {evt.label}
                          </div>
                        );
                      })}

                      {/* Overflow "+N more" button */}
                      {overflow > 0 && (
                        <button
                          className="text-2xs font-bold text-slate-400 hover:text-[#0C005F] text-left transition-colors"
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
                          <p className="text-2xs font-black text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-100">
                            {format(day, 'MMMM d')} · All Events
                          </p>
                          <div className="space-y-1 pt-0.5">
                            {dayEvents.map((evt, ei) => {
                              const s = EVENT_STYLES[evt.type] || EVENT_STYLES.custom;
                              return (
                                <div
                                  key={ei}
                                  onClick={(e) => { e.stopPropagation(); setOverflowDay(null); setSelectedEvent(evt); }}
                                  className={cn('text-xs font-bold px-2 py-1 rounded-md truncate cursor-pointer hover:opacity-85 transition-opacity', s.bg)}
                                >
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
        </div>
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
                    <div
                      key={ei}
                      onClick={(e) => { e.stopPropagation(); setContextMenu(null); setSelectedEvent(evt); }}
                      className={cn('text-[10px] font-bold px-2 py-1 rounded-md truncate cursor-pointer hover:opacity-85 transition-opacity', s.bg)}
                    >
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

      {/* Event Detail Modal (Displays info when any event/announcement is clicked) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className={cn('w-3 h-3 rounded-full shrink-0', EVENT_STYLES[selectedEvent.type]?.dot)} />
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                  {EVENT_STYLES[selectedEvent.type]?.label || 'Event Details'}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">{selectedEvent.label}</h3>
                {selectedEvent.date && (
                  <p className="text-xs font-semibold text-slate-400 mt-1">{selectedEvent.date}</p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5 text-xs text-slate-600">
                {selectedEvent.employeeName && (
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-2xs">Employee</span>
                    <span className="font-extrabold text-slate-800">{selectedEvent.employeeName}</span>
                  </div>
                )}
                {selectedEvent.leaveType && (
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-2xs">Leave Type</span>
                    <span className="font-extrabold text-slate-800">{selectedEvent.leaveType}</span>
                  </div>
                )}
                {selectedEvent.status && (
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-2xs">Status</span>
                    <Badge variant="secondary" className={cn("text-2xs font-extrabold uppercase px-2 py-0.5",
                      selectedEvent.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                      {selectedEvent.status}
                    </Badge>
                  </div>
                )}
                {selectedEvent.licenseName && (
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-2xs">License Name</span>
                    <span className="font-extrabold text-slate-800">{selectedEvent.licenseName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-2xs">Category</span>
                  <span className="font-extrabold text-slate-800">{EVENT_STYLES[selectedEvent.type]?.label}</span>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 pb-6 flex justify-end">
              <Button
                onClick={() => setSelectedEvent(null)}
                variant="outline"
                className="text-xs font-bold uppercase tracking-wider border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal (Scaled up by 2.5x to max-w-2xl with larger padding and text) */}
      {addEventOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-[#0C005F] px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Add Calendar Event</h2>
                <p className="text-xs text-white/70 mt-1 font-medium">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
                </p>
              </div>
              <button
                onClick={() => setAddEventOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Date</label>
                <div className="h-11 px-4 flex items-center bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold text-slate-700">
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Event Name *</label>
                <input
                  autoFocus
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && eventName.trim()) handleSaveEvent(); }}
                  placeholder="e.g. Company Outing, Team Meeting, Academic Holiday..."
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#0C005F]/20 focus:border-[#0C005F]/40 transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-3">
                💡 All active employees will receive an in-app notification when this event is added.
              </p>
            </div>

            {/* Modal footer */}
            <div className="px-8 pb-8 flex gap-3 justify-end">
              <button
                onClick={() => setAddEventOpen(false)}
                className="px-6 h-11 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={isSaving || !eventName.trim()}
                className="px-8 h-11 text-sm font-bold text-white bg-[#0C005F] rounded-xl hover:bg-[#0C005F]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-[#0C005F]/20"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                ) : (
                  <><Plus className="w-4 h-4" />Add Event</>
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

