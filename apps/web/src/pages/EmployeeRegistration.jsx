import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState("");
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  useEffect(() => {
    return () => {
      if (signaturePreviewUrl) {
        URL.revokeObjectURL(signaturePreviewUrl);
      }
    };
  }, [signaturePreviewUrl]);

  // Flat State Dictionary carrying ALL elements
  const [formData, setFormData] = useState({
    // Basic Identifiers
    first_name: "", middle_name: "", last_name: "", titles: "", gender: "Male", birthdate: "",
    place_of_birth: "", civil_status: "Single", nationality: "Filipino", religion: "", age: "",

    // Address & Contact
    address_street: "", address_barangay: "", address_city: "", address_province: "", address_zip: "", address_country: "Philippines",
    contact_phone: "", contact_email: "",

    // Parents
    father_name: "", father_status: "Living",
    mother_maiden_name: "", mother_status: "Living",

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

    setIsUploadingSignature(true);
    try {
      const fileExt = (file.name.split('.').pop() || "png").toLowerCase();
      const objectPath = `${user.id}/signatures/sig_${Date.now()}.${fileExt}`;

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

      if (signaturePreviewUrl) {
        URL.revokeObjectURL(signaturePreviewUrl);
      }
      setSignaturePreviewUrl(URL.createObjectURL(file));
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
      
      // Query to find the count of employees with ID starting with the current year
      const { count, error: countError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .filter('employee_id', 'ilike', `${year} - %`);
      
      if (countError) throw countError;
      
      const nextIdNumber = (count || 0) + 1;
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
    if (isDiscarding) return;

    const shouldDiscard = window.confirm(
      "Discard your registration and permanently delete this account?"
    );
    if (!shouldDiscard) return;

    setIsDiscarding(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        await logout();
        navigate("/login");
        return;
      }

      const response = await fetch("/api/delete-auth-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session expired. Please log in again, then discard your registration."
          );
        }
        if (response.status === 500) {
          throw new Error(
            "Could not delete your account right now. Please try again in a few moments or contact HR support."
          );
        }
        throw new Error(result?.error || "Unable to discard registration.");
      }

      toast.success("Registration discarded. Account deleted.");
      await logout();
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Failed to discard registration.");
      toast.info("If this keeps happening, log out and back in, then try Discard again.");
    } finally {
      setIsDiscarding(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Data", icon: User },
    { id: "family", label: "Family & Contacts", icon: Users },
    { id: "history", label: "Previous Employment", icon: BookOpen },
    { id: "education", label: "Education, Training & Skills", icon: GraduationCap },
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
          <Button
            type="button"
            onClick={handleDiscardRegistration}
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
              <PersonalSection formData={formData} handleChange={handleChange} handleSelect={handleSelect} handleGrid={handleGrid} langCols={langCols} />
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
              <EducationSection 
                formData={formData} 
                handleGrid={handleGrid} 
                eduCols={eduCols} 
                trainCols={trainCols} 
                skillsCols={skillsCols}
                awardsCols={awardsCols}
                extraCols={extraCols}
                affiliationCols={affiliationCols}
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
                signaturePreviewUrl={signaturePreviewUrl}
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
