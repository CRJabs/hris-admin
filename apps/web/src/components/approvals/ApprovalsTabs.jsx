import { useRef } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  FileText, UserPlus, CalendarDays, RefreshCw, LogOut, 
  Award, ChevronLeft, ChevronRight, Search, Filter 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

export default function ApprovalsTabs({ counts, searchQuery, setSearchQuery, statusFilter, setStatusFilter }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/').pop() || "updates";
  const scrollRef = useRef(null);

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-3 w-full max-w-[1440px] mx-auto select-none">
      <div className="flex items-stretch border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden h-12 flex-1 min-w-0">
        {/* Left scroll button */}
        <button
          type="button"
          onClick={() => scrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
          className="flex items-center justify-center px-3 shrink-0 text-slate-400 hover:text-[#0C005F] hover:bg-slate-50 border-r border-slate-200 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable container for Tabs */}
        <div
          ref={scrollRef}
          className="flex items-center overflow-x-auto flex-1 px-3 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <Tabs value={activeTab} onValueChange={(val) => navigate(`/approvals/${val}`)} className="w-full">
            <TabsList className="bg-transparent p-0 h-8 justify-start gap-2 flex flex-row border-none shadow-none">
              <TabsTrigger 
                value="updates" 
                className="gap-2 px-3.5 h-8 border bg-white text-xs font-semibold text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:border-[#0C005F] rounded-lg shadow-sm shrink-0 whitespace-nowrap border-slate-200"
              >
                <FileText className="w-3.5 h-3.5" /> 
                <span className="hidden lg:inline">Profile Updates</span>
                <span className="lg:hidden">Updates</span>
                {counts?.updates > 0 && (
                  <Badge className="ml-1 bg-black/10 data-[state=active]:bg-white/20 text-current hover:bg-black/20 border-none shadow-none text-[10px] px-1.5 py-0 h-4">
                    {counts.updates}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="registrations" 
                className="gap-2 px-3.5 h-8 border bg-white text-xs font-semibold text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:border-[#0C005F] rounded-lg shadow-sm shrink-0 whitespace-nowrap border-slate-200"
              >
                <UserPlus className="w-3.5 h-3.5" /> 
                <span className="hidden lg:inline">New Registrations</span>
                <span className="lg:hidden">Registrations</span>
                {counts?.registrations > 0 && (
                  <Badge className="ml-1 bg-black/10 data-[state=active]:bg-white/20 text-current hover:bg-black/20 border-none shadow-none text-[10px] px-1.5 py-0 h-4">
                    {counts.registrations}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="leaves" 
                className="gap-2 px-3.5 h-8 border bg-white text-xs font-semibold text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:border-[#0C005F] rounded-lg shadow-sm shrink-0 whitespace-nowrap border-slate-200"
              >
                <CalendarDays className="w-3.5 h-3.5" /> 
                <span className="hidden lg:inline">Leave Applications</span>
                <span className="lg:hidden">Leaves</span>
                {counts?.leaves > 0 && (
                  <Badge className="ml-1 bg-black/10 data-[state=active]:bg-white/20 text-current hover:bg-black/20 border-none shadow-none text-[10px] px-1.5 py-0 h-4">
                    {counts.leaves}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="commutations" 
                className="gap-2 px-3.5 h-8 border bg-white text-xs font-semibold text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:border-[#0C005F] rounded-lg shadow-sm shrink-0 whitespace-nowrap border-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 
                <span className="hidden lg:inline">Commutations</span>
                <span className="lg:hidden">Commutations</span>
                {counts?.commutations > 0 && (
                  <Badge className="ml-1 bg-black/10 data-[state=active]:bg-white/20 text-current hover:bg-black/20 border-none shadow-none text-[10px] px-1.5 py-0 h-4">
                    {counts.commutations}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="resignations" 
                className="gap-2 px-3.5 h-8 border bg-white text-xs font-semibold text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:border-[#0C005F] rounded-lg shadow-sm shrink-0 whitespace-nowrap border-slate-200"
              >
                <LogOut className="w-3.5 h-3.5" /> 
                <span className="hidden lg:inline">Resignations</span>
                <span className="lg:hidden">Resignations</span>
                {counts?.resignations > 0 && (
                  <Badge className="ml-1 bg-black/10 data-[state=active]:bg-white/20 text-current hover:bg-black/20 border-none shadow-none text-[10px] px-1.5 py-0 h-4">
                    {counts.resignations}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="retirements" 
                className="gap-2 px-3.5 h-8 border bg-white text-xs font-semibold text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:border-[#0C005F] rounded-lg shadow-sm shrink-0 whitespace-nowrap border-slate-200"
              >
                <Award className="w-3.5 h-3.5" /> 
                <span className="hidden lg:inline">Retirements</span>
                <span className="lg:hidden">Retirements</span>
                {counts?.retirements > 0 && (
                  <Badge className="ml-1 bg-black/10 data-[state=active]:bg-white/20 text-current hover:bg-black/20 border-none shadow-none text-[10px] px-1.5 py-0 h-4">
                    {counts.retirements}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Right scroll button */}
        <button
          type="button"
          onClick={() => scrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
          className="flex items-center justify-center px-3 shrink-0 text-slate-400 hover:text-[#0C005F] hover:bg-slate-50 border-l border-slate-200 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input & Filter Button section */}
      <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden h-12 px-3 shrink-0 w-full md:w-[420px]">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search pending requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 h-8 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0C005F] focus:border-[#0C005F] placeholder-slate-400 text-slate-700"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-8 bg-slate-50 border-slate-200 text-xs font-bold rounded-lg shrink-0 text-slate-700">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem className="text-xs font-semibold" value="all">All Statuses</SelectItem>
            <SelectItem className="text-xs font-semibold" value="pending">Pending</SelectItem>
            <SelectItem className="text-xs font-semibold" value="approved">Approved</SelectItem>
            <SelectItem className="text-xs font-semibold" value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
