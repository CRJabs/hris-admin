import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ChevronRight, FileText, Upload, Save, User, Briefcase, Users, Shield, Award, BookOpen, GraduationCap, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { PersonalSection } from "../components/employees/registration/sections/PersonalSection";
import { FamilySection } from "../components/employees/registration/sections/FamilySection";
import { HistorySection } from "../components/employees/registration/sections/HistorySection";
import { EducationSection } from "../components/employees/registration/sections/EducationSection";
import { SkillsSection } from "../components/employees/registration/sections/SkillsSection";
import { CredentialsSection } from "../components/employees/registration/sections/CredentialsSection";
import { SubmissionSection } from "../components/employees/registration/sections/SubmissionSection";

// Grid Span Distributions
const emergencyCols = [
  { key: 'name', label: 'Contact Name', span: 3 }, { key: 'relation', label: 'Relation', span: 2 },
  { key: 'address', label: 'Contact Address', span: 3 }, { key: 'mobile', label: 'Mobile', span: 2 }, { key: 'office', label: 'Office/Home', span: 2 }
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
  { key: 'type', label: 'Work Type', span: 4 }, { key: 'spec', label: 'Specification', span: 4 }, { key: 'title', label: 'Complete Title', span: 4 },
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
const prevEmpCols = [
  { key: 'company', label: 'Company Name & Address', span: 6 }, { key: 'position', label: 'Position', span: 3 }, { key: 'status', label: 'Emp Status', span: 3 },
  { key: 'dept', label: 'Office/Dept', span: 2 }, { key: 'salary', label: 'Salary', span: 2 }, { key: 'start', label: 'Date of Emp', type: 'date', span: 2 },
  { key: 'end', label: 'Date Resigned', type: 'date', span: 2 }, { key: 'resp', label: 'Responsibility', span: 2 }, { key: 'reason', label: 'Reason for Leaving', span: 2 }
];
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

export default function EmployeeRegistration() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certified, setCertified] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  // Flat State Dictionary carrying ALL elements
  const [formData, setFormData] = useState({
    // Basic Identifiers
    first_name: "", middle_name: "", last_name: "", titles: "", gender: "Male", birthdate: "",
    place_of_birth: "", civil_status: "Single", nationality: "Filipino", religion: "", age: "",

    // Address & Contact
    address_street: "", address_barangay: "", address_city: "", address_province: "", address_zip: "", address_country: "Philippines",
    contact_phone: "", contact_email: "",

    // Parents
    father_name: "", father_occupation: "", father_status: "Living",
    mother_name: "", mother_occupation: "", mother_status: "Living",

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

    setIsUploadingSignature(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `sig_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setSignatureUrl(publicUrl);
      toast.success("E-signature uploaded successfully.");
    } catch (err) {
      console.error("Upload error:", err);
      const msg = err.message || "Unknown storage error";
      toast.error(`Signature Upload Failed: ${msg}. Check if your bucket is public and has INSERT policies.`);
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
      const generatedTempId = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;

      // Postgres/Supabase strict typing fix: convert empty strings to null
      // This prevents "invalid input syntax for type date" errors
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
          employee_id: generatedTempId, // Auto generating
          is_active: true,
          signature_url: signatureUrl || null
        }]);

      if (error) {
        if (error.code === '23505') toast.error("Employee ID conflict. Try again.");
        else toast.error(error.message);
        throw error;
      }

      toast.success("Profile registered successfully. Please log in to your account.");
      
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

  const tabs = [
    { id: "personal", label: "Personal Data", icon: User },
    { id: "family", label: "Family & Contacts", icon: Users },
    { id: "history", label: "Previous Employment", icon: BookOpen },
    { id: "education", label: "Education & Training", icon: GraduationCap },
    { id: "background", label: "Certification & Skills", icon: Award },
    { id: "credentials", label: "Credentials", icon: Shield },
    { id: "certify", label: "Submission", icon: CheckCircle },
  ];

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
          <div className="bg-red-500 hover:bg-red-600 rounded-md transition-colors">
            <Link to="/employees" className="text-sm font-bold text-white px-4 py-2 flex items-center h-10 rounded-md">Discard</Link>
          </div>
          <Button onClick={() => setActiveTab("certify")} className="bg-white text-[#0C005F] hover:bg-white/90 h-10 font-bold">
            Go to Submit
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Vertical Stepper Menu */}
        <div className="w-72 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0 z-0">
          <div className="p-4 space-y-2 mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Sections</p>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isInc = isSectionIncomplete(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-[#0C005F] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {tab.label}
                  </div>
                  {isInc && !isActive && <AlertCircle className="w-4 h-4 text-red-500" />}
                  {isInc && isActive && <AlertCircle className="w-4 h-4 text-white/80" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <ScrollArea className="flex-1 bg-slate-50 relative p-4 md:p-8">
          <div className="max-w-5xl mx-auto pb-32">
            {activeTab === "personal" && (
              <PersonalSection formData={formData} handleChange={handleChange} handleSelect={handleSelect} />
            )}
            {activeTab === "family" && (
              <FamilySection 
                formData={formData} 
                handleChange={handleChange} 
                handleSelect={handleSelect} 
                handleGrid={handleGrid} 
                emergencyCols={emergencyCols} 
                childrenCols={childrenCols} 
              />
            )}
            {activeTab === "history" && (
              <HistorySection formData={formData} handleGrid={handleGrid} prevEmpCols={prevEmpCols} />
            )}
            {activeTab === "education" && (
              <EducationSection formData={formData} handleGrid={handleGrid} eduCols={eduCols} trainCols={trainCols} />
            )}
            {activeTab === "background" && (
              <SkillsSection 
                formData={formData} 
                handleGrid={handleGrid} 
                langCols={langCols} 
                skillsCols={skillsCols} 
                awardsCols={awardsCols} 
                extraCols={extraCols} 
                affiliationCols={affiliationCols} 
              />
            )}
            {activeTab === "credentials" && (
              <CredentialsSection 
                formData={formData} 
                handleGrid={handleGrid} 
                licenseCols={licenseCols} 
                examsCols={examsCols} 
                scholarCols={scholarCols} 
              />
            )}
            {activeTab === "certify" && (
              <SubmissionSection 
                certified={certified} 
                setCertified={setCertified} 
                signatureName={signatureName} 
                setSignatureName={setSignatureName} 
                signatureUrl={signatureUrl} 
                handleSignatureUpload={handleSignatureUpload} 
                isUploadingSignature={isUploadingSignature} 
                submitRegistration={submitRegistration} 
                isSubmitting={isSubmitting} 
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
