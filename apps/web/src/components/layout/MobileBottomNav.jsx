import { Link, useLocation } from "react-router-dom";
import {
  Zap, BarChart3, Building2, CheckSquare,
  Users, CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { label: "Home",      icon: Zap,          path: "/" },
  { label: "Approvals", icon: CheckSquare,  path: "/approvals" },
  { label: "Employees", icon: Users,        path: "/employees" },
  { label: "Leaves",    icon: CalendarDays, path: "/leaves/assign" },
  { label: "Company",   icon: Building2,    path: "/company" },
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <div
      className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      style={{ filter: "drop-shadow(0 8px 24px rgba(12,0,95,0.35))" }}
    >
      <nav className="flex items-center gap-1 bg-[#0C005F] rounded-full px-3 py-2.5">
        {mobileNavItems.map(({ label, icon: Icon, path }) => {
          const isActive =
            path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(path);

          return (
            <Link
              key={path}
              to={path}
              title={label}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-10 rounded-full transition-all duration-200 relative",
                isActive
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-white" : "text-white/55"
                )}
              />
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-white/80" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
