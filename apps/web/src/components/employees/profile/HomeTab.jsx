import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, Briefcase, Calendar, Award, BookOpen, 
  ChevronRight, Star, Clock, ShieldCheck, TrendingUp,
  FileText, Activity, Heart, CheckCircle
} from "lucide-react";
import { format } from "date-fns";

export default function HomeTab({ employee, onViewProfile, notifications = [], leaveCredits = [] }) {
  const today = new Date();

  // Use DB credits if available, otherwise fallback to the derived logic for initial state
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
  
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C005F] via-[#1a106d] to-[#0C005F] p-10 text-white shadow-xl min-h-[350px] flex items-center">
        <div className="relative z-10 w-full flex flex-col md:flex-row items-center gap-10">
          <Avatar className="w-56 h-56 border-4 border-white/20 shadow-2xl">
            {employee.photo_url && (
              <AvatarImage src={employee.photo_url} alt={employee.first_name} className="object-cover" />
            )}
            <AvatarFallback className="text-4xl bg-white/10 text-white font-black">
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-2">Welcome Back,</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-4">
                {employee.first_name} {employee.last_name}
                <Badge className={`${employee.is_active !== false ? 'bg-green-500' : 'bg-red-500'} text-white border-none px-3 py-1`}>
                  {employee.is_active !== false ? 'Active' : 'Inactive'}
                </Badge>
              </h2>
              <p className="text-white/70 mt-4 max-w-xl text-lg leading-relaxed font-medium">
                Management of your personnel records and professional growth. Your digital 201 form is up to date as of {format(today, "MMMM d, yyyy")}.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 text-center min-w-[240px]">
              <p className="text-white/60 text-xs uppercase font-bold tracking-widest mb-1">Employee ID</p>
              <p className="text-3xl font-black tracking-tighter">{employee.employee_id || "PENDING"}</p>
              <div className="h-px bg-white/20 my-4" />
              <p className="text-white/60 text-xs uppercase font-bold tracking-widest mb-1">Department</p>
              <p className="text-lg font-bold truncate">{employee.department || "General Administration"}</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full -ml-48 -mb-48 blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <Card className="shadow-sm border-slate-300 hover:shadow-md transition-shadow">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#0C005F]" /> Employment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="mt-2">
                <p className="text-lg font-bold text-slate-800">{employee.position || "Staff Member"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Status: <span className={`${
                    employee.employment_status === 'Probationary' ? 'text-amber-500' : 
                    employee.employment_status === 'Contractual' ? 'text-blue-500' : 
                    'text-green-500'
                  } font-semibold`}>
                    {employee.employment_status || "Regular"}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-4 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" /> Hired on {employee.date_hired ? format(new Date(employee.date_hired), "MMM d, yyyy") : "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-300 hover:shadow-md transition-shadow">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0C005F]" /> Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="mt-2 flex flex-col h-full justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-800">Verified Personnel</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">Authorized digital signature on file.</p>
                </div>
                <div className="mt-4 flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Leave Credits */}
        <Card className="shadow-sm border-slate-300 flex flex-col h-[340px]">
          <CardHeader className="p-5 pb-2 border-b shrink-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" /> Leave Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
               <div className="space-y-4">
                  {displayCredits.map((leave) => (
                    <div key={leave.type} className="p-4 bg-slate-50 border rounded-2xl space-y-3">
                       <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-700">{leave.type}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Available: {leave.total - leave.used}</p>
                       </div>
                       <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
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

        {/* Notifications / Side Info */}
        <div className="space-y-4">
          <Card className="shadow-sm border-slate-300 bg-slate-50/50 flex flex-col h-[276px]">
            <CardHeader className="p-5 pb-2 border-b shrink-0">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> System Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <p className={`text-[10px] font-bold uppercase ${
                          notif.type === 'approved' ? 'text-green-600' :
                          notif.type === 'rejected' ? 'text-red-600' :
                          notif.type === 'expired' ? 'text-red-600' :
                          notif.type === 'expiring' ? 'text-amber-600' :
                          notif.type === 'info' ? 'text-blue-600' : 'text-primary'
                        }`}>
                          {notif.title}
                        </p>
                        <p className="text-xs font-semibold">{notif.description}</p>
                        <p className="text-[9px] text-muted-foreground">
                          {notif.date && !isNaN(notif.date) ? format(notif.date, "MMMM d, yyyy") : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <p className="text-xs italic">No new announcements at this time.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Button 
            variant="outline" 
            className="w-full justify-between h-12 rounded-xl group hover:border-[#0C005F] hover:bg-slate-50"
            onClick={onViewProfile}
          >
             <span className="flex items-center gap-2 font-bold text-sm">
                <FileText className="w-4 h-4 text-slate-400 group-hover:text-[#0C005F]" />
                View full personal information here
             </span>
             <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0C005F]" />
          </Button>
        </div>
      </div>
    </div>
  );
}

