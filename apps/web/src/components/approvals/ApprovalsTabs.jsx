import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { FileText, UserPlus, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ApprovalsTabs({ counts }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/').pop() || "updates";

  return (
    <Tabs value={activeTab} onValueChange={(val) => navigate(`/approvals/${val}`)} className="shrink-0 w-full sm:w-auto overflow-x-auto">
      <TabsList className="bg-transparent p-0 h-10 w-full justify-start gap-2">
        <TabsTrigger 
          value="updates" 
          className="gap-2 px-4 h-10 border bg-white data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:border-[#0C005F] rounded-md shadow-sm"
        >
          <FileText className="w-4 h-4" /> 
          <span className="hidden lg:inline">Profile Updates</span>
          <span className="lg:hidden">Updates</span>
          {counts?.updates > 0 && (
            <Badge className="ml-1 bg-black/10 data-[state=active]:bg-white/20 text-current hover:bg-black/20 border-none shadow-none">
              {counts.updates}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="registrations" 
          className="gap-2 px-4 h-10 border bg-white data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:border-[#0C005F] rounded-md shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> 
          <span className="hidden lg:inline">New Registrations</span>
          <span className="lg:hidden">Registrations</span>
          {counts?.registrations > 0 && (
            <Badge className="ml-1 bg-black/10 data-[state=active]:bg-white/20 text-current hover:bg-black/20 border-none shadow-none">
              {counts.registrations}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="leaves" 
          className="gap-2 px-4 h-10 border bg-white data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:border-[#0C005F] rounded-md shadow-sm"
        >
          <CalendarDays className="w-4 h-4" /> 
          <span className="hidden lg:inline">Leave Applications</span>
          <span className="lg:hidden">Leaves</span>
          {counts?.leaves > 0 && (
            <Badge className="ml-1 bg-black/10 data-[state=active]:bg-white/20 text-current hover:bg-black/20 border-none shadow-none">
              {counts.leaves}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
