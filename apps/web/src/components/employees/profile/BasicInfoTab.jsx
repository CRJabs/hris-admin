import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Briefcase, MapPin, Phone, Mail, Calendar, Heart, User } from "lucide-react";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function BasicInfoTab({ employee, onToggleActive }) {
  const statusColor = {
    Regular: "bg-green-50 text-green-700 border-green-200",
    Probationary: "bg-amber-50 text-amber-700 border-amber-200",
    Contractual: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Card */}
      <div className="bg-muted/30 rounded-xl p-6 text-center">
        <Avatar className="w-24 h-24 mx-auto ring-4 ring-primary/10">
          <AvatarImage src={employee.photo_url} alt={employee.first_name} />
          <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
            {employee.first_name?.[0]}{employee.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-bold mt-4">{employee.first_name} {employee.middle_name?.[0]}. {employee.last_name}</h3>
        <p className="text-sm text-muted-foreground">{employee.position}</p>
        <Badge variant="outline" className={`mt-2 ${statusColor[employee.employment_status]}`}>
          {employee.employment_status}
        </Badge>

        <div className="mt-5 pt-5 border-t border-border">
          <div className="flex items-center justify-between">
            <Label htmlFor="active-toggle" className="text-sm font-medium">
              {employee.is_active ? "Active" : "Inactive"}
            </Label>
            <Switch
              id="active-toggle"
              checked={employee.is_active}
              onCheckedChange={() => onToggleActive(employee)}
            />
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-foreground mb-3">Personal Information</h4>
        <InfoRow icon={User} label="Employee ID" value={employee.employee_id} />
        <InfoRow icon={User} label="Gender" value={employee.gender} />
        <InfoRow icon={Calendar} label="Date of Birth" value={employee.birthdate ? format(new Date(employee.birthdate), "MMMM d, yyyy") : "—"} />
        <InfoRow icon={Heart} label="Civil Status" value={employee.civil_status} />
        <InfoRow icon={MapPin} label="Address" value={employee.address} />
        <InfoRow icon={Phone} label="Phone" value={employee.phone} />
        <InfoRow icon={Mail} label="Email" value={employee.email} />
      </div>

      {/* Employment Details + Timeline */}
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Employment Details</h4>
          <InfoRow icon={Briefcase} label="Department" value={employee.department} />
          <InfoRow icon={Calendar} label="Date Hired" value={employee.date_hired ? format(new Date(employee.date_hired), "MMMM d, yyyy") : "—"} />
          <InfoRow icon={Calendar} label="Regularization Date" value={employee.regularization_date ? format(new Date(employee.regularization_date), "MMMM d, yyyy") : "N/A"} />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Employment History</h4>
          <div className="space-y-0">
            {(employee.employment_history || []).map((item, i) => (
              <div key={i} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  {i < (employee.employment_history?.length || 0) - 1 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                  <p className="text-sm font-medium">{item.event}</p>
                  <p className="text-xs text-muted-foreground">{item.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}