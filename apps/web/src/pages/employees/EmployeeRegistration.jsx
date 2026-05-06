import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, FileText, Upload, Save, User, Briefcase, Users, Shield, Award, BookOpen, GraduationCap, CheckCircle, AlertCircle, Loader2, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { PersonalSection } from "@/components/employees/registration/sections/PersonalSection";
import { FamilySection } from "@/components/employees/registration/sections/FamilySection";
import { HistorySection } from "@/components/employees/registration/sections/HistorySection";
import { EducationSection } from "@/components/employees/registration/sections/EducationSection";
import { SubmissionSection } from "@/components/employees/registration/sections/SubmissionSection";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

// Grid Span Distributions
const emergencyCols = [
  // Row 1
  { key: 'name', label: 'Contact Name', span: 5 }, { key: 'relation', label: 'Relation', span: 3 }, { key: 'mobile', label: 'Mobile', span: 4 },
  // Row 2
  { key: 'address', label: 'Contact Address', span: 6 }, { key: 'office', label: 'Office No.', span: 3 }, { key: 'home', label: 'Home No.', span: 3 }
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
const scholarCols = [
  { key: 'type', label: 'Work Type', span: 4 }, { key: 'spec', label: 'Specification', span: 4, placeholder: 'Study/Travel/Thesis' }, { key: 'title', label: 'Complete Title', span: 4 },
  { key: 'status', label: 'Work Status', span: 2 }, { key: 'agency', label: 'Granting Agency', span: 3 }, { key: 'date', label: 'Date Given', type: 'date', span: 2 },
  { key: 'place', label: 'Place Given', span: 2 }, { key: 'remarks', label: 'Remarks', span: 3 }
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
  { 
    key: 'level', 
    label: 'Level of Expertise', 
    span: 4, 
    type: 'select',
    options: ["Beginner", "Intermediate", "Advanced", "Expert"],
    placeholder: 'Select Level' 
  }
];
const langCols = [
  { key: 'language', label: 'Language', span: 4 }, 
  { 
    key: 'literacy', 
    label: 'Literacy', 
    span: 4, 
    type: 'select',
    options: ["Speak", "Read", "Write"],
    placeholder: 'Select Mode' 
  },
  { 
    key: 'fluency', 
    label: 'Fluency Scale', 
    span: 4, 
    type: 'select',
    options: ["Beginner", "Intermediate", "Advanced", "Expert"],
    placeholder: 'Select Scale' 
  }
];
const affiliationCols = [
  { key: 'org', label: 'Organization', span: 6 }, { key: 'place', label: 'Place/Station', span: 6 },
  { key: 'position', label: 'Position', span: 6 }, 
  { key: 'start_date', label: 'Start Date', type: 'date', span: 3 }, { key: 'end_date', label: 'End Date', type: 'date', span: 3 }
];
const extraCols = [
  { key: 'type', label: 'Service/Activity Type', span: 4 }, { key: 'nature_act', label: 'Nature of Activity/Project', span: 8 },
  { key: 'nature_part', label: 'Nature of Participation', span: 5 }, { key: 'date', label: 'Date', type: 'date', span: 3 },
  { key: 'remarks', label: 'Remarks', span: 4 }
];
const prevEmpCols = [
  { key: 'company', label: 'Company Name', span: 4 }, { key: 'address', label: 'Address', span: 4 }, 
  { key: 'position', label: 'Position', span: 4 },
  { key: 'status', label: 'Emp Status', span: 3 }, { key: 'phone', label: 'Phone No.', span: 3 },
  { key: 'dept', label: 'Office/Dept', span: 3 }, { key: 'salary', label: 'Salary', span: 3 }, 
  { key: 'start', label: 'Date of Emp', type: 'date', span: 2 },
  { key: 'end', label: 'Date Resigned', type: 'date', span: 2 }, 
  { key: 'awards', label: 'Achievements/Awards', span: 3 },
  { key: 'resp', label: 'Responsibility', span: 3 }, { key: 'reason', label: 'Reason for Leaving', span: 2 }
];
const eduCols = [
  { key: 'level', label: 'Level', span: 3 }, { key: 'school', label: 'Name of School', span: 5 }, { key: 'address', label: 'School Address', span: 4 },
  { key: 'degree', label: 'Degree Earned', span: 4 }, { key: 'gradYear', label: 'Grad Date', type: 'date', span: 2 }, { key: 'units', label: 'Units Completed', span: 2 },
  { key: 'gwa', label: 'GWA', span: 1 }, { key: 'inclusive', label: 'Inclusive Date of Attendance', span: 3 },
  { key: 'thesis', label: 'Thesis/Dissertation', span: 4 }, { key: 'honors', label: 'Graduation Honors', span: 3 }, 
  { key: 'awards', label: 'Awards', span: 3 }, { key: 'remarks', label: 'Remarks', span: 2 }
];
const trainCols = [
  { key: 'name', label: 'Seminar/Training Name', span: 4 }, { key: 'type', label: 'Type', span: 2 }, { key: 'budget', label: 'Approved Budget', span: 2 },
  { key: 'venue', label: 'Venue', span: 2 }, { key: 'duration', label: 'Duration', span: 2 }, 
  { key: 'conducted', label: 'Conducted By', span: 3 },
  { key: 'start_date', label: 'Start Date', type: 'date', span: 2 }, { key: 'end_date', label: 'End Date', type: 'date', span: 2 }, 
  { key: 'notes', label: 'Notes', span: 5 }
];

export default function EmployeeRegistration() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("profiling");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certified, setCertified] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState("");
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  // Signature preview management handled directly by state and public URL to avoid revocation issues
  useEffect(() => {
    // Component handles URL state directly
  }, []);

  // Flat State Dictionary carrying ALL elements
  const [formData, setFormData] = useState({
    // Basic Identifiers
    first_name: "", middle_name: "", last_name: "", titles: "", gender: "Male", birthdate: "",
    place_of_birth: "", civil_status: "Single", nationality: "Filipino", religion: "", age: "",

    // Address & Contact
    address_street: "", address_barangay: "", address_city: "", address_province: "", address_zip: "", address_country: "Philippines",
    contact_phone: "", contact_email: "",

    // Parents
    father_name: "", father_status: "Living", father_occupation: "",
    mother_maiden_name: "", mother_status: "Living", mother_occupation: "",

    // Admin Only fields (for मास्टरlist/profile)
    classification_ii: "", present_rank_start: "", present_rank_end: "",

    // Tax & IDs
    sss: "", tin: "", philhealth: "", pag_ibig: "", peraa: "", tax_status: "Single",
    height: "", weight: "", blood_type: "", distinguishing_marks: "",

    // Spouse Info
    spouse_name: "", spouse_gender: "Female", spouse_birthdate: "", spouse_age: "",
    spouse_employer: "", spouse_position: "", spouse_employment_status: "",
    spouse_children: [],
    emergency_contacts: [],

    // Grid Tracking Collections
    educational_record: [],
    internal_trainings: [],
    external_trainings: [],
    previous_employment: [],
    awards_citations: [],
    scholarships_research: [],
    licenses: [],
    exams_taken: [],
    skills: [],
    group_affiliations: [],
    extra_activities: [],
    languages: []
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSelect = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };
  const handleGrid = (key, data) => {
    setFormData({ ...formData, [key]: data });
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!user?.id) {
      toast.error("Your session is missing. Please log in again.");
      return;
    }

    const acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!acceptedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a PNG or JPG image.");
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeBytes) {
      toast.error("Signature file is too large. Please upload a file under 5MB.");
      return;
    }

    // Set preview immediately
    if (signaturePreviewUrl) {
      URL.revokeObjectURL(signaturePreviewUrl);
    }
    const preview = URL.createObjectURL(file);
    setSignaturePreviewUrl(preview);

    setIsUploadingSignature(true);
    try {
      const fileExt = (file.name.split('.').pop() || "png").toLowerCase();
      const objectPath = `signatures/${user.id}.${fileExt}`;

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

      if (!publicUrl) {
        throw new Error("Signature upload succeeded but file URL was not generated.");
      }

      if (signaturePreviewUrl && signaturePreviewUrl !== preview) {
        URL.revokeObjectURL(signaturePreviewUrl);
      }
      setSignatureUrl(publicUrl);
      toast.success("E-signature uploaded successfully.");
    } catch (err) {
      console.error("Upload error:", err);
      const msg = err.message || "Unknown storage error";
      if (msg.toLowerCase().includes("row-level security")) {
        toast.error("Upload blocked by storage policy. Please ensure the 'avatars' bucket allows uploads to your user folder.");
      } else {
        toast.error(`Signature upload failed: ${msg}`);
      }
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const isSectionIncomplete = (id) => {
    switch (id) {
      case "personal": return !formData.first_name || !formData.last_name || !formData.birthdate;
      case "family": return !formData.contact_phone;
      case "certify": return !certified || !signatureName || !signatureUrl;
      default: return false;
    }
  };

  const validateFullForm = () => {
    const missing = [];
    if (!formData.first_name || !formData.last_name || !formData.birthdate) missing.push("Personal Data");
    if (!formData.contact_phone) missing.push("Contact Phone");
    if (!certified) missing.push("Electronic Waiver Agreement");
    if (!signatureName) missing.push("Typed Signature Name");
    if (!signatureUrl) missing.push("E-Signature Image Upload");
    return missing;
  };

  const submitRegistration = async () => {
    if (!user?.id) {
      toast.error("Your session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const missingFields = validateFullForm();
    if (missingFields.length > 0) {
      toast.error(`Please complete the following: ${missingFields.join(", ")}`);
      // Scroll to top or switch tab if needed, but the toast gives immediate direction
      if (!formData.first_name || !formData.last_name) setActiveTab("personal");
      else if (!formData.contact_phone) setActiveTab("family");
      else setActiveTab("certify");
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate next EMP ID standard: [year] - 001
      const year = new Date().getFullYear();
      
      // Query to find the highest existing ID for the current year
      const { data: lastEmp, error: lastEmpError } = await supabase
        .from('employees')
        .select('employee_id')
        .ilike('employee_id', `${year} - %`)
        .order('employee_id', { ascending: false })
        .limit(1);
      
      if (lastEmpError) throw lastEmpError;
      
      let nextIdNumber = 1;
      if (lastEmp && lastEmp.length > 0) {
        const lastId = lastEmp[0].employee_id;
        const parts = lastId.split(' - ');
        if (parts.length === 2) {
          nextIdNumber = parseInt(parts[1], 10) + 1;
        }
      }
      const generatedTempId = `${year} - ${String(nextIdNumber).padStart(3, '0')}`;

      // Postgres/Supabase strict typing fix: convert empty strings to null
      const sanitizedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key, 
          value === "" ? null : value
        ])
      );

      const { error } = await supabase
        .from('employees')
        .insert([{
          ...sanitizedData,
          user_id: user?.id,
          employee_id: generatedTempId,
          is_active: false,
          employment_status: "Pending",
          signature_url: signatureUrl || null
        }]);

      if (error) {
        if (error.code === '23505') toast.error("Employee ID conflict. Try again.");
        else toast.error(error.message);
        throw error;
      }

      toast.success("Profile registered successfully. Please log in to your account.");
      
      // Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'employee',
        actor_name: `${formData.first_name} ${formData.last_name}`,
        action: 'employee_submitted_registration',
        description: `New employee registration submitted by ${formData.first_name} ${formData.last_name}`
      });

      // Logout and return to login page to ensure clean session state
      await logout();
      navigate("/login");

    } catch (err) {
      console.error("Submission Error:", err);
      toast.error(`Submission Failed: ${err.message || "An unexpected error occurred."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscardRegistration = async () => {
    setIsDiscarding(true);
    try {
      if (user?.id) {
        // 1. Delete from employees table
        await supabase.from('employees').delete().eq('id', user.id);
        
        // 2. Delete Auth user using Admin client
        if (supabaseAdmin) {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          if (deleteError) throw deleteError;
        } else {
          throw new Error("Admin service unavailable.");
        }
      }

      toast.success("Registration discarded and account deleted.");
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Discard Error:", err);
      toast.error(err.message || "Failed to discard registration.");
    } finally {
      setIsDiscarding(false);
      setShowDiscardDialog(false);
    }
  };

  const tabs = [
    { id: "profiling", label: "Personal Details", icon: User },
    { id: "education", label: "Educational Record", icon: GraduationCap },
    { id: "training", label: "Trainings and Development", icon: Award },
    { id: "employment", label: "Employment Info", icon: Briefcase },
  ];

  const handleNextTab = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    } else {
      setActiveTab("certify");
    }
  };

  const handleBackTab = () => {
    if (activeTab === "certify") {
      setActiveTab("employment");
      return;
    }
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">

      {/* Top Header */}
      <div className="bg-[#0C005F] text-white py-4 px-8 flex justify-between items-center shadow-md z-10 shrink-0">
        <div className="flex items-center gap-6">
          <img
            src="/assets/ub-hris-logo-white.png"
            alt="UB HRIS"
            className="h-10 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'block';
            }}
          />
          <FileText className="w-8 h-8 text-white/80 hidden" />
          <div>
            <h1 className="text-xl font-bold leading-none">Personnel Information</h1>
            <p className="text-xs text-white/70 mt-1 uppercase tracking-wider">Digital 201 Form Filing</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                disabled={isDiscarding}
                className="bg-red-500 hover:bg-red-600 text-white h-10 font-bold"
              >
                {isDiscarding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Discarding...
                  </>
                ) : (
                  "Discard"
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[#0C005F] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Discard Registration?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and all the information you've entered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-slate-200 hover:bg-slate-50">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDiscardRegistration}
                  className="bg-red-600 hover:bg-red-700 text-white border-none"
                >
                  Confirm Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={() => setActiveTab("certify")} className="bg-white text-[#0C005F] hover:bg-white/90 h-10 font-bold">
            Go to Submit
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          {activeTab !== "certify" && (
            <div className="bg-white border-b border-slate-200 px-8 py-2 shrink-0">
              <TabsList className="w-full justify-center bg-transparent h-auto flex-wrap gap-2 p-0">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id}
                      className="gap-2 rounded-lg data-[state=active]:bg-[#0C005F] data-[state=active]:shadow-none data-[state=active]:text-white py-2 px-4 border border-transparent"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-semibold text-xs">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          )}

          <ScrollArea className="flex-1 bg-slate-50 relative">
            <div className="max-w-5xl mx-auto p-8 pb-32">
              <TabsContent value="profiling" className="m-0 focus-visible:ring-0 space-y-8">
                <PersonalSection formData={formData} handleChange={handleChange} handleSelect={handleSelect} handleGrid={handleGrid} langCols={langCols} />
                <FamilySection 
                  formData={formData} 
                  handleChange={handleChange} 
                  handleSelect={handleSelect} 
                  handleGrid={handleGrid} 
                  emergencyCols={emergencyCols} 
                  childrenCols={childrenCols} 
                />
              </TabsContent>

              <TabsContent value="education" className="m-0 focus-visible:ring-0">
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Educational Background" columns={eduCols} data={formData.educational_record} onChange={(d) => handleGrid('educational_record', d)} />
                </div>
              </TabsContent>

              <TabsContent value="training" className="m-0 focus-visible:ring-0 space-y-8">
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Internal Trainings" columns={trainCols} data={formData.internal_trainings} onChange={(d) => handleGrid('internal_trainings', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="External Trainings (within 5 years)" columns={trainCols} data={formData.external_trainings} onChange={(d) => handleGrid('external_trainings', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Awards & Citations" columns={awardsCols} data={formData.awards_citations} onChange={(d) => handleGrid('awards_citations', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Scholarships & Research Work" columns={scholarCols} data={formData.scholarships_research} onChange={(d) => handleGrid('scholarships_research', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Professional Licenses" columns={licenseCols} data={formData.licenses} onChange={(d) => handleGrid('licenses', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Government & Board Examinations" columns={examsCols} data={formData.exams_taken} onChange={(d) => handleGrid('exams_taken', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Specific Skills" columns={skillsCols} data={formData.skills} onChange={(d) => handleGrid('skills', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Group Affiliations" columns={affiliationCols} data={formData.group_affiliations} onChange={(d) => handleGrid('group_affiliations', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Extra Activities / Services" columns={extraCols} data={formData.extra_activities} onChange={(d) => handleGrid('extra_activities', d)} />
                </div>
              </TabsContent>

              <TabsContent value="employment" className="m-0 focus-visible:ring-0">
                <HistorySection formData={formData} handleGrid={handleGrid} prevEmpCols={prevEmpCols} />
              </TabsContent>

              {activeTab === "certify" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SubmissionSection 
                    certified={certified} 
                    setCertified={setCertified} 
                    signatureName={signatureName} 
                    setSignatureName={setSignatureName} 
                    signatureUrl={signatureUrl} 
                    signaturePreviewUrl={signaturePreviewUrl}
                    handleSignatureUpload={handleSignatureUpload} 
                    isUploadingSignature={isUploadingSignature} 
                    submitRegistration={submitRegistration} 
                    isSubmitting={isSubmitting} 
                  />
                </div>
              )}
            </div>
            
            <div className="fixed bottom-0 right-0 left-0 bg-white border-t p-4 flex justify-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="max-w-5xl w-full flex justify-between">
                <Button 
                  onClick={handleBackTab} 
                  disabled={activeTab === "profiling"}
                  className="px-8 h-12 font-bold rounded-lg group bg-red-600 hover:bg-red-700 text-white border-none shadow-md disabled:bg-slate-300 disabled:text-slate-500"
                >
                  <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back
                </Button>

                {activeTab !== "certify" && (
                  <Button 
                    onClick={handleNextTab} 
                    className="bg-[#0C005F] hover:bg-[#0C005F]/90 text-white px-8 h-12 font-bold rounded-lg shadow-lg group"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
