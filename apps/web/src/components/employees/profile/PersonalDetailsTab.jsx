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
import { DEPARTMENTS, EMPLOYMENT_CLASSIFICATIONS } from "@/lib/constants";

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

function InfoRow({ label, value, name, onChange, isEditing, type = "text", className = "", isUpdated = false, isError = false }) {
  return (
    <div className={`py-1.5 px-2 rounded-md transition-colors ${isUpdated ? 'bg-amber-50 border border-amber-200/50 shadow-sm' : ''} ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        {isUpdated && (
          <Badge variant="outline" className="h-3.5 text-[8px] px-1 bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">
            Updated
          </Badge>
        )}
      </div>
      {isEditing ? (
        <Input 
          type={type}
          name={name}
          value={value || ""} 
          onChange={(e) => onChange(name, e.target.value)}
          className={`h-8 text-sm mt-1 ${isError ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50' : ''}`}
        />
      ) : (
        <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
      )}
    </div>
  );
}

export default function PersonalDetailsTab({ employee, onToggleActive, isReadOnly = false, showPhotoUpload = false, onChange, isEditMode = false, requestedChanges = null, errors = {} }) {
  const { toast } = useToast();
  const statusColor = {
    Regular: "bg-green-50 text-green-700 border-green-200",
    Probationary: "bg-amber-50 text-amber-700 border-amber-200",
    Contractual: "bg-blue-50 text-blue-700 border-blue-200",
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !employee?.id) return;
    const ownerId = employee.user_id || employee.id;
    const acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!acceptedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PNG or JPG image.", variant: "destructive" });
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({ title: "File too large", description: "Please upload an image under 5MB.", variant: "destructive" });
      return;
    }
    
    try {
      const fileExt = (file.name.split('.').pop() || "png").toLowerCase();
      const objectPath = `${ownerId}/photos/profile_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(objectPath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(objectPath);

      const { error: updateError } = await supabase
        .from('employees')
        .update({ photo_url: publicUrl })
        .eq('id', employee.id);

      if (updateError) throw updateError;
      
      toast({ title: "Profile picture updated successfully!" });
      window.location.reload(); 
    } catch(err) {
      console.error(err);
      const msg = err?.message || "Upload failed";
      if (msg.toLowerCase().includes("row-level security")) {
        toast({ title: "Upload blocked", description: "Storage policy denied this upload. Please check bucket permissions.", variant: "destructive" });
      } else {
        toast({ title: "Failed to upload photo", description: msg, variant: "destructive" });
      }
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

  const checkUpdated = (name) => {
    if (!requestedChanges) return false;
    // Basic field comparison
    if (requestedChanges[name] !== undefined && requestedChanges[name] !== employee[name]) {
      return true;
    }
    return false;
  };

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
                {(showPhotoUpload || isEditing || isEditMode) && (
                  <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                     <p className="text-xs text-white font-medium flex items-center gap-1">Change</p>
                     <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                )}
              </div>
              {isEditMode ? (
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                    <Input 
                      className={`h-8 text-sm text-center ${errors.first_name ? 'border-red-500 bg-red-50' : ''}`}
                      placeholder="First Name"
                      value={employee.first_name || ""}
                      onChange={(e) => onChange('first_name', e.target.value)}
                    />
                    <Input 
                      className="h-8 text-sm text-center"
                      placeholder="Middle Name"
                      value={employee.middle_name || ""}
                      onChange={(e) => onChange('middle_name', e.target.value)}
                    />
                    <Input 
                      className={`h-8 text-sm text-center ${errors.last_name ? 'border-red-500 bg-red-50' : ''}`}
                      placeholder="Last Name"
                      value={employee.last_name || ""}
                      onChange={(e) => onChange('last_name', e.target.value)}
                    />
                  </div>
                  <Input 
                    className="h-7 text-xs text-center w-1/2"
                    placeholder="Titles (e.g. PhD, LPT)"
                    value={employee.titles || ""}
                    onChange={(e) => onChange('titles', e.target.value)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="text-xl font-bold">
                    {employee.first_name} {employee.middle_name?.[0] ? employee.middle_name[0] + "." : ""} {employee.last_name}
                    {employee.titles && <span className="text-sm font-normal text-muted-foreground ml-2">, {employee.titles}</span>}
                  </h3>
                </div>
              )}
              
              {isEditMode ? (
                <div className="flex flex-col items-center gap-1 mb-2">
                  <Input 
                    className="h-7 text-sm text-center w-3/4 mb-1"
                    value={employee.position || ""}
                    placeholder="Position"
                    onChange={(e) => onChange('position', e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">•</span>
                    <select 
                      className="h-7 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                      value={employee.department || DEPARTMENTS[0]}
                      onChange={(e) => onChange('department', e.target.value)}
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-slate-800">•</span>
                    <select 
                      className="h-7 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                      value={employee.employment_classification || EMPLOYMENT_CLASSIFICATIONS[0]}
                      onChange={(e) => onChange('employment_classification', e.target.value)}
                    >
                      {EMPLOYMENT_CLASSIFICATIONS.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-800 mb-2">
                  {employee.position || "Employee"} • {employee.department || "University of Bohol"}
                  {employee.employment_classification && ` • ${employee.employment_classification}`}
                </p>
              )}
              
              {isEditMode ? (
                <div className="mt-4 flex flex-col items-center gap-2 max-w-[200px] mx-auto">
                  <div className="w-full text-left">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <select 
                      className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                      value={employee.employment_status || "Regular"}
                      onChange={(e) => onChange('employment_status', e.target.value)}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Probationary">Probationary</option>
                      <option value="Contractual">Contractual</option>
                    </select>
                  </div>
                </div>
              ) : (
                <Badge variant="outline" className={`mb-4 ${statusColor[employee.employment_status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                  {employee.employment_status || "Regular"}
                </Badge>
              )}
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
            {isEditMode ? (
              <div className="mt-2 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-50 font-bold">Department Logo</p>
              </div>
            ) : (
              <>
                <h4 className="font-semibold text-sm">{employee.department || "University of Bohol"}</h4>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest opacity-50 font-bold">Official Department</p>
              </>
            )}
          </div>
        </div>

        {/* Main Profiling Content */}
        <div className="xl:col-span-2 space-y-6">
          <SectionBlock title="Personal Information" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Gender" value={employee.gender} name="gender" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('gender')} />
                  <InfoRow label="Age" value={employee.age} name="age" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('age')} />
                  <InfoRow 
                    label="Birth Date" 
                    value={isEditing ? employee.birthdate : (employee.birthdate ? format(new Date(employee.birthdate), "MMMM dd, yyyy") : "—")} 
                    name="birthdate" 
                    type="date"
                    onChange={onChange} 
                    isEditing={isEditing} 
                    isUpdated={checkUpdated('birthdate')}
                    isError={!!errors.birthdate}
                  />
                  <InfoRow label="Civil Status" value={employee.civil_status} name="civil_status" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('civil_status')} />
                  <InfoRow label="Nationality" value={employee.nationality || "Filipino"} name="nationality" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('nationality')} />
                  <InfoRow label="Religion" value={employee.religion} name="religion" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('religion')} />
                </div>
                <InfoRow label="Place of Birth" value={employee.place_of_birth} name="place_of_birth" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('place_of_birth')} />
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Height (cm)" value={employee.height} name="height" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('height')} />
                  <InfoRow label="Weight (lbs)" value={employee.weight} name="weight" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('weight')} />
                  <InfoRow label="Blood Type" value={employee.blood_type} name="blood_type" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('blood_type')} />
                  <InfoRow 
                    label="Phone" 
                    value={employee.contact_phone || employee.phone} 
                    name="contact_phone" 
                    onChange={onChange} 
                    isEditing={isEditing} 
                    isUpdated={checkUpdated('contact_phone') || checkUpdated('phone')} 
                    isError={!!errors.contact_phone}
                  />
                </div>
                <InfoRow 
                  label="Email" 
                  value={employee.contact_email || employee.email} 
                  name="contact_email" 
                  onChange={onChange} 
                  isEditing={isEditing} 
                  isUpdated={checkUpdated('contact_email') || checkUpdated('email')} 
                  isError={!!errors.contact_email}
                />
                <InfoRow label="Distinguishing Marks" value={employee.distinguishing_marks} name="distinguishing_marks" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('distinguishing_marks')} />
              </div>

              <div className="space-y-1">
                <InfoRow label="Street" value={employee.address_street} name="address_street" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('address_street')} />
                <div className="grid grid-cols-2 gap-4">
                   <InfoRow label="Barangay" value={employee.address_barangay} name="address_barangay" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('address_barangay')} />
                   <InfoRow label="City" value={employee.address_city} name="address_city" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('address_city')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Province" value={employee.address_province} name="address_province" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('address_province')} />
                  <InfoRow label="Zip" value={employee.address_zip} name="address_zip" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('address_zip')} />
                </div>
              </div>
            </div>
          </SectionBlock>

          <SectionBlock title="Government ID's" icon={Shield}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-12">
              <InfoRow label="SSS No." value={employee.sss} name="sss" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('sss')} />
              <InfoRow label="TIN No." value={employee.tin} name="tin" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('tin')} />
              <InfoRow label="Philhealth No." value={employee.philhealth} name="philhealth" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('philhealth')} />
              <InfoRow label="PAG-IBIG No." value={employee.pag_ibig} name="pag_ibig" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('pag_ibig')} />
              <InfoRow label="PERAA" value={employee.peraa} name="peraa" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('peraa')} />
              <InfoRow label="Tax Status" value={employee.tax_status} name="tax_status" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('tax_status')} />
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
                    <InfoRow label="Spouse Name" value={employee.spouse_name} name="spouse_name" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('spouse_name')} />
                    <InfoRow label="Spouse Birthdate" value={employee.spouse_birthdate} name="spouse_birthdate" type="date" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('spouse_birthdate')} />
                    <InfoRow label="Spouse Employer" value={employee.spouse_employer} name="spouse_employer" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('spouse_employer')} />
                    <InfoRow label="Spouse Position" value={employee.spouse_position} name="spouse_position" onChange={onChange} isEditing={isEditing} isUpdated={checkUpdated('spouse_position')} />
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
                   <div className={`mb-6 p-4 rounded-lg border transition-colors ${
                     checkUpdated('spouse_name') ||
                     checkUpdated('spouse_birthdate') ||
                     checkUpdated('spouse_employer') ||
                     checkUpdated('spouse_position')
                       ? 'bg-amber-50/50 border-amber-200'
                       : 'bg-muted/20'
                   }`}>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-widest">Spouse Details</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                         <InfoRow label="Name" value={employee.spouse_name} isUpdated={checkUpdated('spouse_name')} />
                         <InfoRow label="Birthdate" value={employee.spouse_birthdate} isUpdated={checkUpdated('spouse_birthdate')} />
                         <InfoRow label="Employer" value={employee.spouse_employer} isUpdated={checkUpdated('spouse_employer')} />
                         <InfoRow label="Position" value={employee.spouse_position} isUpdated={checkUpdated('spouse_position')} />
                      </div>
                   </div>
                 )}
                 <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Children Records</h4>
                 {employee.spouse_children?.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                       {employee.spouse_children.map((child, i) => (
                          <div
                            key={i}
                            className={`border rounded-md p-3 transition-colors ${
                              checkUpdated('spouse_children')
                                ? 'bg-amber-50/50 border-amber-200'
                                : 'bg-muted/10'
                            }`}
                          >
                            <div className="flex justify-between mb-2">
                               <p className="text-sm font-bold">{child.name}</p>
                               <div className="flex items-center gap-1.5">
                                 {checkUpdated('spouse_children') && (
                                   <Badge variant="outline" className="h-3.5 text-[8px] px-1 bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">
                                     Updated
                                   </Badge>
                                 )}
                                 <Badge variant="outline" className="text-[10px]">{child.gender}</Badge>
                               </div>
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
