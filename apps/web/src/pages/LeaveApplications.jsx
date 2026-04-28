import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Info } from "lucide-react";

export default function LeaveApplications() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-8 h-8 text-[#0C005F]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0C005F]">Leave Applications</h1>
          <p className="text-sm text-muted-foreground">Monitor and process employee leave requests</p>
        </div>
      </div>

      <Card className="border-dashed border-2 bg-slate-50/50 mt-8">
        <CardContent className="flex flex-col items-center justify-center p-20 text-center text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
            <Info className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Under Development</h2>
          <p className="max-w-md text-sm leading-relaxed">
            The Leave Applications management module is currently being finalized in discussion with the client. 
            Soon, you will be able to review, approve, or reject leave requests from this central dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
