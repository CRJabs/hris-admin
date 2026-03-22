import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp }) {
  return (
    <Card className="p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-1.5 text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              trendUp ? "text-green-600" : "text-red-500"
            )}>
              <span>{trendUp ? "↑" : "↓"} {trend}</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-primary/20 to-primary/5 group-hover:from-primary/40 group-hover:to-primary/10 transition-all" />
    </Card>
  );
}