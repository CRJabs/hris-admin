import { Bell, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function ActivityTabs({ active = "activity", binCount = 0, activityCount = 0, unreadCount = 0 }) {
  return (
    <div className="flex">
      <Link
        to="/activity"
        className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition-all ${
          active === "activity"
            ? "border-[#0C005F] text-[#0C005F]"
            : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
        }`}
      >
        <Bell className="w-4 h-4" />
        <span>Activity</span>
        {activityCount > 0 && (
          <span className="text-[11px] text-slate-400 font-normal ml-1">
            ({activityCount} total &bull; <span className="text-red-500 font-semibold">{unreadCount} unread</span>)
          </span>
        )}
      </Link>
      <Link
        to="/activity/bin"
        className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition-all relative ${
          active === "bin"
            ? "border-[#0C005F] text-[#0C005F]"
            : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
        }`}
      >
        <Trash2 className="w-4 h-4" />
        Bin
        {binCount > 0 && (
          <Badge
            variant="secondary"
            className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold ${
              active === "bin"
                ? "bg-[#0C005F] text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {binCount}
          </Badge>
        )}
      </Link>
    </div>
  );
}
