import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { User, Heart, MapPin, Phone, Mail, Calendar, Briefcase, Plus, Users, Shield, Globe, Award, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditProfileDialog from "./EditProfileDialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

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

export default function PersonalDetailsTab({ employee, onToggleActive, isReadOnly = false }) {
  const { toast } = useToast();
  const statusColor = {
    Regular: "bg-green-50 text-green-700 border-green-200",
    Probationary: "bg-amber-50 text-amber-700 border-amber-200",
    Contractual: "bg-blue-50 text-blue-700 border-blue-200",
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !employee?.id) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${employee.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('employees')
        .update({ photo_url: publicUrl })
        .eq('id', employee.id);

      if (updateError) throw updateError;
      
      toast({ title: "Profile picture updated successfully!" });
      window.location.reload(); 
    } catch(err) {
      console.error(err);
      toast({ title: "Failed to upload photo", description: err.message, variant: "destructive" });
    }
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";

  return (
    <div className="space-y-4">
      {!isReadOnly && (
        <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-muted">
           <p className="text-sm text-muted-foreground flex items-center gap-2">
             <Shield className="w-4 h-4 text-primary" />
             Update your personal records below. Some changes may require admin approval.
           </p>
           <EditProfileDialog employee={employee} />
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Profile Overview Card */}
      <div className="xl:col-span-1 space-y-6">
        <Card className="shadow-none border-muted bg-muted/30 text-center">
          <CardContent className="p-6">
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              <Avatar className="w-full h-full ring-4 ring-primary/10">
                <AvatarImage src={employee.photo_url} alt={employee.first_name} className="object-cover" />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                  {employee.first_name?.[0]}{employee.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {!isReadOnly && (
                <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                   <p className="text-xs text-white font-medium flex items-center gap-1">Change</p>
                   <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="text-xl font-bold">
                {employee.first_name} {employee.middle_name?.[0] ? employee.middle_name[0] + "." : ""} {employee.last_name}
                {employee.titles && <span className="text-sm font-normal text-muted-foreground ml-2">, {employee.titles}</span>}
              </h3>
            </div>
            <p className="text-sm font-medium text-slate-800 mb-2">{employee.position || "Staff"} • {employee.department || "General Department"}</p>
            <p className="text-xs text-muted-foreground mb-3">Emp ID: {employee.employee_id || "Year-001"}</p>
            <Badge variant="outline" className={`mb-4 ${statusColor[employee.employment_status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
              {employee.employment_status || "Regular"}
            </Badge>
          </CardContent>
        </Card>

        {/* Department Logo Placeholder */}
        <Card className="shadow-none border-muted bg-muted/10">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-white border border-border rounded-xl flex items-center justify-center mb-4 overflow-hidden shadow-sm">
               {employee.department ? (
                 <img 
                   src={`${supabaseUrl}/storage/v1/object/public/department-logos/${encodeURIComponent(employee.department)}.png`} 
                   alt={employee.department} 
                   className="w-full h-full object-contain p-2"
                   onError={(e) => { 
                     e.currentTarget.style.display = 'none'; 
                     e.currentTarget.nextSibling.style.display = 'flex';
                   }}
                 />
               ) : null}
               <div className="w-full h-full items-center justify-center" style={{ display: employee.department ? 'none' : 'flex' }}>
                  <MapPin className="w-8 h-8 text-muted-foreground opacity-20" />
               </div>
            </div>
            <h4 className="font-semibold text-sm">{employee.department || "General Department"}</h4>
            <p className="text-xs text-muted-foreground mt-1">Official Department Logo</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Profiling Content */}
      <div className="xl:col-span-2 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Data */}
          <SectionBlock title="Personal Data" icon={User}>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Gender" value={employee.gender} />
              <InfoRow label="Age" value={employee.age} />
              <InfoRow label="Birth Date" value={employee.birthdate ? format(new Date(employee.birthdate), "MM/dd/yyyy") : "—"} />
              <InfoRow label="Religion" value={employee.religion} />
              <InfoRow label="Civil Status" value={employee.civil_status} />
              <InfoRow label="Nationality" value={employee.nationality || "Filipino"} />
              <InfoRow label="Place of Birth" value={employee.place_of_birth} className="col-span-2" />
            </div>
          </SectionBlock>

          {/* Physical Description */}
          <SectionBlock title="Physical Description" icon={User}>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Height (cm)" value={employee.height} />
              <InfoRow label="Weight (lbs)" value={employee.weight} />
              <InfoRow label="Blood Type" value={employee.blood_type} />
              <InfoRow label="Distinguishing Marks" value={employee.distinguishing_marks} className="col-span-2" />
            </div>
          </SectionBlock>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parents Information */}
          <SectionBlock title="Parents Information" icon={Users}>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground border-b pb-1 mb-2">Father's Details</h4>
              <InfoRow label="Name" value={employee.father_name} />
              <InfoRow label="Occupation" value={employee.father_occupation} />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" disabled checked={employee.father_status === "Deceased"} className="rounded border-gray-300" />
                <span className="text-sm text-muted-foreground">Deceased</span>
              </div>
            </div>
            <div className="space-y-2 mt-6">
              <h4 className="text-xs font-semibold text-foreground border-b pb-1 mb-2">Mother's Details</h4>
              <InfoRow label="Name" value={employee.mother_name} />
              <InfoRow label="Occupation" value={employee.mother_occupation} />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" disabled checked={employee.mother_status === "Deceased"} className="rounded border-gray-300" />
                <span className="text-sm text-muted-foreground">Deceased</span>
              </div>
            </div>
          </SectionBlock>

          {/* Benefits/Tax ID */}
          <SectionBlock title="Benefits & Tax IDs" icon={Shield}>
            <div className="space-y-2">
              <InfoRow label="SSS Number" value={employee.sss} />
              <InfoRow label="TIN" value={employee.tin} />
              <InfoRow label="Philhealth" value={employee.philhealth} />
              <InfoRow label="Pag-ibig" value={employee.pag_ibig} />
              <InfoRow label="PERAA" value={employee.peraa} />
              <InfoRow label="Tax Status" value={employee.tax_status} />
            </div>
          </SectionBlock>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Contact Information */}
          <SectionBlock title="Contact Information" icon={Phone}>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground border-b pb-1 mb-2 mt-1">Permanent Address</h4>
              <InfoRow label="Street Address" value={employee.address_street} />
              <InfoRow label="Barangay" value={employee.address_barangay} />
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="City/Municipality" value={employee.address_city} />
                <InfoRow label="State/Province" value={employee.address_province} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Country" value={employee.address_country || "Philippines"} />
                <InfoRow label="Zip Code" value={employee.address_zip} />
              </div>
              <InfoRow label="Email Address" value={employee.contact_email || employee.email} />
              <InfoRow label="Contact Nos" value={employee.contact_phone || employee.phone} />
            </div>
          </SectionBlock>

          {/* Emergency Contact Information */}
          <SectionBlock title="Emergency Contact" icon={Heart}>
            <div className="space-y-4">
              {employee.emergency_contacts?.length > 0 ? (
                employee.emergency_contacts.map((contact, i) => (
                  <div key={i} className="p-3 bg-muted/20 rounded-md border text-sm space-y-1">
                    <div className="flex justify-between font-bold">
                       <span>{contact.name}</span>
                       <Badge variant="outline" className="text-[10px]">{contact.relation}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{contact.address}</p>
                    <div className="flex flex-wrap gap-x-4 pt-1 text-[11px]">
                       <span>Mobile: {contact.mobile}</span>
                       <span>Office/Home: {contact.office}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground italic py-2">No emergency contacts listed.</div>
              )}
            </div>
          </SectionBlock>
        </div>

        {/* Dependent's Information */}
        <SectionBlock 
          title="Spousal & Dependent's Information" 
          icon={Users}
        >
          {employee.spouse_name && (
             <div className="mb-6 bg-muted/20 p-4 rounded-lg border">
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-widest">Spouse Details</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                   <InfoRow label="Name" value={employee.spouse_name} />
                   <InfoRow label="Gender" value={employee.spouse_gender} />
                   <InfoRow label="Date of Birth" value={employee.spouse_birthdate} />
                   <InfoRow label="Age" value={employee.spouse_age} />
                </div>
                <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                   <InfoRow label="Employer" value={employee.spouse_employer} />
                   <InfoRow label="Position" value={employee.spouse_position} />
                   <InfoRow label="Employment Status" value={employee.spouse_employment_status} />
                </div>
             </div>
          )}

          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-widest">Children Records</h4>
          {employee.spouse_children?.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
               {employee.spouse_children.map((child, i) => (
                  <div key={i} className="border rounded-md p-3 bg-muted/10">
                    <div className="flex justify-between mb-2">
                       <p className="text-sm font-bold">{child.name}</p>
                       <Badge variant="outline" className="text-[10px]">{child.gender}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                       <span>Born: {child.birthdate} ({child.age} yrs)</span>
                       <span className="col-span-2">Enrolled: {child.enrolled} ({child.course})</span>
                    </div>
                  </div>
               ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic py-4 text-center border rounded-md border-dashed">
              No dependents / children added yet.
            </div>
          )}
        </SectionBlock>

        <div className="grid grid-cols-1 gap-6">
          {/* Languages */}
        <SectionBlock title="Attachments & E-Signatures" icon={Shield}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Employee Certification Signature</p>
                 {employee.signature_url ? (
                   <div className="border rounded-xl p-4 bg-white shadow-sm flex items-center justify-center min-h-[140px]">
                      <img src={employee.signature_url} alt="E-signature" className="max-h-24 w-auto object-contain mix-blend-multiply" />
                   </div>
                 ) : (
                   <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                      <Shield className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-xs">No e-signature uploaded.</p>
                   </div>
                 )}
              </div>
              <div className="space-y-4">
                 <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Document Status</p>
                 <div className="p-4 bg-[#0C005F]/5 rounded-xl border border-[#0C005F]/10">
                    <div className="flex items-center gap-3 mb-2">
                       <Shield className="w-5 h-5 text-[#0C005F]" />
                       <span className="text-sm font-bold text-[#0C005F]">Official HR Digitized File</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed"> This electronic record represents the certified Personnel Information Form (201) and is legally binding within the University HRIS framework.</p>
                 </div>
              </div>
           </div>
        </SectionBlock>
        </div>

      </div>
    </div>
    </div>
  );
}
