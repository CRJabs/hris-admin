import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { User, Heart, MapPin, Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

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

function InfoRow({ label, value, name, onChange, isEditing, type = "text", className = "" }) {
  return (
    <div className={`py-1.5 ${className}`}>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      {isEditing ? (
        <Input 
          type={type}
          name={name}
          value={value || ""} 
          onChange={(e) => onChange(name, e.target.value)}
          className="h-8 text-sm mt-1"
        />
      ) : (
        <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
      )}
    </div>
  );
}

export default function PersonalDetailsTab({ employee, onToggleActive, isReadOnly = false, showPhotoUpload = false, onChange }) {
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

  const isEditing = !isReadOnly;

  // Grid column definitions
  const contactCols = [
    { key: 'name', label: 'Contact Name', span: 3 }, { key: 'relation', label: 'Relation', span: 2 },
    { key: 'address', label: 'Contact Address', span: 3 }, { key: 'mobile', label: 'Mobile', span: 2 }, { key: 'office', label: 'Office/Home', span: 2 }
  ];
  const childrenCols = [
    { key: 'name', label: "Child's Name", span: 8 }, { key: 'birthdate', label: 'Date of Birth', type: 'date', span: 4 },
    { key: 'age', label: 'Age', span: 2 }, { key: 'gender', label: 'Gender', span: 3 },
    { key: 'enrolled', label: 'Enrolled At', span: 4 }, { key: 'course', label: 'Course & YR', span: 3 }
  ];

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex justify-between items-center bg-[#0C005F]/5 p-3 rounded-lg border border-[#0C005F]/10 mb-2">
           <p className="text-sm text-[#0C005F] font-bold flex items-center gap-2">
             <Shield className="w-4 h-4" />
             Editing Mode: Update your personal records. Admin approval required to publish changes.
           </p>
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
                {(showPhotoUpload || isEditing) && (
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
              <p className="text-sm font-medium text-slate-800 mb-2">{employee.position || "Employee"} • {employee.department || "University of Bohol"}</p>
              <Badge variant="outline" className={`mb-4 ${statusColor[employee.employment_status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                {employee.employment_status || "Regular"}
              </Badge>
            </CardContent>
          </Card>

          {/* Department Logo Placeholder */}
          <div className="flex flex-col items-center justify-center text-center p-6">
            <div className="w-24 h-24 flex items-center justify-center mb-4 overflow-hidden border rounded-lg bg-white/50 shadow-sm">
               <img 
                 src={employee.department 
                   ? `${supabaseUrl}/storage/v1/object/public/department-logos/${encodeURIComponent(employee.department)}.png`
                   : `${supabaseUrl}/storage/v1/object/public/department-logos/ub.png`
                 } 
                 alt={employee.department || "University of Bohol"} 
                 className="w-full h-full object-contain p-2"
                 onError={(e) => { 
                   e.currentTarget.src = `${supabaseUrl}/storage/v1/object/public/department-logos/ub.png`;
                 }}
               />
            </div>
            <h4 className="font-semibold text-sm">{employee.department || "University of Bohol"}</h4>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest opacity-50 font-bold">Official Department</p>
          </div>
        </div>

        {/* Main Profiling Content */}
        <div className="xl:col-span-2 space-y-6">
          <SectionBlock title="Personal Information" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Gender" value={employee.gender} name="gender" onChange={onChange} isEditing={isEditing} />
                  <InfoRow label="Age" value={employee.age} name="age" onChange={onChange} isEditing={isEditing} />
                  <InfoRow 
                    label="Birth Date" 
                    value={isEditing ? employee.birthdate : (employee.birthdate ? format(new Date(employee.birthdate), "MMMM dd, yyyy") : "—")} 
                    name="birthdate" 
                    type="date"
                    onChange={onChange} 
                    isEditing={isEditing} 
                  />
                  <InfoRow label="Civil Status" value={employee.civil_status} name="civil_status" onChange={onChange} isEditing={isEditing} />
                  <InfoRow label="Nationality" value={employee.nationality || "Filipino"} name="nationality" onChange={onChange} isEditing={isEditing} />
                  <InfoRow label="Religion" value={employee.religion} name="religion" onChange={onChange} isEditing={isEditing} />
                </div>
                <InfoRow label="Place of Birth" value={employee.place_of_birth} name="place_of_birth" onChange={onChange} isEditing={isEditing} />
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Height (cm)" value={employee.height} name="height" onChange={onChange} isEditing={isEditing} />
                  <InfoRow label="Weight (lbs)" value={employee.weight} name="weight" onChange={onChange} isEditing={isEditing} />
                  <InfoRow label="Blood Type" value={employee.blood_type} name="blood_type" onChange={onChange} isEditing={isEditing} />
                  <InfoRow label="Phone" value={employee.contact_phone || employee.phone} name="contact_phone" onChange={onChange} isEditing={isEditing} />
                </div>
                <InfoRow label="Email" value={employee.contact_email || employee.email} name="contact_email" onChange={onChange} isEditing={isEditing} />
                <InfoRow label="Distinguishing Marks" value={employee.distinguishing_marks} name="distinguishing_marks" onChange={onChange} isEditing={isEditing} />
              </div>

              <div className="space-y-1">
                <InfoRow label="Street" value={employee.address_street} name="address_street" onChange={onChange} isEditing={isEditing} />
                <div className="grid grid-cols-2 gap-4">
                   <InfoRow label="Barangay" value={employee.address_barangay} name="address_barangay" onChange={onChange} isEditing={isEditing} />
                   <InfoRow label="City" value={employee.address_city} name="address_city" onChange={onChange} isEditing={isEditing} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Province" value={employee.address_province} name="address_province" onChange={onChange} isEditing={isEditing} />
                  <InfoRow label="Zip" value={employee.address_zip} name="address_zip" onChange={onChange} isEditing={isEditing} />
                </div>
              </div>
            </div>
          </SectionBlock>

          <SectionBlock title="Emergency Contact" icon={Heart}>
            {isEditing ? (
              <DynamicGrid 
                title="Emergency Contacts" 
                columns={contactCols} 
                data={employee.emergency_contacts || []} 
                onChange={(newData) => onChange('emergency_contacts', newData)} 
              />
            ) : (
              <div className="space-y-4">
                {employee.emergency_contacts?.length > 0 ? (
                  employee.emergency_contacts.map((contact, i) => (
                    <div key={i} className="p-3 bg-muted/20 rounded-md border text-sm space-y-1">
                      <div className="flex justify-between font-bold">
                         <span>{contact.name}</span>
                         <Badge variant="outline" className="text-[10px]">{contact.relation}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{contact.address}</p>
                      <p className="text-[11px]">Mobile: {contact.mobile} | Office: {contact.office}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground italic py-2">No emergency contacts listed.</div>
                )}
              </div>
            )}
          </SectionBlock>

          <SectionBlock title="Spousal & Dependent's Information" icon={Users}>
             {isEditing ? (
               <div className="space-y-8">
                  <div className="grid grid-cols-4 gap-4 pb-6 border-b">
                    <InfoRow label="Spouse Name" value={employee.spouse_name} name="spouse_name" onChange={onChange} isEditing={isEditing} />
                    <InfoRow label="Spouse Birthdate" value={employee.spouse_birthdate} name="spouse_birthdate" type="date" onChange={onChange} isEditing={isEditing} />
                    <InfoRow label="Spouse Employer" value={employee.spouse_employer} name="spouse_employer" onChange={onChange} isEditing={isEditing} />
                    <InfoRow label="Spouse Position" value={employee.spouse_position} name="spouse_position" onChange={onChange} isEditing={isEditing} />
                  </div>
                  <DynamicGrid 
                    title="Children Records" 
                    columns={childrenCols} 
                    data={employee.spouse_children || []} 
                    onChange={(newData) => onChange('spouse_children', newData)} 
                  />
               </div>
             ) : (
               <>
                 {employee.spouse_name && (
                   <div className="mb-6 bg-muted/20 p-4 rounded-lg border">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-widest">Spouse Details</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                         <InfoRow label="Name" value={employee.spouse_name} />
                         <InfoRow label="Birthdate" value={employee.spouse_birthdate} />
                         <InfoRow label="Employer" value={employee.spouse_employer} />
                         <InfoRow label="Position" value={employee.spouse_position} />
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
                            <p className="text-xs">Born: {child.birthdate} ({child.age} yrs) | Enrolled: {child.enrolled}</p>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="text-sm text-muted-foreground italic py-4 text-center border rounded-md border-dashed">
                      No dependents / children added yet.
                    </div>
                 )}
               </>
             )}
          </SectionBlock>

          <SectionBlock title="Attachments & E-Signatures" icon={Shield}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Certification Signature</p>
                   <div className="border rounded-xl p-4 bg-white shadow-sm flex items-center justify-center min-h-[140px]">
                      {employee.signature_url ? (
                        <img src={employee.signature_url} alt="E-signature" className="max-h-24 w-auto object-contain mix-blend-multiply" />
                      ) : (
                        <div className="text-center">
                           <Shield className="w-8 h-8 mb-2 opacity-20 mx-auto" />
                           <p className="text-xs text-muted-foreground">No signature uploaded</p>
                        </div>
                      )}
                   </div>
                </div>
                <div className="space-y-4">
                   <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Document Status</p>
                   <div className="p-4 bg-[#0C005F]/5 rounded-xl border border-[#0C005F]/10">
                      <div className="flex items-center gap-3 mb-2">
                         <Shield className="w-5 h-5 text-[#0C005F]" />
                         <span className="text-sm font-bold text-[#0C005F]">Official HR Digitized File</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">This record represents the certified Personnel Information Form (201) and is legally binding.</p>
                   </div>
                </div>
             </div>
          </SectionBlock>
        </div>
      </div>
    </div>
  );
}
