import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Award, Calendar } from "lucide-react";

const alerts = [
  {
    icon: AlertTriangle,
    title: "License Expiring Soon",
    description: "Carlo Reyes — PRC IE license expires Dec 31, 2025",
    badge: "Urgent",
    badgeVariant: "destructive",
    time: "Action needed"
  },
  {
    icon: Clock,
    title: "Probation Period Ending",
    description: "Ana Garcia — 6-month probationary review due Jul 6, 2025",
    badge: "Reminder",
    badgeVariant: "outline",
    time: "106 days left"
  },
  {
    icon: Clock,
    title: "Regularization Due",
    description: "Rafael Aquino — regularization pending on Aug 1, 2025",
    badge: "Reminder",
    badgeVariant: "outline",
    time: "132 days left"
  },
  {
    icon: Calendar,
    title: "Contract Ending",
    description: "Roberto Villanueva — 6-month contract expires Sep 1, 2025",
    badge: "Action",
    badgeVariant: "secondary",
    time: "163 days left"
  },
  {
    icon: Award,
    title: "3 Years Bonus Eligibility",
    description: "Liza Mendoza — eligible for 3 Years Bonus on Aug 1, 2025",
    badge: "Payroll",
    badgeVariant: "secondary",
    time: "Upcoming"
  },
  {
    icon: Calendar,
    title: "Birthday This Week",
    description: "Juan Dela Cruz — March 15 (Senior Software Engineer)",
    badge: "Social",
    badgeVariant: "outline",
    time: "This week"
  },
];

export default function AlertsWidget() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Alerts & Notifications</CardTitle>
          <Badge variant="secondary" className="text-xs">{alerts.length} Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 max-h-95 overflow-y-auto">
        {alerts.map((alert, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <alert.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{alert.title}</p>
                <Badge variant={alert.badgeVariant} className="text-[10px] px-1.5 py-0 shrink-0">{alert.badge}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.description}</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">{alert.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}