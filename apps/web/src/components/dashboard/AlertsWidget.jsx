import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Award, Calendar, UserPlus, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export default function AlertsWidget() {
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      const { data: updateData, error: updateError } = await supabase
        .from('employee_update_requests')
        .select(`*, employees ( first_name, last_name )`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const { data: regData, error: regError } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'Pending');

      let notifs = [];
      if (!updateError && updateData) {
        notifs = [...notifs, ...updateData.map(req => ({
          id: `req_${req.id}`,
          icon: RefreshCw,
          title: "Profile Update Request",
          description: `${req.employees?.first_name} ${req.employees?.last_name} requested a profile information update.`,
          badge: "Action",
          badgeVariant: "destructive",
          time: new Date(req.created_at || new Date()),
          action: () => navigate('/approvals', { state: { requestId: req.id, type: 'update' } })
        }))];
      }

      if (!regError && regData) {
        notifs = [...notifs, ...regData.map(emp => ({
          id: `reg_${emp.id}`,
          icon: UserPlus,
          title: "New Registration",
          description: `${emp.first_name} ${emp.last_name} submitted a registration`,
          badge: "Pending",
          badgeVariant: "secondary",
          time: new Date(emp.created_at || new Date()),
          action: () => navigate('/approvals')
        }))];
      }

      notifs.sort((a, b) => b.time - a.time);
      setAlerts(notifs);

    } catch (err) {
      console.error("Error fetching alerts", err);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const reqSub = supabase.channel('requests_changes_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_update_requests' }, fetchAlerts)
      .subscribe();

    const empSub = supabase.channel('employees_changes_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchAlerts)
      .subscribe();

    // Fallback refresh to keep panel up-to-date even if realtime transport drops.
    const intervalId = setInterval(fetchAlerts, 10000);
    const handleWindowFocus = () => fetchAlerts();
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleWindowFocus);

    return () => {
      reqSub.unsubscribe();
      empSub.unsubscribe();
      clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleWindowFocus);
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Alerts & Notifications</CardTitle>
          <Badge variant="secondary" className="text-xs">{alerts.length} Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 max-h-95 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No active alerts or notifications
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div key={alert.id} onClick={alert.action} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <alert.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{alert.title}</p>
                  <Badge variant={alert.badgeVariant} className="text-[10px] px-1.5 py-0 shrink-0">{alert.badge}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.description}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  {formatDistanceToNow(alert.time, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}