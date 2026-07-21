import { Bell, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function ActivityTabs({ active = "activity", binCount = 0, activityCount = 0, unreadCount = 0 }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Link
        to="/activity"
        className={`flex items-center gap-2 px-6 h-9 text-xs font-bold rounded-lg transition-all ${
          active === "activity"
            ? "bg-[#0C005F] text-white shadow-none"
            : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-none"
        }`}
      >
        <Bell className="w-3.5 h-3.5" />
        <span>Activity</span>
        {activityCount > 0 && (
          <span className={`text-2xs font-bold ml-0.5 ${active === "activity" ? "text-blue-200" : "text-slate-400"}`}>
            ({activityCount} total &bull; <span className={active === "activity" ? "text-amber-300 font-bold" : "text-amber-600 font-bold"}>{unreadCount} unread</span>)
          </span>
        )}
      </Link>
      <Link
        to="/activity/bin"
        className={`flex items-center gap-2 px-6 h-9 text-xs font-bold rounded-lg transition-all ${
          active === "bin"
            ? "bg-[#0C005F] text-white shadow-none"
            : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-none"
        }`}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Bin</span>
        {binCount > 0 && (
          <Badge
            variant="secondary"
            className={`ml-0.5 px-1.5 py-0 text-[10px] font-bold ${
              active === "bin"
                ? "bg-amber-400 text-slate-950"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            {binCount}
          </Badge>
        )}
      </Link>
    </div>
  );
}
