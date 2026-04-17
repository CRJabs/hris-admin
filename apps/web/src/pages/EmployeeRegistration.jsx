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
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

// Grid Span Distribution has been meticulously upgraded to 24-sum layouts!
// This explicitly forces ShadCN to gracefully push the row halfway down creating 2-level entries natively.
const emergencyCols = [
  { key: 'name', label: 'Contact Name', span: 3 }, { key: 'relation', label: 'Relation', span: 2 },
  { key: 'address', label: 'Contact Address', span: 3 }, { key: 'mobile', label: 'Mobile', span: 2 }, { key: 'office', label: 'Office/Home', span: 2 }
];
const childrenCols = [
  { key: 'name', label: "Child's Name", span: 8 }, { key: 'birthdate', label: 'Date of Birth', type: 'date', span: 4 }, // row 1
  { key: 'age', label: 'Age', span: 2 }, { key: 'gender', label: 'Gender', span: 3 },
  { key: 'enrolled', label: 'Enrolled At', span: 4 }, { key: 'course', label: 'Course & YR', span: 3 } // row 2
];
const awardsCols = [
  { key: 'type', label: 'Reward Type', span: 4 }, { key: 'name', label: 'Reward Name', span: 8 }, // row 1
  { key: 'agency', label: 'Granting Agency/Org', span: 4 }, { key: 'date', label: 'Date Given', type: 'date', span: 3 },
  { key: 'place', label: 'Place Given', span: 3 }, { key: 'remarks', label: 'Remarks', span: 2 } // row 2
];
const scholarCols = [
  { key: 'type', label: 'Work Type', span: 4 }, { key: 'spec', label: 'Specification', span: 4 }, { key: 'title', label: 'Complete Title', span: 4 }, // row 1
  { key: 'status', label: 'Work Status', span: 2 }, { key: 'agency', label: 'Granting Agency', span: 3 }, { key: 'date', label: 'Date Given', type: 'date', span: 2 },
  { key: 'place', label: 'Place Given', span: 2 }, { key: 'remarks', label: 'Remarks', span: 3 } // row 2
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
  { key: 'type', label: 'Service/Activity Type', span: 4 }, { key: 'nature_act', label: 'Nature of Activity/Project', span: 8 }, // row 1
  { key: 'nature_part', label: 'Nature of Participation', span: 5 }, { key: 'date', label: 'Date', type: 'date', span: 3 },
  { key: 'remarks', label: 'Remarks', span: 4 } // row 2
];
const prevEmpCols = [
  { key: 'company', label: 'Company Name & Address', span: 6 }, { key: 'position', label: 'Position', span: 3 }, { key: 'status', label: 'Emp Status', span: 3 }, // row 1
  { key: 'dept', label: 'Office/Dept', span: 2 }, { key: 'salary', label: 'Salary', span: 2 }, { key: 'start', label: 'Date of Emp', type: 'date', span: 2 },
  { key: 'end', label: 'Date Resigned', type: 'date', span: 2 }, { key: 'resp', label: 'Responsibility', span: 2 }, { key: 'reason', label: 'Reason for Leaving', span: 2 } // row 2
];
const eduCols = [
  { key: 'level', label: 'Level', span: 3 }, { key: 'school', label: 'Name of School', span: 5 }, { key: 'address', label: 'School Address', span: 4 }, // row 1
  { key: 'degree', label: 'Degree Earned', span: 3 }, { key: 'gradYear', label: 'Grad Year', span: 2 }, { key: 'units', label: 'Units Completed', span: 2 },
  { key: 'thesis', label: 'Thesis/Dissertation', span: 2 }, { key: 'gwa', label: 'GWA', span: 1 }, { key: 'inclusive', label: 'Inclusive Dates', span: 2 } // row 2
];
const trainCols = [
  { key: 'name', label: 'Seminar/Training Name', span: 5 }, { key: 'type', label: 'Type', span: 3 }, { key: 'budget', label: 'Approved Budget', span: 4 }, // row 1
  { key: 'venue', label: 'Venue', span: 3 }, { key: 'duration', label: 'Duration', span: 2 }, { key: 'conducted', label: 'Conducted By', span: 2 },
  { key: 'dates', label: 'Inclusive Dates', span: 2 }, { key: 'notes', label: 'Notes', span: 3 } // row 2
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

      const { error } = await supabase
        .from('employees')
        .insert([{
          ...formData,
          user_id: user?.id,
          employee_id: generatedTempId, // Auto generating
          is_active: true,
          signature_url: signatureUrl
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
          {/* HRIS Logo strictly without invert and with increased gap! */}
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

        {/* Left Vertical Stepper Menu - LOCKED IN PLACE */}
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

        {/* Right Content Area - ALLOWS SCROLLING INDEPENDENTLY */}
        <ScrollArea className="flex-1 bg-slate-50 relative p-4 md:p-8">
          <div className="max-w-5xl mx-auto pb-32">

            {/* 1. PERSONAL */}
            {activeTab === "personal" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Personal Information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-1 md:col-span-1"><Label>Given Name *</Label><Input name="first_name" value={formData.first_name} onChange={handleChange} /></div>
                    <div className="space-y-1 md:col-span-1"><Label>Middle Name</Label><Input name="middle_name" value={formData.middle_name} onChange={handleChange} /></div>
                    <div className="space-y-1 md:col-span-1"><Label>Family Name / Surname *</Label><Input name="last_name" value={formData.last_name} onChange={handleChange} /></div>
                    <div className="space-y-1 md:col-span-1"><Label>Titles / Post-Nominals</Label><Input name="titles" value={formData.titles} onChange={handleChange} placeholder="e.g. PhD, LPT" /></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                    <div className="space-y-1">
                      <Label>Gender</Label>
                      <Select value={formData.gender} onValueChange={(val) => handleSelect("gender", val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>Civil Status</Label>
                      <Select value={formData.civil_status} onValueChange={(val) => handleSelect("civil_status", val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Widow/Widower">Widow/Widower</SelectItem>
                          <SelectItem value="Separated/Divorced">Separated/Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1"><Label>Birth Date *</Label><Input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Place of Birth</Label><Input name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Age</Label><Input type="number" name="age" value={formData.age} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Nationality</Label><Input name="nationality" value={formData.nationality} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Religion</Label><Input name="religion" value={formData.religion} onChange={handleChange} /></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="space-y-1"><Label>Height (cms)</Label><Input name="height" value={formData.height} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Weight (lbs)</Label><Input name="weight" value={formData.weight} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Blood Type</Label><Input name="blood_type" value={formData.blood_type} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Distinguishing Marks</Label><Input name="distinguishing_marks" value={formData.distinguishing_marks} onChange={handleChange} /></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Government ID's</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1"><Label>SSS No.</Label><Input name="sss" value={formData.sss} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>TIN No.</Label><Input name="tin" value={formData.tin} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Philhealth No.</Label><Input name="philhealth" value={formData.philhealth} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>PAG-IBIG No.</Label><Input name="pag_ibig" value={formData.pag_ibig} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>PERAA (Teaching Staff)</Label><Input name="peraa" value={formData.peraa} onChange={handleChange} /></div>
                    <div className="space-y-1">
                      <Label>Tax Status</Label>
                      <Select value={formData.tax_status} onValueChange={(val) => handleSelect("tax_status", val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Head of the Family">Head of the Family</SelectItem>
                          <SelectItem value="Zero">Zero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FAMILY & CONTACT */}
            {activeTab === "family" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Contact Information</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1"><Label>Mobile No. *</Label><Input name="contact_phone" value={formData.contact_phone} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Email Address</Label><Input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} /></div>
                    <div className="space-y-1 col-span-2"><Label>Complete Permanent Address</Label><Input name="address_street" value={formData.address_street} onChange={handleChange} placeholder="House No., Street, Subdivision" /></div>
                    <div className="space-y-1"><Label>City/Municipality</Label><Input name="address_city" value={formData.address_city} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Province</Label><Input name="address_province" value={formData.address_province} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Country</Label><Input name="address_country" value={formData.address_country} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Zip Code</Label><Input name="address_zip" value={formData.address_zip} onChange={handleChange} /></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Emergency Contact Line" columns={emergencyCols} data={formData.emergency_contacts} onChange={(d) => handleGrid('emergency_contacts', d)} />
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Spousal Details</h2>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1 col-span-2"><Label>Spouse Name</Label><Input name="spouse_name" value={formData.spouse_name} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Gender</Label><Input name="spouse_gender" value={formData.spouse_gender} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Birth Date</Label><Input type="date" name="spouse_birthdate" value={formData.spouse_birthdate} onChange={handleChange} /></div>
                    <div className="space-y-1 col-span-2"><Label>Employer</Label><Input name="spouse_employer" value={formData.spouse_employer} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Position/Job Title</Label><Input name="spouse_position" value={formData.spouse_position} onChange={handleChange} /></div>
                    <div className="space-y-1"><Label>Employment Status</Label><Input name="spouse_employment_status" value={formData.spouse_employment_status} onChange={handleChange} /></div>
                  </div>
                </div>

                {/* Upgraded to 2-row layout */}
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Children Profiles" columns={childrenCols} data={formData.spouse_children} onChange={(d) => handleGrid('spouse_children', d)} />
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Parent's Details</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4 border-r pr-8">
                      <div className="space-y-1"><Label>Father's Name</Label><Input name="father_name" value={formData.father_name} onChange={handleChange} /></div>
                      <div className="space-y-1"><Label>Occupation (If Living)</Label><Input name="father_occupation" value={formData.father_occupation} onChange={handleChange} /></div>
                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={formData.father_status === "Living"} onCheckedChange={() => handleSelect("father_status", "Living")} /> Living</label>
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={formData.father_status === "Deceased"} onCheckedChange={() => handleSelect("father_status", "Deceased")} /> Deceased</label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1"><Label>Mother's Name</Label><Input name="mother_name" value={formData.mother_name} onChange={handleChange} /></div>
                      <div className="space-y-1"><Label>Occupation (If Living)</Label><Input name="mother_occupation" value={formData.mother_occupation} onChange={handleChange} /></div>
                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={formData.mother_status === "Living"} onCheckedChange={() => handleSelect("mother_status", "Living")} /> Living</label>
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={formData.mother_status === "Deceased"} onCheckedChange={() => handleSelect("mother_status", "Deceased")} /> Deceased</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PREVIOUS EMPLOYMENT */}
            {activeTab === "history" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-xl border shadow-sm">
                  {/* Upgraded to 2-row layout internally mapping spans */}
                  <div className="w-full">
                    <DynamicGrid title="Previous Employment Records" columns={prevEmpCols} data={formData.previous_employment} onChange={(d) => handleGrid('previous_employment', d)} />
                  </div>
                </div>
              </div>
            )}

            {/* 4. EDUCATION & TRAINING */}
            {activeTab === "education" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-xl border shadow-sm">
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[1000px]">
                      <DynamicGrid title="Educational Background" columns={eduCols} data={formData.educational_record} onChange={(d) => handleGrid('educational_record', d)} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Internal Trainings" columns={trainCols} data={formData.internal_trainings} onChange={(d) => handleGrid('internal_trainings', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="External Trainings (within 5 years)" columns={trainCols} data={formData.external_trainings} onChange={(d) => handleGrid('external_trainings', d)} />
                </div>
              </div>
            )}

            {/* 5. CERTIFICATION & SKILLS */}
            {activeTab === "background" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Languages Spoken" columns={langCols} data={formData.languages} onChange={(d) => handleGrid('languages', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Specific Skills" columns={skillsCols} data={formData.skills} onChange={(d) => handleGrid('skills', d)} />
                </div>

                {/* Both Upgraded to 2-row layouts */}
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Awards & Citations" columns={awardsCols} data={formData.awards_citations} onChange={(d) => handleGrid('awards_citations', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Extra Activities / Services" columns={extraCols} data={formData.extra_activities} onChange={(d) => handleGrid('extra_activities', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Group Affiliations" columns={affiliationCols} data={formData.group_affiliations} onChange={(d) => handleGrid('group_affiliations', d)} />
                </div>
              </div>
            )}

            {/* 6. CREDENTIALS */}
            {activeTab === "credentials" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Professional Licenses" columns={licenseCols} data={formData.licenses} onChange={(d) => handleGrid('licenses', d)} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Exams Taken" columns={examsCols} data={formData.exams_taken} onChange={(d) => handleGrid('exams_taken', d)} />
                </div>
                {/* Upgraded to 2-row layout */}
                <div className="bg-white rounded-xl border shadow-sm">
                  <DynamicGrid title="Scholarships & Research Works" columns={scholarCols} data={formData.scholarships_research} onChange={(d) => handleGrid('scholarships_research', d)} />
                </div>
              </div>
            )}

            {/* 7. SUBMISSION */}
            {activeTab === "certify" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto mt-12">
                <div className="bg-white p-10 rounded-2xl border shadow-xl text-center">
                  <div className="w-16 h-16 bg-[#0C005F]/10 text-[#0C005F] rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Final Certification</h2>
                  <p className="text-slate-500 mb-8 text-sm">Please review the declarations below to permanently append this HRIS file.</p>

                  <div className="bg-slate-50 p-6 rounded-lg text-left text-sm text-slate-700 space-y-4 mb-8">
                    <p className="leading-relaxed font-medium">"I certify that all given information are true and complete to the best of my knowledge."</p>
                    <p className="leading-relaxed font-medium">"I also authorize the University of Bohol to perform a background screening check (including future screenings for retention, reassignment or promotion, if applicable)."</p>
                  </div>

                  <div className="space-y-6 text-left border-t pt-8">
                    <div className="flex items-center space-x-3 mb-6 bg-blue-50/50 p-4 border border-blue-100 rounded-md">
                      <Checkbox id="terms" checked={certified} onCheckedChange={setCertified} />
                      <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#0C005F]">
                        I agree to the electronic waiver and statements above.
                      </label>
                    </div>

                    <div className="space-y-4 max-w-sm mx-auto w-full">
                      <Label className="text-center block">Signature (Type Full Government Name) *</Label>
                      <Input value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="Type identifying name" className="text-center font-semibold tracking-wider text-slate-800 h-10" />

                      <div className="pt-2">
                        <Label className="text-center block mb-2">E-Signature Attachment (PNG/JPG) *</Label>
                        {signatureUrl ? (
                          <div className="border rounded-md overflow-hidden bg-slate-50 relative group">
                            <img src={signatureUrl} alt="E-signature" className="h-24 w-full object-contain mix-blend-multiply" />
                            <label className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                              <span className="text-white text-xs font-bold flex items-center gap-1"><Upload className="w-3 h-3" /> Re-upload</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleSignatureUpload} disabled={isUploadingSignature} />
                            </label>
                          </div>
                        ) : (
                          <label className={`border-2 border-dashed rounded-md h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors ${isUploadingSignature ? 'opacity-50' : ''}`}>
                            {!isUploadingSignature ? (
                              <>
                                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                                <span className="text-xs text-slate-500 font-medium">Click to upload signature</span>
                              </>
                            ) : (
                              <>
                                <Loader2 className="w-5 h-5 text-slate-400 mb-1 animate-spin" />
                                <span className="text-xs text-slate-500 font-medium">Uploading...</span>
                              </>
                            )}
                            <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleSignatureUpload} disabled={isUploadingSignature} />
                          </label>
                        )}
                      </div>

                    </div>

                    <div className="pt-6 text-center">
                      <Button onClick={submitRegistration} disabled={isSubmitting || isUploadingSignature} className="w-full max-w-sm h-12 bg-[#0C005F] hover:bg-[#1900C5] text-white font-bold text-base shadow-md">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting 201 Form...
                          </>
                        ) : (
                          "Submit 201 Form"
                        )}
                      </Button>
                      <p className="text-[10px] text-slate-400 mt-2 italic">Ensure all required sections are completed before submitting.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
