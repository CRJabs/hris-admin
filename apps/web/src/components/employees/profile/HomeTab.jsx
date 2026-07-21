import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Crown } from "lucide-react";
import { format, differenceInMonths, differenceInYears } from "date-fns";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function HomeTab({ employee, leaveCredits = [], leaveApplications = [], headOfUnit = null }) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [deptLogoUrl, setDeptLogoUrl] = useState(null);

  useEffect(() => {
    async function loadDeptLogo() {
      if (employee?.department) {
        try {
          const { data: deptData } = await supabase
            .from("departments")
            .select("logo_url")
            .ilike("name", employee.department.trim())
            .maybeSingle();
          if (deptData?.logo_url) {
            setDeptLogoUrl(deptData.logo_url);
          }
        } catch (err) {
          console.error("Error fetching dept logo", err);
        }
      }
    }
    loadDeptLogo();
  }, [employee?.department]);

  // Executive office check (University President & Vice Presidents show default ub.png)
  const posOrDept = `${employee?.position || ''} ${employee?.department || ''}`.toLowerCase();
  const isExecutiveOffice = 
    posOrDept.includes("president") || 
    posOrDept.includes("vice president") || 
    posOrDept.includes("vp") || 
    posOrDept.includes("executive office") ||
    headOfUnit?.isPresident;

  const displayLogoUrl = isExecutiveOffice ? '/assets/ub.png' : (deptLogoUrl || '/assets/ub.png');

  // Check if employee is currently on leave
  const activeLeave = leaveApplications.find(app => 
    app.status === 'approved' && 
    app.start_date <= todayStr && 
    app.end_date >= todayStr
  );

  const displayCredits = leaveCredits.length > 0 
    ? leaveCredits.map(c => ({
        type: `${c.leave_type} Leave${c.is_commutable ? ' (Comm)' : ' (Non-Comm)'}`,
        total: parseFloat(c.total_credits),
        used: parseFloat(c.used_credits),
        color: c.leave_type === 'Vacation' ? 'bg-blue-500' :
               c.leave_type === 'Sick' ? 'bg-rose-500' :
               c.leave_type === 'Family' ? 'bg-emerald-500' :
               c.leave_type === 'Force' ? 'bg-amber-500' : 'bg-slate-500'
      }))
    : (employee.classification === "Teaching" ? [
        { type: 'Vacation Leave', total: 7, used: 2, color: 'bg-blue-500' },
        { type: 'Family Leave', total: 4, used: 1, color: 'bg-emerald-500' },
      ] : [
        { type: 'Vacation Leave (Comm)', total: 10, used: 3, color: 'bg-blue-500' },
        { type: 'Vacation Leave (Non-Comm)', total: 5, used: 0, color: 'bg-cyan-500' },
        { type: 'Family Leave', total: 4, used: 0, color: 'bg-emerald-500' },
      ]).concat([
        { type: 'Sick Leave', total: 15, used: 5, color: 'bg-rose-500' },
        { type: 'Bereavement Leave', total: 3, used: 0, color: 'bg-slate-500' },
        { type: 'Force Leave (Comm)', total: 5, used: 0, color: 'bg-amber-500' },
        { type: 'Force Leave (Non-Comm)', total: 5, used: 0, color: 'bg-orange-500' },
      ]);

  const getTenureLength = (hireDate) => {
    if (!hireDate) return "N/A";
    const start = new Date(hireDate);
    const years = differenceInYears(today, start);
    const months = differenceInMonths(today, start) % 12;
    if (years === 0 && months === 0) return "Less than a month";
    const yStr = years > 0 ? `${years} yr${years > 1 ? 's' : ''}` : '';
    const mStr = months > 0 ? `${months} mo${months > 1 ? 's' : ''}` : '';
    return [yStr, mStr].filter(Boolean).join(' ');
  };

  return (
    <div className="h-full flex flex-col space-y-4 justify-between animate-in fade-in duration-500 overflow-hidden">
      {/* Welcome Section Banner - flex-1 expands height so bottom cards sit 16px from screen bottom */}
      <div className="relative overflow-hidden rounded-[8px] bg-gradient-to-br from-[#0C005F] via-[#1a106d] to-[#0C005F] p-6 md:p-8 text-white border border-slate-200 shadow-none flex-1 min-h-[220px] flex items-center shrink-0">
        <div className="relative z-10 w-full flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <Avatar className="w-36 h-36 md:w-44 md:h-44 border-4 border-white/20 shadow-none shrink-0">
            {employee.photo_url && (
              <AvatarImage src={employee.photo_url} alt={employee.first_name} className="object-cover" />
            )}
            <AvatarFallback className="text-3xl bg-white/10 text-white font-black">
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1.5">Welcome Back,</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3 flex-wrap">
                {employee.first_name} {employee.last_name}
                {headOfUnit?.isPresident ? (
                  <Badge className="bg-amber-500 text-white border-none px-2.5 py-0.5 gap-1 text-xs rounded-[6px]">
                    <Crown className="w-3 h-3" /> University President
                  </Badge>
                ) : headOfUnit ? (
                  <Badge className="bg-indigo-600 text-white border-none px-2.5 py-0.5 gap-1 text-xs rounded-[6px]">
                    <Crown className="w-3 h-3" /> Head – {headOfUnit.name}
                  </Badge>
                ) : null}
                {activeLeave ? (
                  <Badge className="bg-amber-500 text-white border-none px-2.5 py-0.5 text-xs rounded-[6px] animate-pulse">
                    On Leave
                  </Badge>
                ) : (
                  <Badge className={`${employee.is_active !== false ? 'bg-green-500' : 'bg-red-500'} text-white border-none px-2.5 py-0.5 text-xs rounded-[6px]`}>
                    {employee.is_active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </h2>
              {activeLeave && (
                <p className="text-amber-200/90 mt-2 max-w-xl text-base leading-relaxed font-medium">
                  On {activeLeave.leave_type} Leave · {format(new Date(activeLeave.start_date + "T00:00:00"), "MMM d")} – {format(new Date(activeLeave.end_date + "T00:00:00"), "MMM d, yyyy")}
                </p>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-[8px] p-6 border border-white/10 text-center min-w-[200px] shrink-0 flex flex-col items-center">
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">Employee ID</p>
              <p className="text-2xl font-black tracking-tight">{employee.employee_id || "PENDING"}</p>
              <div className="h-px bg-white/20 my-3 w-full" />
              {displayLogoUrl && (
                <img src={displayLogoUrl} alt="Department Logo" className="w-12 h-12 object-contain rounded-full mb-1.5 border border-white/20" />
              )}
              <p className="text-base font-bold truncate max-w-[180px]">{employee.department || "General Administration"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid with fixed card height (h-[420px]) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch shrink-0">
        {/* Left Column: Employment Card */}
        <Card className="border border-slate-200 rounded-[8px] bg-white shadow-none flex flex-col h-[420px] overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-700">
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto text-xs flex flex-col justify-between">
            {/* Position & Department section (department logo removed as per image #3) */}
            <div className="space-y-0.5 min-w-0 py-2 px-1">
              <p className="text-base md:text-lg font-black text-slate-900 leading-tight">
                {employee.position || "Staff Member"}
              </p>
              <p className="text-xs md:text-sm font-semibold text-slate-600 truncate">
                {employee.department || "General Administration"}
              </p>
            </div>

            {/* Employment Status & Tenure */}
            <div className="grid grid-cols-2 gap-3 py-3 px-1 border-t border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Employment Status</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">{employee.employment_status || "Fulltime"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tenure</p>
                <p className={`text-xs font-semibold mt-1 ${
                  employee.employment_tenure === 'Probationary' ? 'text-amber-600' :
                  employee.employment_tenure === 'Contractual' ? 'text-blue-600' : 'text-emerald-600'
                }`}>
                  {employee.employment_tenure || "Regular"}
                </p>
              </div>
            </div>

            {/* Classification I, II, III */}
            <div className="grid grid-cols-3 gap-2 py-3 px-1 border-t border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Classification I</p>
                <p className="text-xs font-semibold text-slate-800 mt-1 truncate">{employee.employment_classification || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Classification II</p>
                <p className="text-xs font-semibold text-slate-800 mt-1 truncate">{employee.classification_ii || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Classification III</p>
                <p className="text-xs font-semibold text-slate-800 mt-1 truncate">{employee.classification_iii || "—"}</p>
              </div>
            </div>

            {/* Hire date and length of service section */}
            <div className="flex items-center justify-between py-3 px-1 border-t border-slate-100 text-slate-600">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Hired on {employee.date_hired ? format(new Date(employee.date_hired), "MMM d, yyyy") : "N/A"}</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 border-slate-200 bg-slate-50 rounded-[4px] px-2 py-0.5">
                Service: {getTenureLength(employee.date_hired)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Leave Credits Card */}
        <Card className="border border-slate-200 rounded-[8px] bg-white shadow-none flex flex-col h-[420px] overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-700">
              Leave Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 min-h-0 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 h-full pr-3">
              <div className="space-y-3">
                {displayCredits.map((leave) => (
                  <div key={leave.type} className="p-3 bg-slate-50 border border-slate-200 rounded-[8px] space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-700">{leave.type}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Available: {leave.total - leave.used}</p>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`${leave.color} h-full transition-all duration-1000`} 
                        style={{ width: `${leave.total > 0 ? (leave.used / leave.total) * 100 : 0}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase">
                      <span>Used: {leave.used}</span>
                      <span>Total: {leave.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
