import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Loader2, Plus, Trash2, Heart, GraduationCap, Award, Shield, Users, User, Briefcase, Zap, Globe, FileText, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

// Column definitions matching EmployeeRegistration.jsx for consistency
const eduCols = [
  { key: 'level', label: 'Level', span: 3 }, { key: 'school', label: 'Name of School', span: 5 }, { key: 'address', label: 'School Address', span: 4 },
  { key: 'degree', label: 'Degree Earned', span: 3 }, { key: 'gradYear', label: 'Grad Year', span: 2 }, { key: 'units', label: 'Units Completed', span: 2 },
  { key: 'thesis', label: 'Thesis/Dissertation', span: 2 }, { key: 'gwa', label: 'GWA', span: 1 }, { key: 'inclusive', label: 'Inclusive Dates', span: 2 }
];
const trainCols = [
  { key: 'name', label: 'Seminar/Training Name', span: 5 }, { key: 'type', label: 'Type', span: 3 }, { key: 'budget', label: 'Approved Budget', span: 4 },
  { key: 'venue', label: 'Venue', span: 3 }, { key: 'duration', label: 'Duration', span: 2 }, { key: 'conducted', label: 'Conducted By', span: 2 },
  { key: 'dates', label: 'Inclusive Dates', span: 2 }, { key: 'notes', label: 'Notes', span: 3 }
];
const childrenCols = [
  { key: 'name', label: "Child's Name", span: 8 }, { key: 'birthdate', label: 'Date of Birth', type: 'date', span: 4 },
  { key: 'age', label: 'Age', span: 2 }, { key: 'gender', label: 'Gender', span: 3 },
  { key: 'enrolled', label: 'Enrolled At', span: 4 }, { key: 'course', label: 'Course & YR', span: 3 }
];
const awardsCols = [
  { key: 'type', label: 'Reward Type', span: 4 }, { key: 'name', label: 'Reward Name', span: 8 },
  { key: 'agency', label: 'Granting Agency/Org', span: 4 }, { key: 'date', label: 'Date Given', type: 'date', span: 3 },
  { key: 'place', label: 'Place Given', span: 3 }, { key: 'remarks', label: 'Remarks', span: 2 }
];
const licenseCols = [
  { key: 'name', label: 'License Name', span: 3 }, { key: 'number', label: 'License No.', span: 2 },
  { key: 'issued', label: 'Issued Date', type: 'date', span: 2 }, { key: 'expiry', label: 'Expiry Date', type: 'date', span: 2 },
  { key: 'place', label: 'Place Issued', span: 2 }, { key: 'remarks', label: 'Remarks', span: 1 }
];
const examsCols = [
  { key: 'title', label: 'Exam Title', span: 3 }, { key: 'date', label: 'Date Taken', type: 'date', span: 2 },
  { key: 'place', label: 'Place Taken', span: 2 }, { key: 'rank', label: 'Rank (If Applicable)', span: 2 },
  { key: 'rating', label: 'Rating (%, GPA)', span: 2 }, { key: 'remarks', label: 'Remarks', span: 1 }
];
const skillsCols = [
  { key: 'skill', label: 'Skill', span: 6 }, { key: 'years', label: 'Years of Use', span: 2 },
  { key: 'level', label: 'Level of Expertise', span: 4, placeholder: 'Beginner/Intermediate/Advance/Expert' }
];
const langCols = [
  { key: 'language', label: 'Language', span: 4 }, { key: 'literacy', label: 'Literacy (Speak/Read/Write)', span: 4 },
  { key: 'fluency', label: 'Fluency Scale', span: 4, placeholder: 'Beginner/Intermediate/Advance/Expert' }
];
const affiliationCols = [
  { key: 'org', label: 'Organization', span: 4 }, { key: 'place', label: 'Place/Station', span: 3 },
  { key: 'position', label: 'Position', span: 3 }, { key: 'dates', label: 'Inclusive Dates', span: 2 }
];
const extraCols = [
  { key: 'type', label: 'Service/Activity Type', span: 4 }, { key: 'nature_act', label: 'Nature of Activity/Project', span: 8 },
  { key: 'nature_part', label: 'Nature of Participation', span: 5 }, { key: 'date', label: 'Date', type: 'date', span: 3 },
  { key: 'remarks', label: 'Remarks', span: 4 }
];

export default function EditProfileDialog({ employee, buttonLabel = "Edit Personal Details" }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Profiling
    first_name: employee?.first_name || "",
    middle_name: employee?.middle_name || "",
    last_name: employee?.last_name || "",
    gender: employee?.gender || "Male",
    birthdate: employee?.birthdate || "",
    age: employee?.age || "",
    civil_status: employee?.civil_status || "Single",
    nationality: employee?.nationality || "Filipino",
    religion: employee?.religion || "",
    place_of_birth: employee?.place_of_birth || "",
    titles: employee?.titles || "",

    // Physical
    height: employee?.height || "",
    weight: employee?.weight || "",
    blood_type: employee?.blood_type || "",
    distinguishing_marks: employee?.distinguishing_marks || "",

    // Contact
    contact_phone: employee?.contact_phone || "",
    contact_email: employee?.contact_email || "",
    address_street: employee?.address_street || "",
    address_barangay: employee?.address_barangay || "",
    address_city: employee?.address_city || "",
    address_province: employee?.address_province || "",
    address_zip: employee?.address_zip || "",
    address_country: employee?.address_country || "Philippines",

    // Social/Family
    father_name: employee?.father_name || "",
    father_occupation: employee?.father_occupation || "",
    father_status: employee?.father_status || "Living",
    mother_name: employee?.mother_name || "",
    mother_occupation: employee?.mother_occupation || "",
    mother_status: employee?.mother_status || "Living",
    spouse_name: employee?.spouse_name || "",
    spouse_gender: employee?.spouse_gender || "Female",
    spouse_birthdate: employee?.spouse_birthdate || "",
    spouse_age: employee?.spouse_age || "",
    spouse_employer: employee?.spouse_employer || "",
    spouse_position: employee?.spouse_position || "",
    spouse_employment_status: employee?.spouse_employment_status || "",

    // IDs
    sss: employee?.sss || "",
    tin: employee?.tin || "",
    philhealth: employee?.philhealth || "",
    pag_ibig: employee?.pag_ibig || "",
    peraa: employee?.peraa || "",
    tax_status: employee?.tax_status || "Single",
  });

  // Grid States
  const [spouse_children, setChildren] = useState(employee?.spouse_children || []);
  const [educational_record, setEducation] = useState(employee?.educational_record || []);
  const [internal_trainings, setInternalTraining] = useState(employee?.internal_trainings || []);
  const [external_trainings, setExternalTraining] = useState(employee?.external_trainings || []);
  const [awards_citations, setAwards] = useState(employee?.awards_citations || []);
  const [licenses, setLicenses] = useState(employee?.licenses || []);
  const [exams_taken, setExams] = useState(employee?.exams_taken || []);
  const [skills, setSkills] = useState(employee?.skills || []);
  const [languages, setLanguages] = useState(employee?.languages || []);
  const [group_affiliations, setAffiliations] = useState(employee?.group_affiliations || []);
  const [extra_activities, setExtra] = useState(employee?.extra_activities || []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const requestedChanges = {
        ...formData,
        spouse_children,
        educational_record,
        internal_trainings,
        external_trainings,
        awards_citations,
        licenses,
        exams_taken,
        skills,
        languages,
        group_affiliations,
        extra_activities
      };

      const { error } = await supabase
        .from('employee_update_requests')
        .upsert([{
          employee_id: employee.id,
          requested_changes: requestedChanges,
          status: 'pending'
        }], { onConflict: 'employee_id,status' }); // Overwrite pending Master request if exists

      if (error) throw error;

      toast({
        title: "Master Request Submitted",
        description: "Your information update has been sent to HR. It will be verified shortly.",
      });
      
      setOpen(false);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[#0C005F] hover:bg-[#0C005F]/90">
          <Pencil className="w-4 h-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
        <div className="bg-[#0C005F] p-6 text-white shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-white/70" />
            Update Personnel Information
          </DialogTitle>
          <DialogDescription className="text-white/60 text-xs mt-1 uppercase tracking-widest font-medium">
            Master 201 Form Edit Request • Pending HR Approval
          </DialogDescription>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
          <Tabs defaultValue="profiling" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4 border-b bg-slate-50">
              <TabsList className="w-full justify-start h-10 gap-2 bg-transparent px-6">
                <TabsTrigger value="profiling" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Personal Data</TabsTrigger>
                <TabsTrigger value="social" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Family & Social</TabsTrigger>
                <TabsTrigger value="education" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Educational Record</TabsTrigger>
                <TabsTrigger value="training" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Trainings</TabsTrigger>
                <TabsTrigger value="certification" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Credentials & Skills</TabsTrigger>
                <TabsTrigger value="others" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Others</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-8 py-6">
              
              <TabsContent value="profiling" className="space-y-8 m-0 pb-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#0C005F] flex items-center gap-2 uppercase tracking-widest border-b pb-2">
                    <User className="w-4 h-4" /> Core Identity
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Titles</Label>
                      <Input name="titles" value={formData.titles} onChange={handleChange} placeholder="e.g. PhD, REE" />
                    </div>
                    <div className="col-span-1 space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60 font-bold">First Name</Label>
                      <Input name="first_name" value={formData.first_name} onChange={handleChange} />
                    </div>
                    <div className="col-span-1 space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Middle Name</Label>
                      <Input name="middle_name" value={formData.middle_name} onChange={handleChange} />
                    </div>
                    <div className="col-span-1 space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60 font-bold">Last Name</Label>
                      <Input name="last_name" value={formData.last_name} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Birthdate</Label>
                      <Input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Age</Label>
                      <Input name="age" value={formData.age} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Gender</Label>
                      <Input name="gender" value={formData.gender} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Civil Status</Label>
                      <Input name="civil_status" value={formData.civil_status} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Nationality</Label>
                      <Input name="nationality" value={formData.nationality} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#0C005F] flex items-center gap-2 uppercase tracking-widest border-b pb-2">
                    <Zap className="w-4 h-4" /> Attributes & IDs
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Height (cm)</Label>
                      <Input name="height" value={formData.height} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Weight (lbs)</Label>
                      <Input name="weight" value={formData.weight} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Blood Type</Label>
                      <Input name="blood_type" value={formData.blood_type} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Religious Affiliation</Label>
                      <Input name="religion" value={formData.religion} onChange={handleChange} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">SSS Number</Label>
                      <Input name="sss" value={formData.sss} onChange={handleChange} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">TIN</Label>
                      <Input name="tin" value={formData.tin} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#0C005F] flex items-center gap-2 uppercase tracking-widest border-b pb-2">
                    <Globe className="w-4 h-4" /> Physical Location & Contact
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Phone No.</Label>
                      <Input name="contact_phone" value={formData.contact_phone} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Personal Email</Label>
                      <Input name="contact_email" value={formData.contact_email} onChange={handleChange} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Street Address</Label>
                      <Input name="address_street" value={formData.address_street} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">Barangay</Label>
                      <Input name="address_barangay" value={formData.address_barangay} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase opacity-60">City/Municipality</Label>
                      <Input name="address_city" value={formData.address_city} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-8 m-0 pb-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-12">
                     <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#0C005F] border-b pb-1 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Father
                        </h4>
                        <div className="space-y-3">
                           <div className="space-y-1">
                              <Label className="text-[11px] uppercase opacity-60">Full Name</Label>
                              <Input name="father_name" value={formData.father_name} onChange={handleChange} />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[11px] uppercase opacity-60">Occupation</Label>
                              <Input name="father_occupation" value={formData.father_occupation} onChange={handleChange} />
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#0C005F] border-b pb-1 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Mother (Maiden)
                        </h4>
                        <div className="space-y-3">
                           <div className="space-y-1">
                              <Label className="text-[11px] uppercase opacity-60">Full Name</Label>
                              <Input name="mother_name" value={formData.mother_name} onChange={handleChange} />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[11px] uppercase opacity-60">Occupation</Label>
                              <Input name="mother_occupation" value={formData.mother_occupation} onChange={handleChange} />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="pt-8 border-t space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#0C005F] border-b pb-1 flex items-center gap-2">
                      <Heart className="w-4 h-4" /> Spousal & Dependents
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                       <div className="space-y-1">
                          <Label className="text-[11px] uppercase opacity-60">Spouse Name</Label>
                          <Input name="spouse_name" value={formData.spouse_name} onChange={handleChange} />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[11px] uppercase opacity-60">Occupation</Label>
                          <Input name="spouse_position" value={formData.spouse_position} onChange={handleChange} />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[11px] uppercase opacity-60">Employer</Label>
                          <Input name="spouse_employer" value={formData.spouse_employer} onChange={handleChange} />
                       </div>
                    </div>
                    <div className="pt-4">
                       <Label className="text-[11px] uppercase opacity-60 font-bold mb-2 inline-block">Children / Dependents Record</Label>
                       <DynamicGrid title="Children" columns={childrenCols} data={spouse_children} setData={setChildren} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="education" className="m-0 space-y-6 pb-8">
                <div className="bg-[#0C005F]/5 p-4 rounded-lg flex items-start gap-4 mb-6">
                   <div className="p-2 bg-[#0C005F] rounded text-white"><GraduationCap className="w-5 h-5" /></div>
                   <div>
                      <h4 className="text-sm font-bold text-[#0C005F]">Educational Record Update</h4>
                      <p className="text-xs text-[#0C005F]/60">Update your Primary, Secondary, and Tertiary education details below.</p>
                   </div>
                </div>
                <DynamicGrid title="Educational Records" columns={eduCols} data={educational_record} setData={setEducation} />
              </TabsContent>

              <TabsContent value="training" className="m-0 space-y-8 pb-8">
                <DynamicGrid title="Internal Trainings/Seminars" columns={trainCols} data={internal_trainings} setData={setInternalTraining} />
                <div className="pt-8 border-t">
                  <DynamicGrid title="External Trainings (Within 5 Years)" columns={trainCols} data={external_trainings} setData={setExternalTraining} />
                </div>
              </TabsContent>

              <TabsContent value="certification" className="m-0 space-y-8 pb-8">
                 <DynamicGrid title="Academic Awards & Citations" columns={awardsCols} data={awards_citations} setData={setAwards} />
                 <div className="pt-8 border-t">
                    <DynamicGrid title="Professional Licenses" columns={licenseCols} data={licenses} setData={setLicenses} />
                 </div>
                 <div className="pt-8 border-t">
                    <DynamicGrid title="Government/Board Exams Taken" columns={examsCols} data={exams_taken} setData={setExams} />
                 </div>
              </TabsContent>

              <TabsContent value="others" className="m-0 space-y-8 pb-8">
                 <div className="grid grid-cols-2 gap-8">
                    <DynamicGrid title="Languages" columns={langCols} data={languages} setData={setLanguages} />
                    <DynamicGrid title="Skills" columns={skillsCols} data={skills} setData={setSkills} />
                 </div>
                 <div className="pt-8 border-t">
                   <DynamicGrid title="Organization/Group Affiliations" columns={affiliationCols} data={group_affiliations} setData={setAffiliations} />
                 </div>
                 <div className="pt-8 border-t">
                   <DynamicGrid title="Special Service/Extra Activities" columns={extraCols} data={extra_activities} setData={setExtra} />
                 </div>
              </TabsContent>

                </div>
              </ScrollArea>
            </div>
          </Tabs>
          
          <DialogFooter className="p-6 pt-4 bg-slate-50 border-t shrink-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-200">Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-[#0C005F] hover:bg-[#0C005F]/90 px-8">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Submission
                </>
              ) : (
                "Submit Master Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
