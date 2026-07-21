import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Building2, Download, Calendar, ArrowUpRight, ArrowDownRight, TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useOrgDepartments } from "@/hooks/useOrgDepartments";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid
} from "recharts";

// Strictly Blue & Yellow / Amber Palette with light-dark gradients
const NAVY = "#0C005F";
const BLUE_PRIMARY = "#1E40AF";
const BLUE_MEDIUM = "#3B82F6";
const BLUE_LIGHT = "#93C5FD";
const AMBER_DARK = "#D97706";
const AMBER_PRIMARY = "#F59E0B";
const AMBER_LIGHT = "#FDE68A";

const BLUE_YELLOW_GRADIENT = [NAVY, BLUE_PRIMARY, BLUE_MEDIUM, AMBER_PRIMARY, AMBER_LIGHT, BLUE_LIGHT];

// Sparkline Mock Data for KPI cards
const kpiSparklines = {
  active: [
    { val: 32 }, { val: 33 }, { val: 33 }, { val: 34 }, { val: 35 }, { val: 36 }
  ],
  tenure: [
    { val: 6.8 }, { val: 6.9 }, { val: 7.0 }, { val: 7.1 }, { val: 7.2 }, { val: 7.3 }
  ],
  leave: [
    { val: 1.2 }, { val: 1.1 }, { val: 1.0 }, { val: 0.9 }, { val: 0.8 }, { val: 0.9 }
  ],
  pending: [
    { val: 12 }, { val: 9 }, { val: 7 }, { val: 10 }, { val: 8 }, { val: 6 }
  ]
};

// Custom Tooltip component matching project standards
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-xs z-50">
        <p className="font-bold text-[#0C005F] mb-1 border-b border-slate-100 pb-1">{label}</p>
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
  
  // Date Range state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Chart Category Filter (Max 4 charts displayed)
  const [activeCategory, setActiveCategory] = useState("all");
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

  // Filtered employees based on Department & Date Range
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedDept !== "all" && emp.department !== selectedDept) return false;
      if (startDate && emp.date_hired && new Date(emp.date_hired) < new Date(startDate)) return false;
      if (endDate && emp.date_hired && new Date(emp.date_hired) > new Date(endDate)) return false;
      return true;
    });
  }, [employees, selectedDept, startDate, endDate]);

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
    const approvedLeaves = leaveApplications.filter((l) => l.status === "approved" || l.status === "Approved");
    const totalDays = approvedLeaves.reduce((sum, l) => sum + (Number(l.duration_days) || 1), 0);
    const rate = Math.min(100, (totalDays / (activeCount * 15)) * 100).toFixed(1);
    return rate;
  }, [leaveApplications, activeCount]);

  // Chart Data definitions
  // 1. Classification I (Teaching vs Non-Teaching)
  const classIData = useMemo(() => {
    const counts = { Teaching: 0, "Non-Teaching": 0 };
    filteredEmployees.forEach((e) => {
      const cls = e.employment_classification === "Teaching" ? "Teaching" : "Non-Teaching";
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return [
      { name: "Teaching", value: counts["Teaching"], color: NAVY },
      { name: "Non-Teaching", value: counts["Non-Teaching"], color: AMBER_PRIMARY },
    ];
  }, [filteredEmployees]);

  // 2. Employment Tenure (Regular, Probationary, Contractual, Part-Time)
  const tenureData = useMemo(() => {
    const map = {};
    filteredEmployees.forEach((e) => {
      const key = e.employment_tenure || "Regular";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], idx) => ({
      name,
      value,
      color: [NAVY, BLUE_MEDIUM, AMBER_PRIMARY, AMBER_LIGHT][idx % 4],
    }));
  }, [filteredEmployees]);

  // 3. Fulltime vs Parttime Status
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
      { name: "Part-Time", value: pt, color: AMBER_PRIMARY },
    ];
  }, [filteredEmployees]);

  // 4. Classification II (Executive, Academic Official, Administrative Official, Consultant)
  const classIIData = useMemo(() => {
    const map = {};
    filteredEmployees.forEach((e) => {
      const key = e.classification_ii || "Staff";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredEmployees]);

  // 5. Classification III (Resident, New, Rehired, Resigned, Retired)
  const classIIIData = useMemo(() => {
    const map = {};
    filteredEmployees.forEach((e) => {
      const key = e.classification_iii || "Resident";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], idx) => ({
      name,
      value,
      color: BLUE_YELLOW_GRADIENT[idx % BLUE_YELLOW_GRADIENT.length],
    }));
  }, [filteredEmployees]);

  // All chart objects definitions
  const allCharts = [
    {
      id: "class_i",
      category: "class_i",
      title: "Teaching vs. Non-Teaching Ratio",
      subtitle: "Classification I Breakdown",
      metricBadge: "+2.8% vs last week",
      metricPositive: true,
      component: (
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
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: "tenure",
      category: "tenure",
      title: "Employment Tenure Distribution",
      subtitle: "Regular, Probationary, Contractual, Part-Time",
      metricBadge: "+1.4% vs last week",
      metricPositive: true,
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tenureData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Personnel" fill={NAVY} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: "commitment",
      category: "tenure",
      title: "Full-Time vs. Part-Time Commitment",
      subtitle: "Active Employment Status Ratio",
      metricBadge: "-0.5% vs last week",
      metricPositive: false,
      component: (
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
      ),
    },
    {
      id: "class_ii",
      category: "class_ii",
      title: "Administrative & Official Roles",
      subtitle: "Classification II Breakdown",
      metricBadge: "+3.2% vs last week",
      metricPositive: true,
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={classIIData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fontWeight: 600 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Personnel" fill={AMBER_PRIMARY} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: "class_iii",
      category: "class_iii",
      title: "Staff Lifecycle Status",
      subtitle: "Classification III (Resident, New, Rehired)",
      metricBadge: "+0.8% vs last week",
      metricPositive: true,
      component: (
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
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
  ];

  // Filter displayed charts to MAX 4
  const displayedCharts = useMemo(() => {
    if (activeCategory === "all") {
      return allCharts.slice(0, 4);
    }
    const filtered = allCharts.filter((c) => c.category === activeCategory);
    if (filtered.length < 4) {
      const remaining = allCharts.filter((c) => c.category !== activeCategory);
      return [...filtered, ...remaining].slice(0, 4);
    }
    return filtered.slice(0, 4);
  }, [activeCategory, allCharts]);

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
      {/* Top Header Island Card - Clean Layout Without Left Header Text */}
      <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-3 px-4 shrink-0 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Department Filter */}
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-[190px] h-9 text-xs border-slate-200 rounded-lg bg-white shadow-none font-medium">
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

          {/* Time Range Selector for Dates */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 px-2.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-2xs font-bold text-slate-500 uppercase">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 outline-none border-none focus:ring-0"
            />
            <span className="text-2xs font-bold text-slate-500 uppercase ml-1">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 outline-none border-none focus:ring-0"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-2xs font-bold text-slate-400 hover:text-slate-600 ml-1 uppercase"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

      {/* Main Print Area */}
      <div ref={printRef} className="space-y-4">
        {/* Top 4 Summary KPI Cards with Sparklines & Comparative Weekly % */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Active Personnel</p>
                <h3 className="text-2xl font-black text-[#0C005F] mt-1">{activeCount}</h3>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold gap-1">
                <ArrowUpRight className="w-3 h-3" /> +2.4% <span className="text-slate-400 font-normal">/ wk</span>
              </Badge>
            </div>
            <div className="h-9 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiSparklines.active}>
                  <Line type="monotone" dataKey="val" stroke={NAVY} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Avg. Service Tenure</p>
                <h3 className="text-2xl font-black text-[#0C005F] mt-1">{avgTenure} <span className="text-sm font-bold text-slate-500">Yrs</span></h3>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold gap-1">
                <ArrowUpRight className="w-3 h-3" /> +1.2% <span className="text-slate-400 font-normal">/ wk</span>
              </Badge>
            </div>
            <div className="h-9 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiSparklines.tenure}>
                  <Line type="monotone" dataKey="val" stroke={AMBER_PRIMARY} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Leave Utilization</p>
                <h3 className="text-2xl font-black text-[#0C005F] mt-1">{leaveUtilizationRate}%</h3>
              </div>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold gap-1">
                <ArrowDownRight className="w-3 h-3" /> -0.8% <span className="text-slate-400 font-normal">/ wk</span>
              </Badge>
            </div>
            <div className="h-9 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiSparklines.leave}>
                  <Line type="monotone" dataKey="val" stroke={BLUE_MEDIUM} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Card 4 */}
          <Card className="shadow-none border border-slate-200 bg-white rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Pending Approvals</p>
                <h3 className="text-2xl font-black text-[#0C005F] mt-1">{pendingApprovalsCount}</h3>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold gap-1">
                <ArrowDownRight className="w-3 h-3" /> -4.1% <span className="text-slate-400 font-normal">/ wk</span>
              </Badge>
            </div>
            <div className="h-9 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiSparklines.pending}>
                  <Line type="monotone" dataKey="val" stroke={NAVY} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Section: Employment Information Analytics with Filter Buttons & Max 4 Charts */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
              Employment Information Analytics
            </h2>

            {/* Category Filter Buttons replacing old static badge */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/90 rounded-xl p-1 shrink-0 flex-wrap">
              {[
                { id: "all", label: "All Charts" },
                { id: "class_i", label: "Classification I" },
                { id: "class_ii", label: "Classification II" },
                { id: "class_iii", label: "Classification III" },
                { id: "tenure", label: "Tenure & Status" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setActiveCategory(btn.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeCategory === btn.id
                      ? "bg-[#0C005F] text-white shadow-sm"
                      : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2x2 Grid Limited to Max 4 Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedCharts.map((chart) => (
              <Card key={chart.id} className="shadow-none border border-slate-200 bg-white rounded-xl p-4">
                <CardHeader className="p-0 pb-3 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-[#0C005F]">{chart.title}</CardTitle>
                    <CardDescription className="text-xs text-slate-500">{chart.subtitle}</CardDescription>
                  </div>
                  {/* Comparative weekly percentage badge */}
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold gap-1 shrink-0 ${
                      chart.metricPositive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {chart.metricPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {chart.metricBadge}
                  </Badge>
                </CardHeader>
                <CardContent className="p-0 h-[240px]">
                  {chart.component}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
