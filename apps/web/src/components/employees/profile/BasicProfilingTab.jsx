import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { User, Heart, MapPin, Phone, Mail, Calendar, Briefcase, Plus, Users, Shield, Globe, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SectionBlock({ title, icon: Icon, children, action }) {
  return (
    <Card className="shadow-none border-muted">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          {title}
        </CardTitle>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {children}
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value, className = "" }) {
  return (
    <div className={`py-1.5 ${className}`}>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}

export default function BasicProfilingTab({ employee, onToggleActive, isReadOnly = false }) {
  const statusColor = {
    Regular: "bg-green-50 text-green-700 border-green-200",
    Probationary: "bg-amber-50 text-amber-700 border-amber-200",
    Contractual: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Profile Overview Card */}
      <div className="xl:col-span-1 space-y-6">
        <Card className="shadow-none border-muted bg-muted/30 text-center">
          <CardContent className="p-6">
            <Avatar className="w-32 h-32 mx-auto ring-4 ring-primary/10 mb-4">
              <AvatarImage src={employee.photo_url} alt={employee.first_name} className="object-cover" />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{employee.first_name} {employee.middle_name?.[0] ? employee.middle_name[0] + "." : ""} {employee.last_name}</h3>
            <p className="text-sm text-muted-foreground mb-2">Emp ID: {employee.employee_id || "Year-001"}</p>
            <Badge variant="outline" className={`mb-4 ${statusColor[employee.employment_status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
              {employee.employment_status || "Regular"}
            </Badge>
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <Label htmlFor="active-toggle" className="text-sm font-medium flex items-center gap-2">
                Status: {employee.is_active ? <span className="text-green-600">Active</span> : <span className="text-red-500">Inactive</span>}
              </Label>
              {!isReadOnly && (
                <Switch
                  id="active-toggle"
                  checked={employee.is_active}
                  onCheckedChange={() => onToggleActive(employee)}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benefits/Tax ID */}
        <SectionBlock title="Benefits & Tax IDs" icon={Shield}>
          <div className="space-y-2">
            <InfoRow label="SSS Number" value="—" />
            <InfoRow label="TIN" value="—" />
            <InfoRow label="Philhealth" value="—" />
            <InfoRow label="Pag-ibig" value="—" />
            <InfoRow label="PERAA" value="—" />
            <InfoRow label="Tax Status" value="Single" />
          </div>
        </SectionBlock>
      </div>

      {/* Main Profiling Content */}
      <div className="xl:col-span-2 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Data */}
          <SectionBlock title="Personal Data" icon={User}>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Gender" value={employee.gender} />
              <InfoRow label="Age" value="—" />
              <InfoRow label="Birth Date" value={employee.birthdate ? format(new Date(employee.birthdate), "MM/dd/yyyy") : "—"} />
              <InfoRow label="Religion" value="—" />
              <InfoRow label="Civil Status" value={employee.civil_status} />
              <InfoRow label="Nationality" value="Filipino" />
              <InfoRow label="Place of Birth" value="—" className="col-span-2" />
            </div>
          </SectionBlock>

          {/* Physical Description */}
          <SectionBlock title="Physical Description" icon={User}>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Height (cm)" value="—" />
              <InfoRow label="Weight (lbs)" value="—" />
              <InfoRow label="Blood Type" value="—" />
              <InfoRow label="Distinguishing Marks" value="—" className="col-span-2" />
            </div>
          </SectionBlock>
        </div>

        {/* Parents Information */}
        <SectionBlock title="Parents Information" icon={Users}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground border-b pb-1 mb-2">Father's Details</h4>
              <InfoRow label="Name" value="—" />
              <InfoRow label="Occupation" value="—" />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" disabled className="rounded border-gray-300" />
                <span className="text-sm text-muted-foreground">Deceased</span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground border-b pb-1 mb-2">Mother's Details</h4>
              <InfoRow label="Name" value="—" />
              <InfoRow label="Occupation" value="—" />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" disabled className="rounded border-gray-300" />
                <span className="text-sm text-muted-foreground">Deceased</span>
              </div>
            </div>
          </div>
        </SectionBlock>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Contact Information */}
          <SectionBlock title="Contact Information" icon={Phone}>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground border-b pb-1 mb-2 mt-1">Permanent Address</h4>
              <InfoRow label="Street Address" value="—" />
              <InfoRow label="Barangay" value="—" />
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="City/Municipality" value="—" />
                <InfoRow label="State/Province" value="—" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Country" value="Philippines" />
                <InfoRow label="Zip Code" value="—" />
              </div>
              <InfoRow label="Email Address" value={employee.email} />
              <InfoRow label="Contact Nos" value={employee.phone} />
            </div>
          </SectionBlock>

          {/* Emergency Contact Information */}
          <SectionBlock title="Emergency Contact" icon={Heart}>
            <div className="space-y-2">
              <InfoRow label="Name" value="—" />
              <InfoRow label="Relation" value="—" />
              <InfoRow label="Mobile Number" value="—" />
              <InfoRow label="Home Number" value="—" />
              <InfoRow label="Office Number" value="—" />
              <InfoRow label="Address" value="—" />
            </div>
          </SectionBlock>
        </div>

        {/* Dependent's Information */}
        <SectionBlock 
          title="Dependent's Information" 
          icon={Users}
          action={!isReadOnly && <Button variant="ghost" size="sm" className="h-8 gap-1"><Plus className="w-3.5 h-3.5"/> Add</Button>}
        >
          <div className="text-sm text-muted-foreground italic py-4 text-center border rounded-md border-dashed">
            No dependents added yet.
          </div>
          {/* Example of how it would look with data */}
          {/* <div className="border rounded-md p-3 mb-3 bg-muted/20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <InfoRow label="Name" value="Jane Doe" />
               <InfoRow label="Relation" value="Spouse" />
               <InfoRow label="Date of Birth" value="01/01/1990" />
               <InfoRow label="Gender" value="Female" />
            </div>
            <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
               <InfoRow label="Employer" value="Company XYZ" />
               <InfoRow label="Position" value="Manager" />
               <InfoRow label="Employment Status" value="Full-time" />
            </div>
          </div> */}
        </SectionBlock>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Languages */}
          <SectionBlock title="Languages" icon={Globe}>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                   <tr>
                     <th className="px-3 py-2 font-medium">Language</th>
                     <th className="px-3 py-2 font-medium">Fluency</th>
                     <th className="px-3 py-2 font-medium">Skills</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2">English</td>
                      <td className="px-3 py-2">Fluent</td>
                      <td className="px-3 py-2">Read, Write, Speak</td>
                   </tr>
                 </tbody>
               </table>
             </div>
          </SectionBlock>

          {/* Previous Employment */}
          <SectionBlock title="Previous Employment" icon={Briefcase}>
            <div className="text-sm text-muted-foreground italic py-4 text-center border rounded-md border-dashed">
               No previous employment records.
            </div>
            {/* Example item */}
            {/* <div className="border-b last:border-0 pb-3 mb-3 shrink-0">
               <h4 className="font-semibold text-sm">TechCorp Inc.</h4>
               <p className="text-xs text-muted-foreground">Software Engineer • IT Dept</p>
               <div className="grid grid-cols-2 gap-2 mt-2">
                 <InfoRow label="Date of Employment" value="Jan 2018 - Dec 2021" />
                 <InfoRow label="Salary" value="₱50,000" />
                 <InfoRow label="Reason for Leaving" value="Career Growth" className="col-span-2" />
               </div>
            </div> */}
          </SectionBlock>
        </div>

      </div>
    </div>
  );
}
