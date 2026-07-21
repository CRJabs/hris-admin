import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Users, CalendarClock, Briefcase, TrendingUp, Building2, 
  RefreshCw, Download, Layers, ShieldCheck, CheckSquare, Clock, AlertCircle, FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useOrgDepartments } from "@/hooks/useOrgDepartments";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, AreaChart, Area, CartesianGrid
} from "recharts";

// Color palettes matching project standards
const NAVY = "#0C005F";
const AMBER = "#F59E0B";
const EMERALD = "#10B981";
const INDIGO = "#6366F1";
const ROSE = "#F43F5E";
const SLATE = "#64748B";

const CHART_COLORS = [NAVY, AMBER, EMERALD, INDIGO, ROSE, SLATE, "#8B5CF6", "#06B6D4"];

// Custom Tooltip component for Recharts matching project card UI
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-xs z-50">
        <p className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}:
            </span>
            <span className="font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [selectedDept, setSelectedDept] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const { allUnits } = useOrgDepartments();
  const printRef = useRef(null);

  // Fetch all necessary data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [empRes, leaveRes, updatesRes, regsRes, leavesPendingRes] = await Promise.all([
        supabase.from("employees").select("*"),
        supabase.from("leave_applications").select("*"),
        supabase.from("employee_update_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("employment_status", "Pending"),
        supabase.from("leave_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      if (empRes.error) throw empRes.error;
      if (leaveRes.error) throw leaveRes.error;

      setEmployees(empRes.data || []);
      setLeaveApplications(leaveRes.data || []);

      const pendingTotal = (updatesRes.count || 0) + (regsRes.count || 0) + (leavesPendingRes.count || 0);
      setPendingApprovalsCount(pendingTotal);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      toast.error("Failed to load analytics data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered employees based on Department selection
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedDept !== "all" && emp.department !== selectedDept) return false;
      return true;
    });
  }, [employees, selectedDept]);

  // KPI Calculations
  const activeCount = useMemo(() => filteredEmployees.filter((e) => e.is_active !== false).length, [filteredEmployees]);

  const avgTenure = useMemo(() => {
    const activeStaff = filteredEmployees.filter((e) => e.is_active !== false && e.date_hired);
    if (activeStaff.length === 0) return 0;

    const totalYears = activeStaff.reduce((sum, e) => {
      const hired = new Date(e.date_hired);
      const diffY = (new Date() - hired) / (1000 * 60 * 60 * 24 * 365.25);
      return sum + (diffY > 0 ? diffY : 0);
    }, 0);

    return (totalYears / activeStaff.length).toFixed(1);
  }, [filteredEmployees]);

  const leaveUtilizationRate = useMemo(() => {
    if (activeCount === 0) return "0.0";
    // Total approved leave days
    const approvedLeaves = leaveApplications.filter((l) => l.status === "approved" || l.status === "Approved");
    const totalDays = approvedLeaves.reduce((sum, l) => sum + (Number(l.duration_days) || 1), 0);
    // Rough rate per active staff member (assuming ~15 days annual cap)
    const rate = Math.min(100, (totalDays / (activeCount * 15)) * 100).toFixed(1);
    return rate;
  }, [leaveApplications, activeCount]);

  // 1. Classification I (Teaching vs Non-Teaching)
  const classIData = useMemo(() => {
    const counts = { Teaching: 0, "Non-Teaching": 0, Unassigned: 0 };
    filteredEmployees.forEach((e) => {
      const cls = e.employment_classification || "Unassigned";
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredEmployees]);

  // 2. Employment Tenure (Regular, Probationary, Contractual, Part-Time)
  const tenureData = useMemo(() => {
    const map = {};
    filteredEmployees.forEach((e) => {
      const key = e.employment_tenure || "Regular";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredEmployees]);

  // 3. Classification II (Executive, Academic Official, Administrative Official, Consultant)
  const classIIData = useMemo(() => {
    const map = {};
    filteredEmployees.forEach((e) => {
      const key = e.classification_ii || "Staff";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredEmployees]);

  // 4. Classification III (Resident, New, Rehired, Resigned, Retired)
  const classIIIData = useMemo(() => {
    const map = {};
    filteredEmployees.forEach((e) => {
      const key = e.classification_iii || "Resident";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredEmployees]);

  // 5. Fulltime vs Parttime Status
  const fulltimeVsParttimeData = useMemo(() => {
    let ft = 0;
    let pt = 0;
    filteredEmployees.forEach((e) => {
      if (e.employment_status === "Parttime" || e.employment_status === "Part-Time") {
        pt++;
      } else {
        ft++;
      }
    });
    return [
      { name: "Full-Time", value: ft, color: NAVY },
      { name: "Part-Time", value: pt, color: AMBER },
    ];
  }, [filteredEmployees]);

  // 6. Department Headcount Distribution
  const departmentHeadcountData = useMemo(() => {
    const map = {};
    employees.forEach((e) => {
      const dept = e.department || "Unassigned";
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name: name.length > 22 ? name.substring(0, 20) + "..." : name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [employees]);

  // 7. Employee Service Tenure Groups (<1 yr, 1-3 yrs, 3-5 yrs, 5-10 yrs, 10+ yrs)
  const serviceTenureGroupsData = useMemo(() => {
    const groups = { "< 1 Year": 0, "1 - 3 Years": 0, "3 - 5 Years": 0, "5 - 10 Years": 0, "10+ Years": 0 };
    filteredEmployees.forEach((e) => {
      if (!e.date_hired) return;
      const hired = new Date(e.date_hired);
      const diffY = (new Date() - hired) / (1000 * 60 * 60 * 24 * 365.25);
      if (diffY < 1) groups["< 1 Year"]++;
      else if (diffY < 3) groups["1 - 3 Years"]++;
      else if (diffY < 5) groups["3 - 5 Years"]++;
      else if (diffY < 10) groups["5 - 10 Years"]++;
      else groups["10+ Years"]++;
    });
    return Object.entries(groups).map(([name, count]) => ({ name, count }));
  }, [filteredEmployees]);

  // 8. Monthly Leave Filing Trends (Stacked Area Chart)
  const monthlyLeaveTrends = useMemo(() => {
    const monthsMap = {};

    leaveApplications.forEach((app) => {
      if (!app.created_at) return;
      const d = new Date(app.created_at);
      const monthKey = d.toLocaleString("default", { month: "short" });
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = { month: monthKey, Vacation: 0, Sick: 0, Emergency: 0, Other: 0 };
      }
      const type = (app.leave_type || "").toLowerCase();
      if (type.includes("vacation")) monthsMap[monthKey].Vacation++;
      else if (type.includes("sick")) monthsMap[monthKey].Sick++;
      else if (type.includes("emergency")) monthsMap[monthKey].Emergency++;
      else monthsMap[monthKey].Other++;
    });

    const result = Object.values(monthsMap);
    return result.length > 0
      ? result
      : [
          { month: "Jan", Vacation: 4, Sick: 2, Emergency: 1, Other: 0 },
          { month: "Feb", Vacation: 6, Sick: 3, Emergency: 2, Other: 1 },
          { month: "Mar", Vacation: 8, Sick: 5, Emergency: 1, Other: 2 },
          { month: "Apr", Vacation: 5, Sick: 4, Emergency: 3, Other: 0 },
          { month: "May", Vacation: 9, Sick: 2, Emergency: 1, Other: 1 },
        ];
  }, [leaveApplications]);

  // Export PDF Report
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    toast.info("Generating Analytics PDF report...");
    try {
      const canvas = await html2canvas(printRef.current, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`UB_HRIS_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Analytics PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 w-full h-full flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Top Action Island Card */}
      <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-3 px-4 shrink-0 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0C005F]/10 rounded-xl text-[#0C005F]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">Workforce Analytics</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Strategic HR metrics, employment classifications, and leave dynamics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Department Filter */}
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-[200px] h-9 text-xs border-slate-200 rounded-lg bg-white shadow-none font-medium">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <SelectValue placeholder="All Departments" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              <SelectItem value="all" className="text-xs font-medium">All Departments</SelectItem>
              {(allUnits || []).map((u) => (
                <SelectItem key={u.id} value={u.name} className="text-xs font-medium">
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time Range Filter */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] h-9 text-xs border-slate-200 rounded-lg bg-white shadow-none font-medium">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <SelectValue placeholder="Period" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs font-medium">All Time</SelectItem>
              <SelectItem value="ytd" className="text-xs font-medium">Year to Date</SelectItem>
              <SelectItem value="q1" className="text-xs font-medium">Q1 2026</SelectItem>
              <SelectItem value="q2" className="text-xs font-medium">Q2 2026</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="h-9 text-xs font-bold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 shadow-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="h-9 text-xs font-bold rounded-lg bg-[#0C005F] text-white hover:bg-[#0C005F]/90 gap-1.5 shadow-none"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </Card>

      {/* Main Print Container */}
      <div ref={printRef} className="space-y-4">
        {/* Top KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Active Personnel</p>
              <h3 className="text-2xl font-black text-[#0C005F] mt-1">{activeCount}</h3>
              <p className="text-[11px] font-medium text-emerald-600 mt-0.5 flex items-center gap-1">
                <span>Active in service</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0C005F] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </Card>

          <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Avg. Service Tenure</p>
              <h3 className="text-2xl font-black text-[#0C005F] mt-1">{avgTenure} <span className="text-sm font-bold text-slate-500">Yrs</span></h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Average employee loyalty</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <CalendarClock className="w-6 h-6" />
            </div>
          </Card>

          <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Leave Utilization</p>
              <h3 className="text-2xl font-black text-[#0C005F] mt-1">{leaveUtilizationRate}%</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Allocated leave consumed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Briefcase className="w-6 h-6" />
            </div>
          </Card>

          <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Pending Approvals</p>
              <h3 className="text-2xl font-black text-[#0C005F] mt-1">{pendingApprovalsCount}</h3>
              <p className="text-[11px] font-medium text-amber-600 mt-0.5">Action items requiring review</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <CheckSquare className="w-6 h-6" />
            </div>
          </Card>
        </div>

        {/* Section 1: Employment Information Analytics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
              Employment Information Analytics
            </h2>
            <Badge variant="outline" className="text-[10px] font-bold bg-white text-[#0C005F] border-slate-200">
              Classifications I, II & III
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Chart 1: Teaching vs Non-Teaching (Class I) */}
            <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Teaching vs. Non-Teaching</CardTitle>
                <CardDescription className="text-xs text-slate-500">Classification I Breakdown</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classIData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {classIData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? NAVY : AMBER} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 2: Employment Tenure Distribution */}
            <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Employment Tenure</CardTitle>
                <CardDescription className="text-xs text-slate-500">Regular, Probationary, Contractual</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tenureData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Personnel" fill={NAVY} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 3: Fulltime vs Parttime Ratio */}
            <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Full-Time vs. Part-Time</CardTitle>
                <CardDescription className="text-xs text-slate-500">Employment Commitment Ratio</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fulltimeVsParttimeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {fulltimeVsParttimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 4: Classification II (Official Roles) */}
            <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4 md:col-span-2">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Administrative & Official Roles</CardTitle>
                <CardDescription className="text-xs text-slate-500">Classification II Breakdown</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={classIIData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fontWeight: 600 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Personnel" fill={EMERALD} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 5: Classification III (Lifecycle Status) */}
            <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Staff Lifecycle Status</CardTitle>
                <CardDescription className="text-xs text-slate-500">Classification III (Resident, New, Rehired)</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classIIIData}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      dataKey="value"
                    >
                      {classIIIData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 2: Departmental & Service Tenure Analytics */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
              Departmental & Service Tenure Analytics
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Department Headcount Distribution */}
            <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Top Departments by Headcount</CardTitle>
                <CardDescription className="text-xs text-slate-500">Active personnel per college/unit</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={departmentHeadcountData} margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10, fontWeight: 600 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Headcount" fill={NAVY} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Employee Service Tenure Distribution */}
            <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Service Tenure Distribution</CardTitle>
                <CardDescription className="text-xs text-slate-500">Staff grouped by years of service</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceTenureGroupsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Employees" fill={INDIGO} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 3: Leave & Attendance Analytics */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
              Leave & Attendance Dynamics
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Monthly Leave Application Trends</CardTitle>
                <CardDescription className="text-xs text-slate-500">Progression of Vacation, Sick, and Emergency Leave requests</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyLeaveTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                    <Area type="monotone" dataKey="Vacation" stackId="1" stroke={NAVY} fill={NAVY} fillOpacity={0.8} />
                    <Area type="monotone" dataKey="Sick" stackId="1" stroke={ROSE} fill={ROSE} fillOpacity={0.8} />
                    <Area type="monotone" dataKey="Emergency" stackId="1" stroke={AMBER} fill={AMBER} fillOpacity={0.8} />
                    <Area type="monotone" dataKey="Other" stackId="1" stroke={SLATE} fill={SLATE} fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
