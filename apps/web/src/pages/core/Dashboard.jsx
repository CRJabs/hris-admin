import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="p-8 max-w-[1440px] mx-auto animate-in fade-in duration-700">
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0C005F] rounded-full animate-spin"></div>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-800">Analytics Dashboard</h2>
            <p className="text-slate-500 max-w-sm">
              We are currently refining the analytics metrics with the client. Content will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}